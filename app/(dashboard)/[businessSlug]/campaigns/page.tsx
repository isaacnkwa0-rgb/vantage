import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { CampaignsClient } from "@/components/campaigns/CampaignsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function CampaignsPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, social_whatsapp")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const [campaignsRes, tagsRes, statsRes] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, channel, subject, message, target_type, target_tag_id, target_min_spent, status, sent_count, failed_count, sent_at, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_tags")
      .select("id, name, color")
      .eq("business_id", business.id)
      .order("name"),
    supabase
      .from("customers")
      .select("id, email, phone")
      .eq("business_id", business.id),
  ]);

  const customers = statsRes.data ?? [];
  const emailCount = customers.filter((c) => c.email).length;
  const phoneCount = customers.filter((c) => c.phone).length;

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar title="Campaigns" />
      <CampaignsClient
        campaigns={(campaignsRes.data ?? []) as any}
        tags={(tagsRes.data ?? []) as any}
        businessId={business.id}
        userId={user.id}
        businessName={business.name}
        whatsappNumber={business.social_whatsapp ?? null}
        emailReachCount={emailCount}
        phoneReachCount={phoneCount}
      />
    </div>
  );
}
