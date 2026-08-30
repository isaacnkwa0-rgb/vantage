import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { businessId } = await req.json().catch(() => ({}));
  if (!businessId) return NextResponse.json({ ok: false }, { status: 400 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const today = new Date().toISOString().split("T")[0];

  // Unique constraint on (business_id, ip_address, visit_date) deduplicates same IP per day
  await adminClient.from("store_visits").insert({
    business_id: businessId,
    ip_address: ip,
    visit_date: today,
    visited_at: new Date().toISOString(),
  });
  // Ignore error — unique constraint violation means already counted today

  return NextResponse.json({ ok: true });
}
