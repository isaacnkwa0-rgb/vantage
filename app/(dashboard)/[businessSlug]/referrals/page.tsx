import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ReferralsClient } from "@/components/referrals/ReferralsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function ReferralsPage({ params }: Props) {
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

  const [programRes, referralsRes] = await Promise.all([
    supabase
      .from("referral_programs")
      .select("*")
      .eq("business_id", business.id)
      .single(),
    supabase
      .from("referrals")
      .select("*, referrer:customers!referrals_referrer_id_fkey(name), referred:customers!referrals_referred_id_fkey(name)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Referral Program" />
      <ReferralsClient
        program={programRes.data as any}
        referrals={(referralsRes.data ?? []) as any}
        currency={business.currency}
        businessId={business.id}
      />
    </div>
  );
}
