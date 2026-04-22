import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { SalesClient } from "@/components/sales/SalesClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function SalesPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, currency, phone, address, logo_url")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  // Fetch last 90 days of sales with customer name
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data: sales } = await supabase
    .from("sales")
    .select(`
      id, sale_number, total_amount, subtotal, discount_amount,
      tax_amount, amount_paid, change_amount, payment_method,
      payment_status, created_at,
      customers ( name, phone )
    `)
    .eq("business_id", business.id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Transactions" />
      <SalesClient
        sales={(sales ?? []) as any}
        business={business as any}
      />
    </div>
  );
}
