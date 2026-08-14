import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import { StoreFront } from "@/components/store/StoreFront";

interface Props {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ order?: string; status?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = createServiceClient();
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
  const supabase = createServiceClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, description, logo_url, currency, phone, email, address, city, social_whatsapp, social_instagram, store_shipping_enabled, store_shipping_fee, store_free_shipping_above, store_delivery_note, fb_pixel_id, ga_measurement_id, invoice_accent_color")
    .eq("slug", businessSlug)
    .eq("is_active", true)
    .single();

  if (!business) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, image_url, selling_price, stock_quantity, track_inventory, category_id")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .gt("selling_price", 0)
    .order("name");

  // Only show categories that have at least one active product, deduplicated by name.
  // Multiple rows with the same name get merged — all their IDs are stored together
  // so the filter can match products across duplicate category rows.
  const productCategoryIds = [...new Set(
    (products ?? []).map((p) => p.category_id).filter(Boolean) as string[]
  )];

  let categories: { id: string; name: string }[] = [];
  if (productCategoryIds.length > 0) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name")
      .in("id", productCategoryIds)
      .order("name");

    const nameToIds = new Map<string, string[]>();
    for (const cat of cats ?? []) {
      const ids = nameToIds.get(cat.name) ?? [];
      ids.push(cat.id);
      nameToIds.set(cat.name, ids);
    }
    categories = [...nameToIds.entries()].map(([name, ids]) => ({ id: ids.join(","), name }));
  }

  return (
    <>
      {/* Facebook Pixel */}
      {business.fb_pixel_id && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${business.fb_pixel_id}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
      {/* Google Analytics */}
      {business.ga_measurement_id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${business.ga_measurement_id}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${business.ga_measurement_id}');
            `}
          </Script>
        </>
      )}
      <StoreFront
        business={business as any}
        products={(products ?? []) as any}
        categories={(categories ?? []) as any}
        orderNumber={order}
        paymentStatus={status}
      />
    </>
  );
}
