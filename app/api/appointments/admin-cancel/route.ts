import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/whatsapp/send";
import { cancellationMessage } from "@/lib/whatsapp/templates";

export async function POST(request: NextRequest) {
  try {
    const adminClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await adminClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appointment_id, reason } = await request.json();
    if (!appointment_id) {
      return NextResponse.json({ error: "appointment_id é obrigatório" }, { status: 400 });
    }

    const supabase = createServerSupabaseClientWithServiceRole();

    const { data: appointment, error: apptError } = await supabase
      .from("appointments")
      .select(`
        id, status, business_id,
        client_name, client_phone, start_at,
        service:services ( name ),
        businesses ( id, name, owner_id )
      `)
      .eq("id", appointment_id)
      .single();

    if (apptError || !appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const business = appointment.businesses as { id: string; name: string; owner_id: string } | null;
    if (!business || business.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json({ success: true, already_cancelled: true });
    }

    if (appointment.status === "completed" || appointment.status === "no_show") {
      return NextResponse.json({ error: "Não é possível cancelar um agendamento já concluído" }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointment_id);

    if (updateError) {
      console.error("[admin-cancel] update error:", updateError);
      return NextResponse.json({ error: "Erro ao cancelar agendamento" }, { status: 500 });
    }

    // Notifica o cliente via WhatsApp
    if (appointment.client_phone) {
      const SP = "America/Sao_Paulo";
      const startDt = new Date(appointment.start_at);
      const dateStr = startDt.toLocaleDateString("pt-BR", {
        timeZone: SP, weekday: "long", day: "numeric", month: "long",
      });
      const timeStr = startDt.toLocaleTimeString("pt-BR", {
        timeZone: SP, hour: "2-digit", minute: "2-digit",
      });
      const service = appointment.service as { name: string } | null;

      sendWhatsApp(
        appointment.client_phone,
        cancellationMessage({
          clientName: appointment.client_name,
          businessName: business.name,
          serviceName: service?.name ?? "Serviço",
          date: dateStr,
          time: timeStr,
          reason: reason?.trim() || undefined,
        })
      ).catch((err) => console.error("[admin-cancel] WhatsApp error:", err));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/appointments/admin-cancel]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
