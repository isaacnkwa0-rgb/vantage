import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { QuotesClient } from "@/components/quotes/QuotesClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function QuotesPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, currency, phone, email, address, logo_url, invoice_accent_color, invoice_footer_notes, social_instagram, social_twitter, social_whatsapp")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const [{ data: quotes }, { data: customers }] = await Promise.all([
    supabase
      .from("quotes")
      .select(`
        id, quote_number, status, issue_date, valid_until,
        subtotal, discount_amount, tax_amount, total_amount,
        notes, terms, client_name, client_email, client_address,
        converted_invoice_id, customers ( name, phone )
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
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar title="Quotations & Estimates" />
      <QuotesClient
        quotes={(quotes ?? []) as any}
        business={business as any}
        customers={(customers ?? []) as any}
        userId={user.id}
      />
    </div>
  );
}
