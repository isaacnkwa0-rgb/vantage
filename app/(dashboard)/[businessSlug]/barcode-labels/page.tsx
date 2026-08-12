import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { BarcodeLabelsClient } from "@/components/barcode/BarcodeLabelsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function BarcodeLabelsPage({ params }: Props) {
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

  const { data: products } = await supabase
    .from("products")
    .select("id, name, sku, barcode, selling_price")
    .eq("business_id", business.id)
    .order("name");

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar title="Barcode Labels" />
      <BarcodeLabelsClient
        products={(products ?? []) as any}
        currency={business.currency}
      />
    </div>
  );
}
