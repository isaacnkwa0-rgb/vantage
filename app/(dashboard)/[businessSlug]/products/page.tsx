import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ProductsClient } from "@/components/products/ProductsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function ProductsPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, currency, business_type")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const [{ data: products }, { data: categories }, { data: locations }] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(name, color), locations(name)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("*")
      .eq("business_id", business.id)
      .order("name"),
    supabase
      .from("locations")
      .select("id, name, address, phone, is_active")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name"),
  ]);

  const isService = business.business_type === "service";

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title={isService ? "Services" : "Products"} />
      <ProductsClient
        products={(products ?? []) as any}
        categories={categories ?? []}
        locations={locations ?? []}
        businessId={business.id}
        currency={business.currency}
        slug={businessSlug}
        businessType={(business.business_type ?? "retail") as "retail" | "service"}
      />
    </div>
  );
}
