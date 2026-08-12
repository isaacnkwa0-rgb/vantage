import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { SuppliersClient } from "@/components/suppliers/SuppliersClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function SuppliersPage({ params }: Props) {
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

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Suppliers" />
      <SuppliersClient
        suppliers={(suppliers ?? []) as any}
        businessId={business.id}
      />
    </div>
  );
}
