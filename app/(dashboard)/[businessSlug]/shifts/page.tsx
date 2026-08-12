import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ShiftsClient } from "@/components/pos/ShiftsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function ShiftsPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, currency")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const { data: shifts } = await supabase
    .from("cash_shifts")
    .select("id, opening_float, closing_float, cash_sales, expected_cash, discrepancy, notes, opened_at, closed_at, status, opened_by, closed_by")
    .eq("business_id", business.id)
    .order("opened_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar title="Cash Shifts" />
      <ShiftsClient
        shifts={(shifts ?? []) as any}
        currency={business.currency}
      />
    </div>
  );
}
