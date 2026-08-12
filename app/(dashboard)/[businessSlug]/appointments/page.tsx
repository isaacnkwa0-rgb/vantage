import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { AppointmentsClient } from "@/components/appointments/AppointmentsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function AppointmentsPage({ params }: Props) {
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

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const [apptRes, membersRes, customersRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("*")
      .eq("business_id", business.id)
      .gte("start_time", weekStart.toISOString().split("T")[0])
      .lte("start_time", weekEnd.toISOString().split("T")[0] + "T23:59:59")
      .order("start_time"),
    supabase
      .from("business_members")
      .select("user_id, profiles(full_name)")
      .eq("business_id", business.id)
      .eq("is_active", true),
    supabase
      .from("customers")
      .select("id, name, phone")
      .eq("business_id", business.id)
      .order("name"),
  ]);

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar title="Appointments" />
      <AppointmentsClient
        appointments={(apptRes.data ?? []) as any}
        members={(membersRes.data ?? []) as any}
        customers={(customersRes.data ?? []) as any}
        businessId={business.id}
        weekStart={weekStart.toISOString().split("T")[0]}
      />
    </div>
  );
}
