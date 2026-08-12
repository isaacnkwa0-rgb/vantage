import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { BusinessProvider } from "@/components/layout/BusinessProvider";
import { CommandSearchProvider } from "@/components/layout/CommandSearch";
import { BottomNav } from "@/components/layout/BottomNav";

interface Props {
  children: React.ReactNode;
  params: Promise<{ businessSlug: string }>;
}

export default async function BusinessLayout({ children, params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify the user is a member of this business
  const { data: membership } = await supabase
    .from("business_members")
    .select("role, businesses!inner(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .eq("businesses.slug", businessSlug)
    .single();

  if (!membership || !membership.businesses) {
    redirect("/onboarding");
  }

  const business = membership.businesses as unknown as {
    id: string;
    name: string;
    slug: string;
    currency: string;
    logo_url: string | null;
  };

  return (
    <BusinessProvider business={business} role={membership.role}>
      <CommandSearchProvider>
        {/* Skip to main content — visible on focus for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-green-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>

        <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
          <Sidebar slug={businessSlug} />
          <main id="main-content" className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {children}
            </div>
            <BottomNav slug={businessSlug} />
          </main>
        </div>
      </CommandSearchProvider>
    </BusinessProvider>
  );
}
