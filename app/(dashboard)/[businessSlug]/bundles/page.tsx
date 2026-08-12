import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BundlesClient } from "@/components/products/BundlesClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function BundlesPage({ params }: Props) {
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

  const [bundlesRes, productsRes] = await Promise.all([
    supabase
      .from("product_bundles")
      .select("id, name, description, price, image_url, is_active, bundle_items(id, product_id, quantity, products(name, selling_price, cost_price))")
      .eq("business_id", business.id)
      .order("name"),
    supabase
      .from("products")
      .select("id, name, selling_price, cost_price, stock_quantity, image_url")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <BundlesClient
      bundles={(bundlesRes.data ?? []) as any}
      products={(productsRes.data ?? []) as any}
      businessId={business.id}
      currency={business.currency}
    />
  );
}
