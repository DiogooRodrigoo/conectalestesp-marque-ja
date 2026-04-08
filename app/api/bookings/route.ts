import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/whatsapp/send";
import {
  confirmationMessage,
  ownerNotificationMessage,
} from "@/lib/whatsapp/templates";

interface CreateBookingBody {
  business_id: string;
  service_id: string;
  professional_id: string | null;
  client_name: string;
  client_phone: string;
  date: string;
  time: string;
  notes?: string;
}

// Server runs in UTC; always format in São Paulo local time for notifications
const SAO_PAULO_TZ = "America/Sao_Paulo";

function formatDatePtBR(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    timeZone: SAO_PAULO_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTimePtBR(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    timeZone: SAO_PAULO_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateBookingBody = await request.json();

    const required: (keyof CreateBookingBody)[] = [
      "business_id",
      "service_id",
      "client_name",
      "client_phone",
      "date",
      "time",
    ];

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json(
        { error: "date must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    if (!/^\d{2}:\d{2}$/.test(body.time)) {
      return NextResponse.json(
        { error: "time must be in HH:MM format" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClientWithServiceRole();

    const [businessResult, serviceResult] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, slot_duration, phone_whatsapp, booking_enabled")
        .eq("id", body.business_id)
        .single(),
      supabase
        .from("services")
        .select("id, name, duration_min, is_active")
        .eq("id", body.service_id)
        .single(),
    ]);

    if (businessResult.error || !businessResult.data) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    if (serviceResult.error || !serviceResult.data) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const business = businessResult.data;
    const service = serviceResult.data;

    if (!(business.booking_enabled ?? false)) {
      return NextResponse.json(
        { error: "Booking is currently disabled" },
        { status: 403 }
      );
    }

    if (!(service.is_active ?? true)) {
      return NextResponse.json(
        { error: "Service is not available" },
        { status: 400 }
      );
    }

    // Treat date+time as São Paulo local time (UTC-3, no DST since 2019)
    const startAt = new Date(`${body.date}T${body.time}:00-03:00`);
    const endAt = new Date(startAt.getTime() + (service.duration_min ?? 30) * 60 * 1000);

    if (isNaN(startAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid date or time" },
        { status: 400 }
      );
    }

    if (body.professional_id) {
      const { data: conflicts } = await supabase
        .from("appointments")
        .select("id")
        .eq("professional_id", body.professional_id)
        .in("status", ["confirmed", "pending"])
        .lt("start_at", endAt.toISOString())
        .gt("end_at", startAt.toISOString());

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          { error: "This time slot is no longer available" },
          { status: 409 }
        );
      }
    }

    const { data: professional } = body.professional_id
      ? await supabase
          .from("professionals")
          .select("name")
          .eq("id", body.professional_id)
          .single()
      : { data: null };

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        business_id: body.business_id,
        service_id: body.service_id,
        professional_id: body.professional_id ?? null,
        client_name: body.client_name,
        client_phone: body.client_phone,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        status: "confirmed",
        notes: body.notes ?? null,
        reminder_sent: false,
        confirmation_sent: false,
      })
      .select()
      .single();

    if (insertError || !appointment) {
      console.error("[POST /api/bookings] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create appointment" },
        { status: 500 }
      );
    }

    const formattedDate = formatDatePtBR(startAt);
    const formattedTime = formatTimePtBR(startAt);
    const professionalName = professional?.name ?? "Qualquer disponível";

    const notificationPromises: Promise<unknown>[] = [];

    notificationPromises.push(
      sendWhatsApp(
        body.client_phone,
        confirmationMessage({
          clientName: body.client_name,
          businessName: business.name,
          serviceName: service.name,
          professionalName,
          date: formattedDate,
          time: formattedTime,
          bookingId: appointment.id,
        })
      ).then(async (result) => {
        if (result.success) {
          await supabase
            .from("appointments")
            .update({ confirmation_sent: true })
            .eq("id", appointment.id);
        }
      })
    );

    if (business.phone_whatsapp) {
      notificationPromises.push(
        sendWhatsApp(
          business.phone_whatsapp,
          ownerNotificationMessage({
            ownerName: business.name,
            businessName: business.name,
            clientName: body.client_name,
            clientPhone: body.client_phone,
            serviceName: service.name,
            professionalName,
            date: formattedDate,
            time: formattedTime,
            notes: body.notes,
          })
        )
      );
    }

    Promise.allSettled(notificationPromises).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        appointment: {
          id: appointment.id,
          status: appointment.status,
          start_at: appointment.start_at,
          end_at: appointment.end_at,
          client_name: appointment.client_name,
          service_name: service.name,
          professional_name: professionalName,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
