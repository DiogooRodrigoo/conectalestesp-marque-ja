import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/whatsapp/send";

// A-01: fail-closed (sem secret = rejeita) + comparação timing-safe
function validateWebhookSignature(request: NextRequest): boolean {
  const secret = process.env.OPENPIX_WEBHOOK_SECRET;
  if (!secret) return false;

  const headerSecret = request.headers.get("x-webhook-secret") ?? "";
  if (!headerSecret) return false;

  try {
    const a = Buffer.from(secret, "utf8");
    const b = Buffer.from(headerSecret, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateWebhookSignature(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // OpenPix envia evento com tipo e dados da cobrança
    const event = body.event ?? body.type ?? "";
    const charge = body.charge ?? body;

    // Só processa confirmação de pagamento
    if (!["OPENPIX:CHARGE_COMPLETED", "OPENPIX:TRANSACTION_RECEIVED"].includes(event)) {
      return NextResponse.json({ received: true });
    }

    const correlationID = charge.correlationID ?? charge.paymentLinkID ?? "";
    if (!correlationID) {
      return NextResponse.json({ error: "correlationID missing" }, { status: 400 });
    }

    const supabase = createServerSupabaseClientWithServiceRole();

    // Busca appointment pelo payment_id
    const { data: appointment, error: apptError } = await supabase
      .from("appointments")
      .select(`
        id,
        business_id,
        client_name,
        client_phone,
        start_at,
        payment_status,
        businesses ( name, phone_whatsapp )
      `)
      .eq("payment_id", correlationID)
      .single();

    if (apptError || !appointment) {
      console.warn("[PIX webhook] Appointment not found for correlationID:", correlationID);
      return NextResponse.json({ received: true });
    }

    // Idempotência: ignora se já foi processado
    if (appointment.payment_status === "paid") {
      return NextResponse.json({ received: true });
    }

    const now = new Date().toISOString();

    // Confirma pagamento e atualiza status do agendamento
    await supabase
      .from("appointments")
      .update({
        payment_status: "paid",
        payment_paid_at: now,
        status: "confirmed",
        confirmation_sent: false,
      })
      .eq("id", appointment.id);

    const business = appointment.businesses as { name: string; phone_whatsapp: string | null } | null;
    const businessName = business?.name ?? "Estabelecimento";

    const startDt = new Date(appointment.start_at);
    const formattedDate = startDt.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const formattedTime = startDt.toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    });

    const notificationPromises: Promise<unknown>[] = [];

    // Notifica cliente: pagamento confirmado
    notificationPromises.push(
      sendWhatsApp(
        appointment.client_phone,
        `✅ *Pagamento confirmado!*\n\nOlá, ${appointment.client_name}! Seu pagamento foi recebido e seu agendamento em *${businessName}* está confirmado.\n\n📅 ${formattedDate} às ${formattedTime}\n\nAté lá! 😊`
      ).then(async (result) => {
        if (result.success) {
          await supabase
            .from("appointments")
            .update({ confirmation_sent: true })
            .eq("id", appointment.id);
        }
      })
    );

    // Notifica estabelecimento
    if (business?.phone_whatsapp) {
      notificationPromises.push(
        sendWhatsApp(
          business.phone_whatsapp,
          `💰 *Pagamento recebido!*\n\nO cliente *${appointment.client_name}* realizou o pagamento do sinal.\n\n📅 Agendamento: ${formattedDate} às ${formattedTime}\n\nO agendamento está confirmado! ✅`
        )
      );
    }

    Promise.allSettled(notificationPromises).catch(() => {});

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[POST /api/payments/pix/webhook]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
