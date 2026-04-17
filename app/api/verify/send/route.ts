import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/whatsapp/send";

function generateCode(): string {
  return randomInt(100000, 1000000).toString(); // A-03: CSPRNG
}

function stripPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const { phone, business_id } = await request.json();

    if (!phone || !business_id) {
      return NextResponse.json(
        { error: "phone e business_id são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanPhone = stripPhone(phone);

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return NextResponse.json(
        { error: "Telefone inválido" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClientWithServiceRole();

    // Rate limit: máximo 1 envio por minuto por telefone+negócio
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("phone_verifications")
      .select("id")
      .eq("phone", cleanPhone)
      .eq("business_id", business_id)
      .gte("created_at", oneMinuteAgo)
      .limit(1);

    if (recent && recent.length > 0) {
      return NextResponse.json(
        { error: "Aguarde 1 minuto antes de solicitar um novo código" },
        { status: 429 }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    const { error: insertError } = await supabase
      .from("phone_verifications")
      .insert({
        phone: cleanPhone,
        business_id,
        code,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("[verify/send] Insert error:", insertError);
      return NextResponse.json(
        { error: "Erro ao gerar código" },
        { status: 500 }
      );
    }

    // Envia código via WhatsApp
    const message =
      `🔐 *Seu código de verificação é: ${code}*\n\n` +
      `Válido por 10 minutos. Não compartilhe com ninguém.\n\n` +
      `_Marque Já_`;

    const result = await sendWhatsApp(cleanPhone, message);

    if (!result.success) {
      console.warn("[verify/send] WhatsApp falhou, código gerado mas não enviado:", result);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify/send]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
