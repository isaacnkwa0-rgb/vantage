import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { GiftCardsClient } from "@/components/gift-cards/GiftCardsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function GiftCardsPage({ params }: Props) {
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

  const [cardsRes, customersRes] = await Promise.all([
    supabase
      .from("gift_cards")
      .select("*, customers(name)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("customers")
      .select("id, name, email")
      .eq("business_id", business.id)
      .order("name"),
  ]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Gift Cards" />
      <GiftCardsClient
        cards={(cardsRes.data ?? []) as any}
        customers={(customersRes.data ?? []) as any}
        currency={business.currency}
        businessId={business.id}
        userId={user.id}
      />
    </div>
  );
}
