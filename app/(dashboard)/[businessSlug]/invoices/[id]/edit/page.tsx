import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";

interface Props {
  params: Promise<{ businessSlug: string; id: string }>;
}

export default async function EditInvoicePage({ params }: Props) {
  const { businessSlug, id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, currency")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const [{ data: invoice }, { data: customers }, { data: items }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, invoice_number, status, issue_date, due_date, client_name, client_email, client_address, notes, bank_details, discount_amount, tax_amount, customers(name, phone)")
      .eq("id", id)
      .eq("business_id", business.id)
      .single(),
    supabase
      .from("customers")
      .select("id, name, email, phone, address")
      .eq("business_id", business.id)
      .order("name"),
    supabase
      .from("invoice_items")
      .select("description, quantity, unit_price")
      .eq("invoice_id", id),
  ]);

  if (!invoice) redirect(`/${businessSlug}/invoices`);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title={invoice.invoice_number}
        bg="bg-white"
        border
        centered
        backHref={`/${businessSlug}/invoices`}
      />
      <InvoiceForm
        business={business as any}
        customers={(customers ?? []) as any}
        editingInvoice={invoice as any}
        initialItems={(items ?? []) as any}
        backHref={`/${businessSlug}/invoices`}
      />
    </div>
  );
}
