import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/blocked-dates?business_id=X&year=2024&month=4
 *
 * Returns dates (YYYY-MM-DD) that are fully blocked (whole-day blocks)
 * for the given business in the given month.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const business_id = searchParams.get("business_id");
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month")); // 1-based

  if (!business_id || !year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: "business_id, year and month (1-12) are required" }, { status: 400 });
  }

  const monthStart = new Date(year, month - 1, 1).toISOString();
  const monthEnd   = new Date(year, month, 1).toISOString(); // exclusive

  const supabase = await createServerSupabaseClient();

  const { data: blocks, error } = await supabase
    .from("blocked_slots")
    .select("start_at, end_at")
    .eq("business_id", business_id)
    .gte("start_at", monthStart)
    .lt("start_at", monthEnd);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch blocked slots" }, { status: 500 });
  }

  // A full-day block has a duration >= 23 hours
  const MS_23H = 23 * 60 * 60 * 1000;

  const blockedDates = (blocks ?? [])
    .filter((b) => new Date(b.end_at).getTime() - new Date(b.start_at).getTime() >= MS_23H)
    .map((b) => {
      // Extract YYYY-MM-DD in São Paulo time (UTC-3)
      const d = new Date(new Date(b.start_at).getTime() - 3 * 60 * 60 * 1000);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    });

  return NextResponse.json({ blocked_dates: blockedDates });
}
