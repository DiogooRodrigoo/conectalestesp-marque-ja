import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

// Impede o Next.js de cachear esta rota GET no Full Route Cache / Data Cache.
// Sem isso, o framework pode servir uma resposta "awaiting" em cache mesmo após
// o DB ter sido atualizado para "paid".
export const dynamic = "force-dynamic";

// M-05: The in-memory rate limit map was reset on every cold start (serverless).
// Removed: the appointment+payment_id ownership check already acts as a guard,
// and the DB query is indexed. Add Upstash/Redis rate limiting here if needed.

// A-05: exige payment_id além de appointment_id para evitar enumeração de status.
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

    const NO_CACHE = { headers: { "Cache-Control": "no-store, no-cache" } };

    // Considera pago se payment_status = "paid" OU se o status foi confirmado manualmente pelo painel
    if (appointment.payment_status === "paid" || appointment.status === "confirmed") {
      return NextResponse.json({
        status: "paid",
        paid_at: appointment.payment_paid_at,
      }, NO_CACHE);
    }

    if (appointment.payment_status === "expired") {
      return NextResponse.json({ status: "expired" }, NO_CACHE);
    }

    if (appointment.payment_expires_at) {
      const expiresAt = new Date(appointment.payment_expires_at);
      if (new Date() > expiresAt) {
        await supabase
          .from("appointments")
          .update({ payment_status: "expired", status: "cancelled" })
          .eq("id", appointmentId);

        return NextResponse.json({ status: "expired" }, NO_CACHE);
      }
    }

    return NextResponse.json({ status: "awaiting" }, NO_CACHE);
  } catch (err) {
    console.error("[GET /api/payments/pix/status]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
