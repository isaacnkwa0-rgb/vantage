import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { POSClient } from "@/components/pos/POSClient";
import { ServicePOSClient } from "@/components/service/ServicePOSClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function POSPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, currency, phone, address, logo_url, tax_enabled, tax_rate, tax_name, business_type")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const isService = business.business_type === "service";

  const [productsRes, customersRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, selling_price, cost_price, stock_quantity, image_url, sku, barcode, categories(name, color)")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("customers")
      .select("id, name, phone")
      .eq("business_id", business.id)
      .order("name"),
  ]);

  const products = productsRes.data ?? [];
  const customers = customersRes.data ?? [];

  if (isService) {
    return (
      <ServicePOSClient
        services={products as any}
        customers={customers as any}
        business={business as any}
        userId={user.id}
      />
    );
  }

  return (
    <POSClient
      products={products as any}
      customers={customers as any}
      business={business as any}
      userId={user.id}
    />
  );
}
