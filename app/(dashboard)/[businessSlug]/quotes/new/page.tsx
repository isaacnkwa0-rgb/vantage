import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { QuoteForm } from "@/components/quotes/QuoteForm";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function NewQuotePage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, currency")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, email, phone, address")
    .eq("business_id", business.id)
    .order("name");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="New Quote" bg="bg-white" border centered backHref={`/${businessSlug}/quotes`} />
      <QuoteForm
        business={business as any}
        customers={(customers ?? []) as any}
        editingQuote={null}
        userId={user.id}
        backHref={`/${businessSlug}/quotes`}
      />
    </div>
  );
}
