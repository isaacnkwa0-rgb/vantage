import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fn, params = {} } = await req.json();

  const ALLOWED_FUNCTIONS = new Set([
    "get_dashboard_stats","get_profit_loss_report","get_my_business_ids",
    "is_business_owner","generate_sale_number",
  ]);

  if (!ALLOWED_FUNCTIONS.has(fn)) {
    return NextResponse.json({ error: "Function not allowed" }, { status: 403 });
  }

  try {
    const args = Object.entries(params)
      .map(([k, v]) => `${k} => '${String(v).replace(/'/g, "''")}'`)
      .join(", ");
    const rows = (await sql(`SELECT * FROM ${fn}(${args})`)) as any[];
    return NextResponse.json({ data: rows, error: null });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message });
  }
}
