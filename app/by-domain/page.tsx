import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { StoreFront } from "@/components/store/StoreFront";

// This page is reached when a request arrives on a custom domain
// (e.g. shop.zikkygadgets.com). The middleware sets x-original-host
// so we can look up which business owns that domain.
export default async function ByDomainPage() {
  const headersList = await headers();
  const host = headersList.get("x-original-host");

  if (!host) notFound();

  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, description, logo_url, currency, phone, email, address, city, social_whatsapp, social_instagram, store_shipping_enabled, store_shipping_fee, store_free_shipping_above, store_delivery_note, fb_pixel_id, ga_measurement_id")
    .eq("custom_domain", host)
    .eq("is_active", true)
    .single();

  if (!business) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, image_url, selling_price, stock_quantity, track_inventory")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .gt("selling_price", 0)
    .order("name");

  return (
    <StoreFront
      business={business as any}
      products={(products ?? []) as any}
    />
  );
}
