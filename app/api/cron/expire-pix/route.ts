import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

// BUG-05: Expira PIX vencidos quando o cliente fecha a aba antes de pagar.
// Chamado pelo Vercel Cron a cada 5 minutos (ver vercel.json).
// Protegido por CRON_SECRET para evitar execução não autorizada.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClientWithServiceRole();

    const { data, error } = await supabase
      .from("appointments")
      .update({
        payment_status: "expired",
        status: "cancelled",
      })
      .eq("payment_status", "awaiting")
      .lt("payment_expires_at", new Date().toISOString())
      .select("id");

    if (error) {
      console.error("[cron/expire-pix] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const count = data?.length ?? 0;
    if (count > 0) {
      console.log(`[cron/expire-pix] Expirados ${count} agendamento(s) PIX vencidos.`);
    }

    return NextResponse.json({ expired: count });
  } catch (err) {
    console.error("[cron/expire-pix]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
