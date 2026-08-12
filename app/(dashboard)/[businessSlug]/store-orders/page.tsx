import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { StoreOrdersClient } from "@/components/store/StoreOrdersClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function StoreOrdersPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, currency, slug")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const { data: orders } = await supabase
    .from("store_orders")
    .select("*, store_order_items(name, quantity, price, total)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Online Store Orders" />
      <StoreOrdersClient
        orders={(orders ?? []) as any}
        currency={business.currency}
        businessSlug={business.slug}
      />
    </div>
  );
}
