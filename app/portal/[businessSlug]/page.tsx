import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CustomerPortal } from "@/components/portal/CustomerPortal";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();
  const { data: business } = await supabase.from("businesses").select("name").eq("slug", businessSlug).single();
  return { title: business ? `${business.name} — Customer Portal` : "Customer Portal" };
}

export default async function PortalPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, logo_url, currency")
    .eq("slug", businessSlug)
    .eq("is_active", true)
    .single();

  if (!business) notFound();

  return <CustomerPortal business={business as any} />;
}
