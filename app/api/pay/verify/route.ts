import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  const token = searchParams.get("token");

  if (!reference || !token) {
    return NextResponse.redirect(new URL("/pay/error", req.url));
  }

  // Verify with Paystack
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  const data = await res.json();

  if (!data.status || data.data?.status !== "success") {
    return NextResponse.redirect(new URL(`/pay/${token}?status=failed`, req.url));
  }

  const supabase = await createClient();

  // Mark invoice as paid
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, total_amount, amount_paid")
    .eq("payment_link_token", token)
    .single();

  if (invoice) {
    const newPaid = (invoice.amount_paid ?? 0) + (data.data.amount / 100);
    const newStatus = newPaid >= invoice.total_amount ? "paid" : "partial";
    await supabase
      .from("invoices")
      .update({ amount_paid: newPaid, status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", invoice.id);
  }

  return NextResponse.redirect(new URL(`/pay/${token}?status=success`, req.url));
}
