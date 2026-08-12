import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { PayrollClient } from "@/components/payroll/PayrollClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function PayrollPage({ params }: Props) {
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

  const [staffRes, runsRes] = await Promise.all([
    supabase
      .from("staff")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("payroll_runs")
      .select("*, payroll_entries(*)")
      .eq("business_id", business.id)
      .order("period_start", { ascending: false })
      .limit(12),
  ]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Staff Payroll" />
      <PayrollClient
        staff={(staffRes.data ?? []) as any}
        runs={(runsRes.data ?? []) as any}
        currency={business.currency}
        businessId={business.id}
        userId={user.id}
      />
    </div>
  );
}
