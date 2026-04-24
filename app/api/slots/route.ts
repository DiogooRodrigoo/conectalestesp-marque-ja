import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";
import { getAvailableSlots } from "@/lib/scheduling/slots";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const business_id = searchParams.get("business_id");
    const professional_id = searchParams.get("professional_id");
    const date = searchParams.get("date");
    const durationParam = searchParams.get("duration");
    const requestedDuration = durationParam ? parseInt(durationParam, 10) : undefined;

    if (!business_id || !date) {
      return NextResponse.json(
        { error: "business_id and date are required" },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "date must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(date + "T00:00:00");
    if (requestedDate < today) {
      return NextResponse.json(
        { error: "Cannot request slots for past dates" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const supabaseSR = createServerSupabaseClientWithServiceRole();

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("slot_duration, booking_enabled, advance_booking_days, lunch_start, lunch_end")
      .eq("id", business_id)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (!business.booking_enabled) {
      return NextResponse.json(
        { error: "Booking is disabled for this business" },
        { status: 403 }
      );
    }

    const maxDate = new Date();
    // M-07: advance_booking_days=0 would silently block all bookings; enforce minimum of 1
    const advanceDays = Math.max(1, business.advance_booking_days ?? 30);
    maxDate.setDate(maxDate.getDate() + advanceDays);
    if (requestedDate > maxDate) {
      return NextResponse.json(
        { error: `Cannot book more than ${advanceDays} days in advance` },
        { status: 400 }
      );
    }

    const { data: businessHours, error: hoursError } = await supabase
      .from("business_hours")
      .select("*")
      .eq("business_id", business_id);

    if (hoursError || !businessHours) {
      return NextResponse.json(
        { error: "Failed to fetch business hours" },
        { status: 500 }
      );
    }

    // Use São Paulo timezone (UTC-3) boundaries so appointments near midnight
    // are correctly included in the right day's query
    const dayStart = `${date}T00:00:00-03:00`;
    const dayEnd = `${date}T23:59:59.999-03:00`;

    // Fetch ALL appointments for the day (all professionals) — needed for multi-professional union.
    // Must use service role: the anon key has no SELECT policy on appointments (removed in migration 010
    // for security), so an anon query silently returns [] and all slots appear free.
    const { data: appointments, error: apptError } = await supabaseSR
      .from("appointments")
      .select("start_at, end_at, professional_id")
      .eq("business_id", business_id)
      .gte("start_at", dayStart)
      .lte("start_at", dayEnd)
      .in("status", ["confirmed", "pending", "awaiting_payment"]);

    if (apptError) {
      return NextResponse.json(
        { error: "Failed to fetch appointments" },
        { status: 500 }
      );
    }

    const { data: blockedSlots, error: blockedError } = await supabaseSR
      .from("blocked_slots")
      .select("start_at, end_at, professional_id")
      .eq("business_id", business_id)
      .gte("start_at", dayStart)
      .lte("start_at", dayEnd);

    if (blockedError) {
      return NextResponse.json(
        { error: "Failed to fetch blocked slots" },
        { status: 500 }
      );
    }

    const mappedHours = businessHours.map((h) => ({
      day_of_week: h.day_of_week,
      is_open: h.is_open ?? false,
      open_time: h.open_time,
      close_time: h.close_time,
    }));
    const mappedAppointments = (appointments || []).map((a) => ({
      start_at: a.start_at,
      end_at: a.end_at,
      professional_id: a.professional_id ?? null,
    }));
    const mappedBlocked = (blockedSlots || []).map((b) => ({
      start_at: b.start_at,
      end_at: b.end_at,
      professional_id: b.professional_id,
    }));
    const slotDuration = business.slot_duration ?? 30;
    const reqDuration = requestedDuration && !isNaN(requestedDuration) ? requestedDuration : undefined;
    const lunchBreak =
      business.lunch_start && business.lunch_end
        ? { start: business.lunch_start, end: business.lunch_end }
        : undefined;

    let slots: string[];

    if (!professional_id) {
      // "Qualquer disponível": fetch active professionals and union their available slots
      const { data: professionals } = await supabaseSR
        .from("professionals")
        .select("id")
        .eq("business_id", business_id)
        .eq("is_active", true);

      const profIds = (professionals ?? []).map((p: { id: string }) => p.id);

      if (profIds.length > 0) {
        // A slot is available if at least one professional is free → union of per-professional slots
        const slotSet = new Set<string>();
        for (const profId of profIds) {
          const profSlots = getAvailableSlots({
            date,
            businessHours: mappedHours,
            appointments: mappedAppointments,
            blockedSlots: mappedBlocked,
            slotDuration,
            requestedDuration: reqDuration,
            professionalId: profId,
            lunchBreak,
          });
          for (const s of profSlots) slotSet.add(s);
        }
        slots = Array.from(slotSet).sort();
      } else {
        // No professionals configured — treat as single-resource business
        slots = getAvailableSlots({
          date,
          businessHours: mappedHours,
          appointments: mappedAppointments,
          blockedSlots: mappedBlocked,
          slotDuration,
          requestedDuration: reqDuration,
          lunchBreak,
        });
      }
    } else {
      slots = getAvailableSlots({
        date,
        businessHours: mappedHours,
        appointments: mappedAppointments,
        blockedSlots: mappedBlocked,
        slotDuration,
        requestedDuration: reqDuration,
        professionalId: professional_id,
        lunchBreak,
      });
    }

    return NextResponse.json({
      date,
      business_id,
      professional_id: professional_id ?? null,
      slot_duration: business.slot_duration ?? 30,
      slots,
    });
  } catch (err) {
    console.error("[GET /api/slots]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
