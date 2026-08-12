import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { PricingClient } from "@/components/pricing/PricingClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function PricingPage({ params }: Props) {
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

  const [tiersRes, customersRes] = await Promise.all([
    supabase
      .from("price_tiers")
      .select("*, customer_price_tiers(customer_id)")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("created_at"),
    supabase
      .from("customers")
      .select("id, name")
      .eq("business_id", business.id)
      .order("name"),
  ]);

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar title="Wholesale / Pricing Tiers" />
      <PricingClient
        tiers={(tiersRes.data ?? []) as any}
        customers={(customersRes.data ?? []) as any}
        currency={business.currency}
        businessId={business.id}
      />
    </div>
  );
}
