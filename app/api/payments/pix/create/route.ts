import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

interface CreatePixBody {
  business_id: string;
  appointment_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePixBody = await request.json();

    if (!body.business_id || !body.appointment_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServerSupabaseClientWithServiceRole();

    // Busca appointment e business para validar
    const { data: appointment, error: apptError } = await supabase
      .from("appointments")
      .select("id, status, payment_status, business_id, payment_amount_cents")
      .eq("id", body.appointment_id)
      .eq("business_id", body.business_id)
      .single();

    if (apptError || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.status !== "awaiting_payment") {
      return NextResponse.json({ error: "Appointment is not awaiting payment" }, { status: 409 });
    }

    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("pix_enabled, pix_key, pix_holder_name")
      .eq("id", body.business_id)
      .single();

    if (bizError || !business || !business.pix_enabled || !business.pix_key) {
      return NextResponse.json({ error: "PIX not configured for this business" }, { status: 400 });
    }

    const appId = process.env.OPENPIX_APP_ID;
    if (!appId) {
      return NextResponse.json({ error: "PIX provider not configured" }, { status: 500 });
    }

    // C-01: amount comes from DB, never from client
    const amountCents = appointment.payment_amount_cents;
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Chama API OpenPix para gerar cobrança dinâmica
    const correlationID = `marqueja-${body.appointment_id}`;
    const pixRes = await fetch("https://api.openpix.com.br/api/v1/charge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: appId,
      },
      body: JSON.stringify({
        correlationID,
        value: amountCents,
        comment: `Sinal de reserva - Marque Já`,
        expiresIn: 600, // 10 minutos em segundos
        pixKey: business.pix_key,
        destinationAlias: business.pix_key,
        type: "DYNAMIC",
      }),
    });

    if (!pixRes.ok) {
      const pixError = await pixRes.text();
      console.error("[PIX create] OpenPix error:", pixRes.status, pixError);
      return NextResponse.json({ error: "Failed to create PIX charge" }, { status: 502 });
    }

    const pixData = await pixRes.json();
    const charge = pixData.charge ?? pixData;

    const paymentId = charge.correlationID ?? correlationID;
    const qrCode = charge.qrCodeImage ?? charge.brCode ?? "";
    const qrCodeText = charge.brCode ?? charge.pixKey ?? "";

    // Salva payment_id e expires_at no appointment
    await supabase
      .from("appointments")
      .update({
        payment_id: paymentId,
        payment_expires_at: expiresAt.toISOString(),
      })
      .eq("id", body.appointment_id);

    return NextResponse.json({
      qr_code: qrCode,
      qr_code_text: qrCodeText,
      payment_id: paymentId,
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/payments/pix/create]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
