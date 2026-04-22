import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ReportsClient } from "@/components/reports/ReportsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function ReportsPage({ params }: Props) {
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

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Reports" />
      <ReportsClient businessId={business.id} currency={business.currency} />
    </div>
  );
}
