import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ExpensesClient } from "@/components/expenses/ExpensesClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function ExpensesPage({ params }: Props) {
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

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("business_id", business.id)
    .order("expense_date", { ascending: false });

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Expenses" />
      <ExpensesClient
        expenses={expenses ?? []}
        businessId={business.id}
        currency={business.currency}
        userId={user.id}
      />
    </div>
  );
}
