import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

// Verifica se o cliente associado a um business_id está ativo no Hub.
// Usa service_role para conseguir ler a tabela `clients` (protegida por RLS para hub_admins).
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("business_id");
  if (!businessId) {
    return NextResponse.json({ error: "business_id obrigatório" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClientWithServiceRole();

  const { data: client } = await supabase
    .from("clients")
    .select("status")
    .eq("business_id", businessId)
    .maybeSingle();

  // Se não existe registro no Hub (negócio antigo ou criado manualmente), libera o acesso.
  if (!client) {
    return NextResponse.json({ allowed: true });
  }

  const allowed = client.status === "active" || client.status === "trial";
  return NextResponse.json({ allowed, status: client.status });
}
