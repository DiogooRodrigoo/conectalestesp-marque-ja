import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";
import { generatePixBRCode, generatePixQRCodeBase64 } from "@/lib/pix/brcode";
import { sendWhatsApp } from "@/lib/whatsapp/send";
import { formatPrice } from "@/lib/utils/formatters";

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

    const { data: appointment, error: apptError } = await supabase
      .from("appointments")
      .select("id, status, payment_status, payment_id, business_id, payment_amount_cents, client_name, client_phone, start_at")
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
      .select("id, name, pix_enabled, pix_key, address, phone_whatsapp")
      .eq("id", body.business_id)
      .single();

    if (bizError || !business || !business.pix_enabled || !business.pix_key) {
      return NextResponse.json({ error: "PIX não configurado para este estabelecimento" }, { status: 400 });
    }

    // C-01: valor vem do banco, nunca do cliente
    const amountCents = appointment.payment_amount_cents;
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ error: "Valor de pagamento inválido" }, { status: 400 });
    }

    // Cidade do estabelecimento (campo obrigatório no BR Code)
    const address = business.address as { city?: string } | null;
    const city = address?.city ?? "Sao Paulo";

    // Gera um ID de transação interno
    const txid = body.appointment_id.replace(/-/g, "").slice(0, 25);

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    // Gera BR Code PIX localmente — sem gateway externo
    const brCode = generatePixBRCode({
      pixKey: business.pix_key,
      merchantName: business.name,
      merchantCity: city,
      amountCents,
      txid,
    });

    const qrCodeBase64 = await generatePixQRCodeBase64(brCode);

    // Salva payment_id e expires_at no appointment
    await supabase
      .from("appointments")
      .update({
        payment_id: txid,
        payment_expires_at: expiresAt.toISOString(),
      })
      .eq("id", body.appointment_id);

    // Avisa o estabelecimento apenas na primeira geração do QR (evita duplicatas em retries)
    const isFirstGeneration = !appointment.payment_id;
    if (business.phone_whatsapp && isFirstGeneration) {
      const SP = "America/Sao_Paulo";
      const startDt = new Date(appointment.start_at);
      const dataFormatada = startDt.toLocaleDateString("pt-BR", {
        timeZone: SP, weekday: "long", day: "numeric", month: "long",
      });
      const horaFormatada = startDt.toLocaleTimeString("pt-BR", {
        timeZone: SP, hour: "2-digit", minute: "2-digit",
      });
      sendWhatsApp(
        business.phone_whatsapp,
        `💰 *PIX aguardando confirmação*\n\n` +
        `👤 Cliente: *${appointment.client_name}*\n` +
        `📅 Data: *${dataFormatada}*\n` +
        `⏰ Horário: *${horaFormatada}*\n` +
        `💵 Valor: *${formatPrice(amountCents)}*\n\n` +
        `Após confirmar que o valor caiu na sua conta, acesse o MarqueJá e confirme o recebimento. ✅\n\n` +
        `⚠️ Somente após sua confirmação o cliente terá o agendamento finalizado.`
      ).then((r) => {
        if (!r.success) console.warn("[WhatsApp] pix/create owner notify failed:", r.error);
      }).catch((err) => console.error("[WhatsApp] pix/create owner notify error:", err));
    }

    return NextResponse.json({
      qr_code: qrCodeBase64,
      qr_code_text: brCode,
      payment_id: txid,
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/payments/pix/create]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
