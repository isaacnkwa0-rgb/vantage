import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ThermalPrinterClient } from "@/components/thermal/ThermalPrinterClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function ThermalPrinterPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, currency, phone, email, address, city")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const { data: recentSales } = await supabase
    .from("sales")
    .select("id, sale_number, total_amount, payment_method, created_at, customers(name), sale_items(quantity, unit_price, products(name))")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar title="Thermal Printer" />
      <ThermalPrinterClient
        business={business as any}
        recentSales={(recentSales ?? []) as any}
      />
    </div>
  );
}
