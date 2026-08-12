import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { DiscountsClient } from "@/components/discounts/DiscountsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function DiscountsPage({ params }: Props) {
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

  const { data: codes } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar title="Discounts & Promo Codes" />
      <DiscountsClient
        codes={codes ?? []}
        businessId={business.id}
        currency={business.currency}
        userId={user.id}
      />
    </div>
  );
}
