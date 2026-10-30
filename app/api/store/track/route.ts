import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { businessId } = await req.json().catch(() => ({}));
  if (!businessId) return NextResponse.json({ ok: false }, { status: 400 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const today = new Date().toISOString().split("T")[0];

  // Unique constraint on (business_id, ip_address, visit_date) deduplicates same IP per day
  await sql(
    `INSERT INTO store_visits (business_id, ip_address, visit_date, visited_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (business_id, ip_address, visit_date) DO NOTHING`,
    [businessId, ip, today, new Date().toISOString()]
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
