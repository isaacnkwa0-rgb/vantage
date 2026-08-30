import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect(`/${businessSlug}/dashboard`);

  return (
    <ProfileClient
      slug={businessSlug}
      profile={profile}
      userId={user.id}
    />
  );
}
