import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { NotificationsClient } from "@/components/notifications/NotificationsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function NotificationsPage({ params }: Props) {
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

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Notifications" />
      <NotificationsClient
        initial={(notifications ?? []) as any}
        businessId={business.id}
        businessSlug={businessSlug}
      />
    </div>
  );
}
