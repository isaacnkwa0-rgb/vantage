import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { SettingsClient } from "@/components/settings/SettingsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const [{ data: members }, { data: locations }, { data: categories }] = await Promise.all([
    supabase
      .from("business_members")
      .select("id, role, is_active, joined_at, location_id, profiles(id, full_name, email, avatar_url)")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("joined_at"),
    supabase
      .from("locations")
      .select("id, name, address, phone, is_active")
      .eq("business_id", business.id)
      .order("name"),
    supabase
      .from("categories")
      .select("id, name, color")
      .eq("business_id", business.id)
      .order("name"),
  ]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Settings" />
      <SettingsClient
        business={business}
        members={(members ?? []) as any}
        locations={(locations ?? []) as any}
        categories={(categories ?? []) as any}
        currentUserId={user.id}
        userEmail={user.email ?? ""}
      />
    </div>
  );
}
