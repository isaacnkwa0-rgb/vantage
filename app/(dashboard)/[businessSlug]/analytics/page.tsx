import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function AnalyticsPage({ params }: Props) {
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

  // Last 30 days of sales for charts
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [{ data: sales }, { data: saleItems }, { data: expenses }] = await Promise.all([
    supabase
      .from("sales")
      .select("total_amount, created_at")
      .eq("business_id", business.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at"),
    supabase
      .from("sale_items")
      .select("product_name, quantity, line_total, cost_price")
      .eq("business_id", business.id),
    supabase
      .from("expenses")
      .select("category, amount")
      .eq("business_id", business.id)
      .gte("expense_date", thirtyDaysAgo.toISOString().split("T")[0]),
  ]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Analytics" />
      <AnalyticsClient
        sales={sales ?? []}
        saleItems={saleItems ?? []}
        expenses={expenses ?? []}
        currency={business.currency}
      />
    </div>
  );
}
