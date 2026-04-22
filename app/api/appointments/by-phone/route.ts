import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const business_id = searchParams.get("business_id");
    const token = searchParams.get("token");

    if (!phone || !business_id || !token) {
      return NextResponse.json(
        { error: "phone, business_id e token são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const supabase = createServerSupabaseClientWithServiceRole();

    // Valida o token — permite uso mesmo após consumido no agendamento (token_used_at preenchido)
    // O importante é que foi verificado há no máximo 30 min
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: verification } = await supabase
      .from("phone_verifications")
      .select("id, phone")
      .eq("token", token)
      .eq("business_id", business_id)
      .not("verified_at", "is", null)
      .gte("verified_at", thirtyMinutesAgo)
      .single();

    if (!verification || verification.phone !== cleanPhone) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 401 }
      );
    }

    // Busca agendamentos futuros e recentes (últimos 90 dias + próximos)
    // Aceita ambos os formatos: somente dígitos "11999999999" ou com máscara "(11) 99999-9999"
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // Monta variações do telefone para cobrir dados antigos com máscara
    const phoneVariants = [
      cleanPhone, // 11999999999
      `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`, // (11) 99999-9999
      `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`, // (11) 9999-9999 (fixo)
    ];

    // M-02: `notes` omitted — it may contain internal admin observations (LGPD risk)
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        id,
        start_at,
        end_at,
        status,
        payment_status,
        payment_amount_cents,
        payment_expires_at,
        payment_id,
        services ( name, duration_min, price_cents ),
        professionals ( name )
      `)
      .eq("business_id", business_id)
      .in("client_phone", phoneVariants)
      .gte("start_at", ninetyDaysAgo)
      .order("start_at", { ascending: false });

    if (error) {
      console.error("[appointments/by-phone] Query error:", error);
      return NextResponse.json({ error: "Erro ao buscar agendamentos" }, { status: 500 });
    }

    return NextResponse.json({ appointments: appointments ?? [] });
  } catch (err) {
    console.error("[appointments/by-phone]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
