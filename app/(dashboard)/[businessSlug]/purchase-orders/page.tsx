import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { PurchaseOrdersClient } from "@/components/purchase-orders/PurchaseOrdersClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function PurchaseOrdersPage({ params }: Props) {
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

  const [posRes, suppliersRes] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("*, suppliers(name)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("suppliers")
      .select("id, name")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar title="Purchase Orders" />
      <PurchaseOrdersClient
        orders={(posRes.data ?? []) as any}
        suppliers={(suppliersRes.data ?? []) as any}
        currency={business.currency}
        businessId={business.id}
        userId={user.id}
      />
    </div>
  );
}
