import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateInvoiceHTML } from "@/lib/utils/invoice";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { invoice_id } = await req.json();
  if (!invoice_id) return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();

  const { data: invoice, error: invErr } = await svc
    .from("invoices")
    .select(`
      id, invoice_number, status, issue_date, due_date,
      subtotal, discount_amount, tax_amount, total_amount, amount_paid,
      notes, bank_details, client_name, client_email, client_address,
      business_id
    `)
    .eq("id", invoice_id)
    .single();

  if (invErr || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (!invoice.client_email) {
    return NextResponse.json({ error: "No client email on this invoice" }, { status: 400 });
  }

  const [{ data: items }, { data: business }] = await Promise.all([
    svc.from("invoice_items")
      .select("description, quantity, unit_price, line_total")
      .eq("invoice_id", invoice_id),
    svc.from("businesses")
      .select("name, currency, phone, email, address, logo_url")
      .eq("id", invoice.business_id)
      .single(),
  ]);

  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const html = generateInvoiceHTML(
    {
      invoice_number: invoice.invoice_number,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      status: invoice.status,
      client_name: invoice.client_name,
      client_email: invoice.client_email,
      client_address: invoice.client_address,
      subtotal: invoice.subtotal,
      discount_amount: invoice.discount_amount,
      tax_amount: invoice.tax_amount,
      total_amount: invoice.total_amount,
      amount_paid: invoice.amount_paid,
      notes: invoice.notes,
      bank_details: invoice.bank_details,
      items: (items ?? []) as any,
    },
    business
  );

  const { error: emailError } = await resend.emails.send({
    from: process.env.INVITATION_FROM_EMAIL ?? "noreply@vantage.app",
    to: invoice.client_email,
    subject: `Invoice ${invoice.invoice_number} from ${business.name}`,
    html,
  });

  if (emailError) {
    console.error("Invoice email failed:", emailError);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
