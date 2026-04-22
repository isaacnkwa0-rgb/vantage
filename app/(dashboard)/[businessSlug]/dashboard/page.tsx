import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { TopProducts } from "@/components/dashboard/TopProducts";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function DashboardPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get business
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, currency, business_type")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  // Today's date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Fetch dashboard data in parallel
  const [salesRes, expensesRes, productsRes, customersRes] = await Promise.all([
    supabase
      .from("sales")
      .select("id, total_amount, created_at, payment_method, customers(name), sale_number")
      .eq("business_id", business.id)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString())
      .order("created_at", { ascending: false }),

    supabase
      .from("expenses")
      .select("amount")
      .eq("business_id", business.id)
      .gte("expense_date", todayStart.toISOString().split("T")[0])
      .lte("expense_date", todayEnd.toISOString().split("T")[0]),

    supabase
      .from("products")
      .select("id, name, stock_quantity, low_stock_threshold, is_active")
      .eq("business_id", business.id)
      .eq("is_active", true),

    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
  ]);

  const todaySales = salesRes.data ?? [];
  const todayExpenses = expensesRes.data ?? [];
  const products = productsRes.data ?? [];

  const todayRevenue = todaySales.reduce((s, r) => s + r.total_amount, 0);
  const todayExpenseTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
  const lowStockProducts = products.filter(
    (p) => p.stock_quantity <= p.low_stock_threshold
  );
  const totalCustomers = customersRes.count ?? 0;

  // Month revenue
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { data: monthSales } = await supabase
    .from("sales")
    .select("total_amount")
    .eq("business_id", business.id)
    .gte("created_at", monthStart.toISOString());
  const monthRevenue = (monthSales ?? []).reduce((s, r) => s + r.total_amount, 0);

  const businessType = (business.business_type ?? "retail") as "retail" | "service" | "restaurant";
  const avgTransactionValue = todaySales.length > 0 ? todayRevenue / todaySales.length : 0;

  const hour = new Date().getUTCHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const formattedDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Dashboard" />
      <div className="flex-1 p-3 sm:p-5 space-y-4 sm:space-y-5">
        {/* Welcome header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{formattedDate}</p>
            <h1 className="text-xl font-bold text-[#0F172A] mt-1">
              {greeting},{" "}
              <span className="text-green-500">{business.name}</span>
            </h1>
          </div>
          <Link
            href={`/${businessSlug}/pos`}
            className="hidden sm:flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex-shrink-0 shadow-md shadow-green-300/40"
          >
            <ShoppingCart className="w-4 h-4" />
            {businessType === "service" ? "Record Service" : businessType === "restaurant" ? "New Order" : "Open POS"}
          </Link>
        </div>

        {/* Stats */}
        <DashboardStats
          todayRevenue={todayRevenue}
          todaySalesCount={todaySales.length}
          todayExpenses={todayExpenseTotal}
          monthRevenue={monthRevenue}
          lowStockCount={lowStockProducts.length}
          totalCustomers={totalCustomers}
          avgTransactionValue={avgTransactionValue}
          currency={business.currency}
          businessType={businessType}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent transactions */}
          <div className="lg:col-span-2">
            <RecentSales sales={todaySales as any} currency={business.currency} businessType={businessType} />
          </div>

          {/* Sidebar cards */}
          <div className="space-y-4">
            {businessType === "retail" && lowStockProducts.length > 0 && (
              <LowStockAlert products={lowStockProducts} slug={businessSlug} />
            )}
            <TopProducts businessId={business.id} currency={business.currency} businessType={businessType} />
          </div>
        </div>
      </div>
    </div>
  );
}
