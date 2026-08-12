import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { CommissionsClient } from "@/components/commissions/CommissionsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function CommissionsPage({ params, searchParams }: Props) {
  const { businessSlug } = await params;
  const { from, to } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, currency")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  // Date range: default to current month
  const now = new Date();
  const fromDate = from ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const toDate = to ?? new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const [membersRes, rulesRes, salesRes] = await Promise.all([
    supabase
      .from("business_members")
      .select("user_id, role, profiles(id, full_name, email)")
      .eq("business_id", business.id)
      .eq("is_active", true),
    supabase
      .from("commission_rules")
      .select("user_id, type, value")
      .eq("business_id", business.id),
    supabase
      .from("sales")
      .select("served_by, total_amount, created_at")
      .eq("business_id", business.id)
      .gte("created_at", fromDate)
      .lte("created_at", toDate + "T23:59:59"),
  ]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Staff Commissions" />
      <CommissionsClient
        members={(membersRes.data ?? []) as any}
        rules={(rulesRes.data ?? []) as any}
        sales={(salesRes.data ?? []) as any}
        currency={business.currency}
        fromDate={fromDate}
        toDate={toDate}
        businessSlug={businessSlug}
      />
    </div>
  );
}
