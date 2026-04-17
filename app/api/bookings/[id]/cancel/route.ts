import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

const CANCEL_WINDOW_MINUTES = 30;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID do agendamento é obrigatório" }, { status: 400 });
  }

  // C-03: require client_phone to prevent IDOR — anyone with a UUID could cancel
  let clientPhone: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    clientPhone = body.client_phone;
  } catch {
    // no body is fine; will fail at the phone check below
  }

  if (!clientPhone) {
    return NextResponse.json({ error: "Telefone do cliente é obrigatório" }, { status: 400 });
  }

  const cleanPhone = clientPhone.replace(/\D/g, "");

  const supabase = createServerSupabaseClientWithServiceRole();

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, status, start_at, client_phone")
    .eq("id", id)
    .single();

  if (error || !appointment) {
    return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
  }

  // Verifica que o telefone informado pertence ao cliente deste agendamento
  const storedPhone = (appointment.client_phone ?? "").replace(/\D/g, "");
  if (cleanPhone !== storedPhone) {
    return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
  }

  if (appointment.status === "cancelled") {
    return NextResponse.json({ error: "Este agendamento já foi cancelado" }, { status: 409 });
  }

  if (appointment.status === "completed" || appointment.status === "no_show") {
    return NextResponse.json({ error: "Não é possível cancelar um agendamento já concluído" }, { status: 409 });
  }

  const now = new Date();
  const startAt = new Date(appointment.start_at);
  const minutesUntilStart = (startAt.getTime() - now.getTime()) / (1000 * 60);

  if (minutesUntilStart < CANCEL_WINDOW_MINUTES) {
    return NextResponse.json(
      { error: `Cancelamento não permitido. O prazo mínimo é de ${CANCEL_WINDOW_MINUTES} minutos antes do horário agendado.` },
      { status: 403 }
    );
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (updateError) {
    console.error("[PATCH /api/bookings/[id]/cancel] Update error:", updateError);
    return NextResponse.json({ error: "Falha ao cancelar agendamento. Tente novamente." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
