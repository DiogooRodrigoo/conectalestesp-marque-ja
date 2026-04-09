import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

const CANCEL_WINDOW_MINUTES = 30;

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID do agendamento é obrigatório" }, { status: 400 });
  }

  const supabase = createServerSupabaseClientWithServiceRole();

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, status, start_at")
    .eq("id", id)
    .single();

  if (error || !appointment) {
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
