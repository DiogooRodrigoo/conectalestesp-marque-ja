import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

// A-05: exige payment_id além de appointment_id para evitar enumeração de status.
// payment_id (correlationID do OpenPix) só é conhecido por quem iniciou o PIX.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointment_id");
    const paymentId     = searchParams.get("payment_id");

    if (!appointmentId || !paymentId) {
      return NextResponse.json(
        { error: "appointment_id e payment_id são obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClientWithServiceRole();

    const { data: appointment, error } = await supabase
      .from("appointments")
      .select("id, status, payment_status, payment_expires_at, payment_paid_at, payment_id")
      .eq("id", appointmentId)
      .eq("payment_id", paymentId) // A-05: valida ownership via payment_id
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Considera pago se payment_status = "paid" OU se o status foi confirmado manualmente pelo painel
    if (appointment.payment_status === "paid" || appointment.status === "confirmed") {
      return NextResponse.json({
        status: "paid",
        paid_at: appointment.payment_paid_at,
      });
    }

    if (appointment.payment_status === "expired") {
      return NextResponse.json({ status: "expired" });
    }

    if (appointment.payment_expires_at) {
      const expiresAt = new Date(appointment.payment_expires_at);
      if (new Date() > expiresAt) {
        await supabase
          .from("appointments")
          .update({ payment_status: "expired", status: "cancelled" })
          .eq("id", appointmentId);

        return NextResponse.json({ status: "expired" });
      }
    }

    return NextResponse.json({ status: "awaiting" });
  } catch (err) {
    console.error("[GET /api/payments/pix/status]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
