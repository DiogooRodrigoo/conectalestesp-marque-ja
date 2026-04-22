import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// POST /api/auth/client/session/exchange
// Exchanges a valid persistent session token for a fresh phone verification token.
// This allows auto-authenticated users to create appointments without re-doing OTP.
// Body: { session_token, business_id }
export async function POST(request: NextRequest) {
  try {
    const { session_token, business_id } = await request.json();

    if (!session_token || !business_id) {
      return NextResponse.json(
        { error: "session_token e business_id são obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClientWithServiceRole();

    const tokenHash = hashToken(session_token);

    // Validate session using hashed token (M-01)
    const { data: session, error: sessionErr } = await supabase
      .from("client_sessions")
      .select("id, phone, client_name, expires_at")
      .eq("session_token_hash", tokenHash)
      .eq("business_id", business_id)
      .single();

    if (sessionErr || !session) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    if (new Date(session.expires_at) < new Date()) {
      await supabase.from("client_sessions").delete().eq("session_token_hash", tokenHash);
      return NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 });
    }

    // Create a pre-verified phone_verification record
    // This lets the booking API accept the returned token without OTP
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const { error: insertErr } = await supabase
      .from("phone_verifications")
      .insert({
        phone: session.phone,
        business_id,
        code: "SESSION", // sentinel — this record is pre-verified, code is never checked
        token: verificationToken,
        verified_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        attempts: 0,
      });

    if (insertErr) {
      console.error("[session/exchange] insert error:", insertErr);
      return NextResponse.json({ error: "Erro ao emitir token de sessão" }, { status: 500 });
    }

    // Update session last_used_at
    await supabase
      .from("client_sessions")
      .update({ last_used_at: new Date().toISOString() })
      .eq("session_token_hash", tokenHash);

    return NextResponse.json({
      verification_token: verificationToken,
      phone: session.phone,
      client_name: session.client_name,
    });
  } catch (err) {
    console.error("[POST /api/auth/client/session/exchange]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
