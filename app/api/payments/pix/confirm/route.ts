import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/whatsapp/send";

// POST /api/payments/pix/confirm
// Chamado pelo admin do painel para confirmar manualmente o recebimento do PIX.
export async function POST(request: NextRequest) {
  try {
    // Exige sessão autenticada de admin
    const adminClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await adminClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appointment_id } = await request.json();
    if (!appointment_id) {
      return NextResponse.json({ error: "appointment_id é obrigatório" }, { status: 400 });
    }

    const supabase = createServerSupabaseClientWithServiceRole();

    // Busca o agendamento com dados do cliente e negócio
    const { data: appointment, error: apptError } = await supabase
      .from("appointments")
      .select(`
        id, status, payment_status, payment_expires_at, business_id,
        client_name, client_phone, start_at,
        businesses ( id, name, phone_whatsapp, owner_id )
      `)
      .eq("id", appointment_id)
      .single();

    if (apptError || !appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    // BUG-15: verifica que o admin autenticado é dono do negócio do agendamento
    const business = appointment.businesses as { id: string; name: string; phone_whatsapp: string | null; owner_id: string } | null;
    if (!business || business.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (appointment.payment_status === "paid") {
      return NextResponse.json({ success: true, already_paid: true });
    }

    if (appointment.status === "cancelled" || appointment.payment_status === "expired") {
      return NextResponse.json({ error: "Agendamento cancelado ou expirado" }, { status: 409 });
    }

    // BUG-06: rejeita confirmação se o prazo já expirou (mesmo que o cron ainda não tenha rodado)
    if (appointment.payment_expires_at && new Date() > new Date(appointment.payment_expires_at)) {
      await supabase
        .from("appointments")
        .update({ payment_status: "expired", status: "cancelled" })
        .eq("id", appointment_id);
      return NextResponse.json({ error: "Agendamento cancelado ou expirado" }, { status: 409 });
    }

    const now = new Date().toISOString();

    // UPDATE atômico: só avança se ainda não estiver pago (guard contra double-click/race)
    const { data: updated, error: updateError } = await supabase
      .from("appointments")
      .update({
        payment_status: "paid",
        payment_paid_at: now,
        status: "confirmed",
        confirmation_sent: false,
      })
      .eq("id", appointment_id)
      .neq("payment_status", "paid")  // somente uma requisição vence a corrida
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("[pix/confirm] update error:", updateError);
      return NextResponse.json({ error: "Erro ao confirmar pagamento" }, { status: 500 });
    }

    // Se nenhuma linha foi atualizada, outra requisição ganhou a corrida — idempotente
    if (!updated) {
      return NextResponse.json({ success: true, already_paid: true });
    }

    // A-06: Audit trail — executado uma única vez por ser pós-guard
    await supabase.from("appointment_audit_log").insert({
      appointment_id,
      changed_by: user.id,
      old_status: appointment.status,
      new_status: "confirmed",
      note: "PIX payment confirmed manually by admin",
    });

    // Notifica o cliente via WhatsApp
    const businessName = business?.name ?? "Estabelecimento";
    const startDt = new Date(appointment.start_at);
    const SP = "America/Sao_Paulo";

    const formattedDate = startDt.toLocaleDateString("pt-BR", {
      timeZone: SP, weekday: "long", day: "numeric", month: "long",
    });
    const formattedTime = startDt.toLocaleTimeString("pt-BR", {
      timeZone: SP, hour: "2-digit", minute: "2-digit",
    });

    sendWhatsApp(
      appointment.client_phone,
      `✅ *Pagamento confirmado!*\n\nOlá, ${appointment.client_name}! Seu pagamento foi confirmado e seu agendamento em *${businessName}* está garantido.\n\n📅 ${formattedDate} às ${formattedTime}\n\nAté lá! 😊`
    ).then(async (result) => {
      if (result.success) {
        await supabase
          .from("appointments")
          .update({ confirmation_sent: true })
          .eq("id", appointment_id);
      } else {
        console.warn("[WhatsApp] pix/confirm client notify failed:", result.error);
      }
    }).catch((err) => console.error("[WhatsApp] pix/confirm client notify error:", err));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/payments/pix/confirm]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
