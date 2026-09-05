import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { QuoteForm } from "@/components/quotes/QuoteForm";

interface Props {
  params: Promise<{ businessSlug: string; id: string }>;
}

export default async function EditQuotePage({ params }: Props) {
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

  const [{ data: quote }, { data: customers }, { data: items }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, quote_number, status, issue_date, valid_until, client_name, client_email, client_address, notes, terms, customers(name, phone)")
      .eq("id", id)
      .eq("business_id", business.id)
      .single(),
    supabase
      .from("customers")
      .select("id, name, email, phone, address")
      .eq("business_id", business.id)
      .order("name"),
    supabase
      .from("quote_items")
      .select("description, quantity, unit_price")
      .eq("quote_id", id),
  ]);

  if (!quote) redirect(`/${businessSlug}/quotes`);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title={quote.quote_number}
        bg="bg-white"
        border
        centered
        backHref={`/${businessSlug}/quotes`}
      />
      <QuoteForm
        business={business as any}
        customers={(customers ?? []) as any}
        editingQuote={quote as any}
        initialItems={(items ?? []) as any}
        userId={user.id}
        backHref={`/${businessSlug}/quotes`}
      />
    </div>
  );
}
