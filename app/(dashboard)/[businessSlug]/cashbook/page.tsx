import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { CashbookClient } from "@/components/cashbook/CashbookClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function CashbookPage({ params, searchParams }: Props) {
  const { businessSlug } = await params;
  const { from, to } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, currency")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const now = new Date();
  const fromDate = from ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const toDate = to ?? new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const { data: entries } = await supabase
    .from("cashbook_entries")
    .select("*")
    .eq("business_id", business.id)
    .gte("entry_date", fromDate)
    .lte("entry_date", toDate)
    .order("entry_date", { ascending: false });

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar title="Cashbook" />
      <CashbookClient
        entries={(entries ?? []) as any}
        currency={business.currency}
        businessId={business.id}
        userId={user.id}
        fromDate={fromDate}
        toDate={toDate}
        businessSlug={businessSlug}
      />
    </div>
  );
}
