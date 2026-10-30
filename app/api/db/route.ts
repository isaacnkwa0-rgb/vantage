import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { executeSpec } from "@/lib/db";
import type { QuerySpec } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let spec: QuerySpec;
  try {
    spec = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Basic safeguard: only allow operations on known app tables
  const ALLOWED_TABLES = new Set([
    "profiles","businesses","business_members","invitations","categories","products",
    "product_variants","customers","sales","sale_items","expenses","stock_adjustments",
    "appointments","bank_accounts","bank_transactions","bank_transfer_checkout",
    "barcode_products","product_bundles","bundle_items","campaigns","cash_shifts",
    "cashbook_entries","commission_rules","credit_notes","customer_tags",
    "customer_tag_assignments","customer_price_tiers","customer_portal_otps",
    "discount_codes","gift_cards","gift_card_transactions","notifications",
    "payroll_runs","payroll_entries","price_tiers","tiered_pricing","purchase_orders",
    "purchase_order_items","quotes","quote_items","recurring_invoices","referral_programs",
    "referrals","returns","return_items","sales_targets","staff","store_orders",
    "store_order_items","store_visits","suppliers","audit_logs","exchange_rate_cache",
    "locations","invoices","invoice_items",
  ]);

  if (!ALLOWED_TABLES.has(spec.table)) {
    return NextResponse.json({ error: "Table not allowed" }, { status: 403 });
  }

  const result = await executeSpec(spec);
  return NextResponse.json(result);
}
