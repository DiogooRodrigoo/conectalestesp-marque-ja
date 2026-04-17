import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

const SESSION_TTL_DAYS = 30;

function stripPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// POST /api/auth/client/session
// Creates a 30-day persistent session after successful OTP verification.
// Body: { phone, business_id, client_name, verification_token }
export async function POST(request: NextRequest) {
  try {
    const { phone, business_id, client_name, verification_token } = await request.json();

    if (!phone || !business_id || !client_name || !verification_token) {
      return NextResponse.json(
        { error: "phone, business_id, client_name e verification_token são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanPhone = stripPhone(phone);
    const supabase = createServerSupabaseClientWithServiceRole();

    // Validate the verification token belongs to this phone+business
    const { data: verification, error: verErr } = await supabase
      .from("phone_verifications")
      .select("id, phone, business_id, verified_at")
      .eq("token", verification_token)
      .eq("business_id", business_id)
      .single();

    if (verErr || !verification || !verification.verified_at) {
      return NextResponse.json({ error: "Token de verificação inválido" }, { status: 401 });
    }

    if (stripPhone(verification.phone) !== cleanPhone) {
      return NextResponse.json({ error: "Token de verificação inválido" }, { status: 401 });
    }

    // Create session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

    // Each device gets its own session row; old sessions expire after 30 days
    await supabase.from("client_sessions").insert({
      business_id,
      phone: cleanPhone,
      client_name: client_name.trim(),
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    });

    return NextResponse.json({
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/auth/client/session]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// GET /api/auth/client/session?token=&business_id=
// Validates a session and returns phone + client_name.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const businessId = searchParams.get("business_id");

    if (!token || !businessId) {
      return NextResponse.json(
        { error: "token e business_id são obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClientWithServiceRole();

    const { data: session, error } = await supabase
      .from("client_sessions")
      .select("id, phone, client_name, expires_at")
      .eq("session_token", token)
      .eq("business_id", businessId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
    }

    if (new Date(session.expires_at) < new Date()) {
      // Delete expired session
      await supabase.from("client_sessions").delete().eq("session_token", token);
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
    }

    // Update last_used_at
    await supabase
      .from("client_sessions")
      .update({ last_used_at: new Date().toISOString() })
      .eq("session_token", token);

    return NextResponse.json({
      phone: session.phone,
      client_name: session.client_name,
      expires_at: session.expires_at,
    });
  } catch (err) {
    console.error("[GET /api/auth/client/session]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/auth/client/session?token=&business_id=
// Logs the client out (removes session).
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const businessId = searchParams.get("business_id");

    if (!token || !businessId) {
      return NextResponse.json({ error: "token e business_id são obrigatórios" }, { status: 400 });
    }

    const supabase = createServerSupabaseClientWithServiceRole();
    await supabase
      .from("client_sessions")
      .delete()
      .eq("session_token", token)
      .eq("business_id", businessId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/auth/client/session]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
