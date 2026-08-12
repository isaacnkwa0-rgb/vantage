import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PayPage } from "@/components/pay/PayPage";

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function PublicPayPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { status } = await searchParams;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select(`
      id, invoice_number, status, issue_date, due_date,
      subtotal, discount_amount, tax_amount, total_amount, amount_paid,
      notes, client_name, client_email,
      businesses ( name, currency, logo_url, phone, address )
    `)
    .eq("payment_link_token", token)
    .single();

  if (!invoice) notFound();

  const { data: items } = await supabase
    .from("invoice_items")
    .select("description, quantity, unit_price, line_total")
    .eq("invoice_id", invoice.id)
    .order("created_at");

  return (
    <PayPage
      invoice={invoice as any}
      items={(items ?? []) as any}
      token={token}
      paymentStatus={status as "success" | "failed" | undefined}
    />
  );
}
