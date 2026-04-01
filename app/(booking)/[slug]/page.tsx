import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import BookingShell from "@/components/booking/BookingShell";
import type { Business, Service, Professional, BusinessHours } from "@/types/database";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Busca negócio pelo slug
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .eq("booking_enabled", true)
    .single();

  if (bizError || !business) {
    notFound();
  }

  // Busca horários de funcionamento, serviços e profissionais em paralelo
  const [
    { data: business_hours },
    { data: services },
    { data: professionals },
  ] = await Promise.all([
    supabase
      .from("business_hours")
      .select("*")
      .eq("business_id", business.id)
      .order("day_of_week"),
    supabase
      .from("services")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("professionals")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name"),
  ]);

  const businessWithHours: Business & { business_hours?: BusinessHours[] } = {
    ...(business as Business),
    business_hours: (business_hours as BusinessHours[]) ?? [],
  };

  return (
    <BookingShell
      business={businessWithHours}
      services={(services as Service[]) ?? []}
      professionals={(professionals as Professional[]) ?? []}
    />
  );
}

export async function generateMetadata({ params }: BookingPageProps) {
  const { slug } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, description")
    .eq("slug", slug)
    .single();

  if (!business) {
    return { title: "Agendamento | Marque Já" };
  }

  return {
    title: `Agendar — ${business.name} | Marque Já`,
    description: business.description ?? `Faça seu agendamento online em ${business.name}`,
  };
}
