import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: NextRequest) {
  const { token, email } = await req.json();
  if (!token || !email) {
    return NextResponse.json({ error: "Missing token or email" }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch the invoice by token (no auth required — public payment link)
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, amount_paid, status, business_id, businesses(name, currency)")
    .eq("payment_link_token", token)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "paid" || invoice.status === "cancelled") {
    return NextResponse.json({ error: "Invoice is already " + invoice.status }, { status: 400 });
  }

  const business = (Array.isArray(invoice.businesses) ? invoice.businesses[0] : invoice.businesses) as { name: string; currency: string } | null;
  const amountDue = invoice.total_amount - invoice.amount_paid;
  const amountKobo = Math.round(amountDue * 100); // Paystack uses smallest currency unit

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/pay/verify?token=${token}`;

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      currency: business?.currency ?? "NGN",
      reference: `INV-${invoice.invoice_number}-${Date.now()}`,
      callback_url: callbackUrl,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        payment_link_token: token,
        business_name: business?.name ?? "",
      },
    }),
  });

  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message ?? "Payment initialization failed" }, { status: 500 });
  }

  return NextResponse.json({ authorizationUrl: data.data.authorization_url });
}
