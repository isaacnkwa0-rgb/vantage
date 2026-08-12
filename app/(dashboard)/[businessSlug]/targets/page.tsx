import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { TargetsClient } from "@/components/targets/TargetsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function TargetsPage({ params }: Props) {
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

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const [targetsRes, salesRes] = await Promise.all([
    supabase
      .from("sales_targets")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("sales")
      .select("total_amount, created_at")
      .eq("business_id", business.id)
      .gte("created_at", monthStart)
      .lte("created_at", monthEnd + "T23:59:59"),
  ]);

  const salesThisMonth = salesRes.data ?? [];
  const revenueThisMonth = salesThisMonth.reduce((s, r) => s + r.total_amount, 0);
  const unitsThisMonth = salesThisMonth.length;

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar title="Sales Targets" />
      <TargetsClient
        targets={(targetsRes.data ?? []) as any}
        currency={business.currency}
        businessId={business.id}
        businessSlug={businessSlug}
        userId={user.id}
        revenueThisMonth={revenueThisMonth}
        transactionsThisMonth={unitsThisMonth}
        monthStart={monthStart}
        monthEnd={monthEnd}
      />
    </div>
  );
}
