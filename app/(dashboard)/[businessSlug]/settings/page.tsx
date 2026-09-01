import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SettingsMenu } from "@/components/settings/SettingsMenu";
import { SettingsClient } from "@/components/settings/SettingsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const TAB_LABELS: Record<string, string> = {
  business: "Business Profile",
  categories: "Categories",
  locations: "Locations",
  staff: "Staff & Roles",
  receipt: "Receipt & Invoice",
  store: "Store Settings",
  billing: "Billing & Plan",
};

export default async function SettingsPage({ params, searchParams }: Props) {
  const { businessSlug } = await params;
  const { tab } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  // No tab selected → show Bumpa-style menu
  if (!tab) {
    return (
      <div className="flex flex-col flex-1 overflow-auto">
        <SettingsMenu business={business} businessSlug={businessSlug} />
      </div>
    );
  }

  // Tab selected → back-arrow header + settings form
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
    <div className="flex flex-col flex-1 overflow-auto">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0 relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 via-green-400 to-transparent pointer-events-none" />
        <Link
          href={`/${businessSlug}/settings`}
          className="p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 transition"
          aria-label="Back to settings"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-base font-bold text-[#0F172A]">{TAB_LABELS[tab] ?? "Settings"}</h2>
      </header>
      <SettingsClient
        business={business}
        members={(members ?? []) as any}
        locations={(locations ?? []) as any}
        categories={(categories ?? []) as any}
        currentUserId={user.id}
        userEmail={user.email ?? ""}
        hideNav
      />
    </div>
  );
}
