import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { CreditNotesClient } from "@/components/credit-notes/CreditNotesClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function CreditNotesPage({ params }: Props) {
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

  const [cnsRes, customersRes, invoicesRes] = await Promise.all([
    supabase
      .from("credit_notes")
      .select("*, customers(name), invoices(invoice_number)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("customers")
      .select("id, name")
      .eq("business_id", business.id)
      .order("name"),
    supabase
      .from("invoices")
      .select("id, invoice_number")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar title="Credit Notes" />
      <CreditNotesClient
        creditNotes={(cnsRes.data ?? []) as any}
        customers={(customersRes.data ?? []) as any}
        invoices={(invoicesRes.data ?? []) as any}
        currency={business.currency}
        businessId={business.id}
        userId={user.id}
      />
    </div>
  );
}
