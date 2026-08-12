import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { RecurringClient } from "@/components/recurring/RecurringClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function RecurringPage({ params }: Props) {
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

  const [schedRes, customersRes] = await Promise.all([
    supabase
      .from("recurring_invoices")
      .select("*, customers(name)")
      .eq("business_id", business.id)
      .order("next_issue_date"),
    supabase
      .from("customers")
      .select("id, name")
      .eq("business_id", business.id)
      .order("name"),
  ]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Recurring Billing" />
      <RecurringClient
        schedules={(schedRes.data ?? []) as any}
        customers={(customersRes.data ?? []) as any}
        currency={business.currency}
        businessId={business.id}
        userId={user.id}
      />
    </div>
  );
}
