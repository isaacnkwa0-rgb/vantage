import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { CustomersClient } from "@/components/customers/CustomersClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function CustomersPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, currency, business_type")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", business.id)
    .order("name");

  const isService = business.business_type === "service";

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title={isService ? "Clients" : "Customers"} />
      <CustomersClient
        customers={customers ?? []}
        businessId={business.id}
        currency={business.currency}
        businessType={(business.business_type ?? "retail") as "retail" | "service"}
      />
    </div>
  );
}
