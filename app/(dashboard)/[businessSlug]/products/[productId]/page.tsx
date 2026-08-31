import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ProductDetailPage } from "@/components/products/ProductDetailPage";

interface Props {
  params: Promise<{ businessSlug: string; productId: string }>;
}

export default async function ProductDetailRoute({ params }: Props) {
  const { businessSlug, productId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, currency, business_type")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const { data: product } = await supabase
    .from("products")
    .select("*, categories(name, color), locations(name)")
    .eq("id", productId)
    .eq("business_id", business.id)
    .single();
  if (!product) notFound();

  const [{ data: categories }, { data: locations }, { data: salesItems }, { data: adjustments }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name, color")
        .eq("business_id", business.id)
        .order("name"),
      supabase
        .from("locations")
        .select("id, name, address, phone, is_active")
        .eq("business_id", business.id)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("sale_items")
        .select("quantity, line_total, sale_id")
        .eq("product_id", productId)
        .eq("business_id", business.id),
      supabase
        .from("stock_adjustments")
        .select("adjustment, reason, notes, created_at")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const items = salesItems ?? [];
  const totalUnitsSold = items.reduce((s, r) => s + r.quantity, 0);
  const totalRevenue = items.reduce((s, r) => s + r.line_total, 0);
  const totalSalesCount = new Set(items.map((r) => r.sale_id)).size;

  const isService = business.business_type === "service";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="hidden lg:block">
        <TopBar title={product.name} />
      </div>
      <ProductDetailPage
        product={product as any}
        categories={categories ?? []}
        locations={locations ?? []}
        businessId={business.id}
        currency={business.currency}
        slug={businessSlug}
        isService={isService}
        totalUnitsSold={totalUnitsSold}
        totalRevenue={totalRevenue}
        totalSalesCount={totalSalesCount}
        recentAdjustments={adjustments ?? []}
      />
    </div>
  );
}
