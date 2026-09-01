import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NotificationsHeader } from "@/components/notifications/NotificationsHeader";
import { NotificationsClient } from "@/components/notifications/NotificationsClient";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function NotificationsPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, currency, business_type")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const today = new Date().toISOString().split("T")[0];
  const isService = business.business_type === "service";

  const [
    { data: notifications },
    { data: lowStockProducts },
    { data: overdueInvoices },
    { data: creditCustomers },
  ] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(100),
    isService
      ? Promise.resolve({ data: [] })
      : supabase
          .from("products")
          .select("id, name, stock_quantity, low_stock_threshold")
          .eq("business_id", business.id)
          .eq("track_inventory", true)
          .eq("is_active", true),
    supabase
      .from("invoices")
      .select("id, invoice_number, due_date, client_name")
      .eq("business_id", business.id)
      .not("status", "in", '("paid","cancelled")')
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(10),
    supabase
      .from("customers")
      .select("id, name, credit_balance")
      .eq("business_id", business.id)
      .gt("credit_balance", 0)
      .order("credit_balance", { ascending: false })
      .limit(10),
  ]);

  const lowStock = (lowStockProducts ?? []).filter(
    (p) => p.stock_quantity <= p.low_stock_threshold
  );

  type ComputedAlert = {
    id: string;
    type: "low_stock" | "overdue_invoice" | "credit_due";
    title: string;
    body: string;
    href: string;
  };

  const computedAlerts: ComputedAlert[] = [
    ...lowStock.slice(0, 5).map((p) => ({
      id: `low_${p.id}`,
      type: "low_stock" as const,
      title: "Low stock",
      body: `${p.name} — only ${p.stock_quantity} left`,
      href: `/${businessSlug}/products`,
    })),
    ...(overdueInvoices ?? []).slice(0, 5).map((inv) => {
      const days = Math.floor((Date.now() - new Date(inv.due_date!).getTime()) / 86400000);
      return {
        id: `inv_${inv.id}`,
        type: "overdue_invoice" as const,
        title: "Overdue invoice",
        body: `${inv.invoice_number} · ${inv.client_name ?? "Unknown"} — ${days}d overdue`,
        href: `/${businessSlug}/invoices`,
      };
    }),
    ...(creditCustomers ?? []).slice(0, 5).map((c) => ({
      id: `credit_${c.id}`,
      type: "credit_due" as const,
      title: "Credit outstanding",
      body: `${c.name} has an outstanding credit balance`,
      href: `/${businessSlug}/customers`,
    })),
  ];

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <NotificationsHeader businessSlug={businessSlug} />
      <NotificationsClient
        initial={(notifications ?? []) as any}
        computedAlerts={computedAlerts}
        businessId={business.id}
        businessSlug={businessSlug}
      />
    </div>
  );
}
