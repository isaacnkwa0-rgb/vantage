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
    .select("id, name, currency, phone, address, logo_url, tax_enabled, tax_rate, tax_name, business_type, loyalty_enabled, loyalty_points_per_dollar, loyalty_redemption_rate")
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
      .select("id, name, phone, loyalty_points")
      .eq("business_id", business.id)
      .order("name"),
  ]);

  const products = productsRes.data ?? [];
  const customers = (customersRes.data ?? []).map((c) => ({
    ...c,
    loyalty_points: c.loyalty_points ?? 0,
  }));

  const businessData = {
    ...business,
    loyalty_enabled: business.loyalty_enabled ?? false,
    loyalty_points_per_dollar: business.loyalty_points_per_dollar ?? 1,
    loyalty_redemption_rate: business.loyalty_redemption_rate ?? 100,
  };

  if (isService) {
    return (
      <ServicePOSClient
        services={products as any}
        customers={customers as any}
        business={businessData as any}
        userId={user.id}
      />
    );
  }

  return (
    <POSClient
      products={products as any}
      customers={customers as any}
      business={businessData as any}
      userId={user.id}
    />
  );
}
