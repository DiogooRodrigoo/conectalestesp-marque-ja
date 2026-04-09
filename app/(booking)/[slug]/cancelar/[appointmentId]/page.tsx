import { notFound } from "next/navigation";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";
import CancelConfirm from "@/components/booking/CancelConfirm";

interface Props {
  params: Promise<{ slug: string; appointmentId: string }>;
}

const CANCEL_WINDOW_MINUTES = 30;

export default async function CancelPage({ params }: Props) {
  const { slug, appointmentId } = await params;
  const supabase = createServerSupabaseClientWithServiceRole();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, primary_color, slug")
    .eq("slug", slug)
    .eq("booking_enabled", true)
    .single();

  if (!business) notFound();

  const { data: appointment } = await supabase
    .from("appointments")
    .select(`
      id,
      status,
      start_at,
      client_name,
      services ( name ),
      professionals ( name )
    `)
    .eq("id", appointmentId)
    .eq("business_id", business.id)
    .single();

  if (!appointment) notFound();

  const isFinalStatus =
    appointment.status === "cancelled" ||
    appointment.status === "completed" ||
    appointment.status === "no_show";

  const now = new Date();
  const startAt = new Date(appointment.start_at);
  const minutesUntilStart = (startAt.getTime() - now.getTime()) / (1000 * 60);
  const isPastDeadline = isFinalStatus || minutesUntilStart < CANCEL_WINDOW_MINUTES;

  const serviceName =
    Array.isArray(appointment.services)
      ? (appointment.services[0] as { name: string })?.name ?? "Serviço"
      : (appointment.services as { name: string } | null)?.name ?? "Serviço";

  const professionalName =
    Array.isArray(appointment.professionals)
      ? (appointment.professionals[0] as { name: string } | null)?.name ?? null
      : (appointment.professionals as { name: string } | null)?.name ?? null;

  return (
    <CancelConfirm
      appointment={{
        id: appointment.id,
        status: appointment.status,
        start_at: appointment.start_at,
        service_name: serviceName,
        professional_name: professionalName,
        client_name: appointment.client_name,
      }}
      businessName={business.name}
      businessColor={business.primary_color ?? "#f97316"}
      businessSlug={business.slug}
      isPastDeadline={isPastDeadline}
    />
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return {
    title: `Cancelar agendamento | ${slug}`,
  };
}
