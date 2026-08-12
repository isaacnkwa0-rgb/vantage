import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ActivityClient } from "@/components/activity/ActivityClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function ActivityPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_name, entity_id, meta, created_at, user_id")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar title="Activity Log" />
      <ActivityClient logs={(logs ?? []) as any} />
    </div>
  );
}
