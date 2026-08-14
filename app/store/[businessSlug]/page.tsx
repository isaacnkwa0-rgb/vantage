import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Script from "next/script";
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
    .select("id, name, slug, description, logo_url, currency, phone, email, address, city, social_whatsapp, social_instagram, store_shipping_enabled, store_shipping_fee, store_free_shipping_above, store_delivery_note, fb_pixel_id, ga_measurement_id")
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

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("business_id", business.id)
    .order("name");

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
