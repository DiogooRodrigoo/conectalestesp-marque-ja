import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

function stripPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const { phone, business_id, code } = await request.json();

    if (!phone || !business_id || !code) {
      return NextResponse.json(
        { error: "phone, business_id e code são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanPhone = stripPhone(phone);
    const supabase = createServerSupabaseClientWithServiceRole();

    // Busca verificação mais recente não expirada e não usada para este telefone
    const { data: verification, error } = await supabase
      .from("phone_verifications")
      .select("id, code, expires_at, attempts, verified_at")
      .eq("phone", cleanPhone)
      .eq("business_id", business_id)
      .is("token", null) // ainda não verificado
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !verification) {
      return NextResponse.json(
        { error: "Nenhum código pendente encontrado. Solicite um novo." },
        { status: 404 }
      );
    }

    // Verifica se expirou
    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Código expirado. Solicite um novo." },
        { status: 400 }
      );
    }

    // Verifica tentativas
    if (verification.attempts >= 3) {
      return NextResponse.json(
        { error: "Muitas tentativas. Solicite um novo código." },
        { status: 400 }
      );
    }

    // Incrementa tentativas
    await supabase
      .from("phone_verifications")
      .update({ attempts: verification.attempts + 1 })
      .eq("id", verification.id);

    // Valida o código
    if (verification.code !== code.trim()) {
      const remaining = 3 - (verification.attempts + 1);
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Código incorreto. ${remaining} tentativa${remaining === 1 ? "" : "s"} restante${remaining === 1 ? "" : "s"}.`
              : "Código incorreto. Solicite um novo.",
        },
        { status: 400 }
      );
    }

    // Código correto — gera token e marca como verificado
    const { data: updated, error: updateError } = await supabase
      .from("phone_verifications")
      .update({
        verified_at: new Date().toISOString(),
        token: crypto.randomUUID(),
      })
      .eq("id", verification.id)
      .select("token")
      .single();

    if (updateError || !updated?.token) {
      console.error("[verify/confirm] Update error:", updateError);
      return NextResponse.json({ error: "Erro ao confirmar verificação" }, { status: 500 });
    }

    return NextResponse.json({ success: true, token: updated.token });
  } catch (err) {
    console.error("[verify/confirm]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
