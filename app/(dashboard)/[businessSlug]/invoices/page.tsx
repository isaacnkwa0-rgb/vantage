import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { InvoicesClient } from "@/components/invoices/InvoicesClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function InvoicesPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, currency, phone, email, address, logo_url")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const [{ data: invoices }, { data: customers }] = await Promise.all([
    supabase
      .from("invoices")
      .select(`
        id, invoice_number, status, issue_date, due_date,
        subtotal, discount_amount, tax_amount, total_amount, amount_paid,
        notes, bank_details, client_name, client_email, client_address,
        customers ( name, phone )
      `)
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("customers")
      .select("id, name, email, phone, address")
      .eq("business_id", business.id)
      .order("name"),
  ]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Invoices" />
      <InvoicesClient
        invoices={(invoices ?? []) as any}
        business={business as any}
        customers={(customers ?? []) as any}
      />
    </div>
  );
}
