import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { BankAccountsClient } from "@/components/bank/BankAccountsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function BankAccountsPage({ params }: Props) {
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

  const [accountsRes, txRes] = await Promise.all([
    supabase
      .from("bank_accounts")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("is_primary", { ascending: false }),
    supabase
      .from("bank_transactions")
      .select("*")
      .eq("business_id", business.id)
      .order("date", { ascending: false })
      .limit(100),
  ]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Bank Accounts" />
      <BankAccountsClient
        accounts={(accountsRes.data ?? []) as any}
        transactions={(txRes.data ?? []) as any}
        currency={business.currency}
        businessId={business.id}
        userId={user.id}
      />
    </div>
  );
}
