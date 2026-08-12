import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { StoreFront } from "@/components/store/StoreFront";

interface Props {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ order?: string; status?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, description")
    .eq("slug", businessSlug)
    .single();
  return {
    title: business ? `${business.name} — Online Store` : "Online Store",
    description: business?.description ?? "",
  };
}

export default async function StorePage({ params, searchParams }: Props) {
  const { businessSlug } = await params;
  const { order, status } = await searchParams;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, description, logo_url, currency, phone, email, address, city, social_whatsapp, social_instagram")
    .eq("slug", businessSlug)
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
      orderNumber={order}
      paymentStatus={status}
    />
  );
}
