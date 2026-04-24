import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { BusinessProvider } from "@/components/layout/BusinessProvider";

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
      <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
        <Sidebar slug={businessSlug} />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </BusinessProvider>
  );
}
