import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { BusinessHealth } from "@/components/dashboard/BusinessHealth";
import { InventoryPanel } from "@/components/dashboard/InventoryPanel";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { TopProductsPanel } from "@/components/dashboard/TopProductsPanel";
import { MobileDashboard } from "@/components/dashboard/MobileDashboard";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function DashboardPage({ params }: Props) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, full_name")
    .eq("id", user.id)
    .single();

  const referralCode = user.id.replace(/-/g, "").slice(0, 8).toUpperCase();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, currency, business_type")
    .eq("slug", businessSlug)
    .single();
  if (!business) redirect("/onboarding");

  const businessType = (business.business_type ?? "retail") as "retail" | "service" | "restaurant";

  // Date boundaries
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayStart); yesterdayEnd.setMilliseconds(-1);

  const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const lastMonthStart = new Date(monthStart); lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthEnd = new Date(monthStart); lastMonthEnd.setMilliseconds(-1);

  const ninetyDaysAgo = new Date(now); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89); ninetyDaysAgo.setHours(0, 0, 0, 0);

  // Week start (Monday)
  const weekStart = new Date(now);
  const dayOfWeek = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  weekStart.setHours(0, 0, 0, 0);

  const [
    todaySalesRes,
    yesterdaySalesRes,
    chartSalesRes,
    monthExpensesRes,
    lastMonthExpensesRes,
    lastMonthSalesRes,
    monthCOGSRes,
    lastMonthCOGSRes,
    productsRes,
    customersRes,
    newCustomersRes,
    locationsRes,
  ] = await Promise.all([
    // Today's full sales (for recent transactions + KPIs)
    supabase
      .from("sales")
      .select("id, total_amount, created_at, payment_method, sale_number, customers(name)")
      .eq("business_id", business.id)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString())
      .order("created_at", { ascending: false }),

    // Yesterday's totals
    supabase
      .from("sales")
      .select("total_amount")
      .eq("business_id", business.id)
      .gte("created_at", yesterdayStart.toISOString())
      .lte("created_at", yesterdayEnd.toISOString()),

    // 90-day sales for chart (date + amount only)
    supabase
      .from("sales")
      .select("created_at, total_amount")
      .eq("business_id", business.id)
      .gte("created_at", ninetyDaysAgo.toISOString())
      .order("created_at", { ascending: true }),

    // This month's expenses
    supabase
      .from("expenses")
      .select("amount")
      .eq("business_id", business.id)
      .gte("expense_date", monthStart.toISOString().split("T")[0]),

    // Last month's expenses
    supabase
      .from("expenses")
      .select("amount")
      .eq("business_id", business.id)
      .gte("expense_date", lastMonthStart.toISOString().split("T")[0])
      .lte("expense_date", lastMonthEnd.toISOString().split("T")[0]),

    // Last month's sales total
    supabase
      .from("sales")
      .select("total_amount")
      .eq("business_id", business.id)
      .gte("created_at", lastMonthStart.toISOString())
      .lte("created_at", lastMonthEnd.toISOString()),

    // This month's COGS — cost_price × quantity from sale_items
    supabase
      .from("sales")
      .select("sale_items(cost_price, quantity)")
      .eq("business_id", business.id)
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", todayEnd.toISOString()),

    // Last month's COGS
    supabase
      .from("sales")
      .select("sale_items(cost_price, quantity)")
      .eq("business_id", business.id)
      .gte("created_at", lastMonthStart.toISOString())
      .lte("created_at", lastMonthEnd.toISOString()),

    // Products (all active)
    supabase
      .from("products")
      .select("id, name, stock_quantity, low_stock_threshold, is_active, selling_price")
      .eq("business_id", business.id)
      .eq("is_active", true),

    // Total customers
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),

    // New customers this month
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("created_at", monthStart.toISOString()),

    // Active locations for this business
    supabase
      .from("locations")
      .select("id, name")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name"),
  ]);

  const locations = (locationsRes.data ?? []).map((l) => ({ id: l.id, name: l.name }));

  // Derived values
  const todaySales = todaySalesRes.data ?? [];
  const todayRevenue = todaySales.reduce((s, r) => s + r.total_amount, 0);
  const todaySalesCount = todaySales.length;

  const yesterdaySales = yesterdaySalesRes.data ?? [];
  const yesterdayRevenue = yesterdaySales.reduce((s, r) => s + r.total_amount, 0);
  const yesterdayCount = yesterdaySales.length;

  // Chart raw data (individual sales, 90 days)
  const chartSalesRaw = chartSalesRes.data ?? [];
  const chartSales = chartSalesRaw.map((s) => ({
    date: s.created_at.split("T")[0],
    amount: s.total_amount,
  }));

  // Week data (Monday–now, derived from chart raw)
  const weekRaw = chartSalesRaw.filter((s) => s.created_at >= weekStart.toISOString());
  const weekRevenue = weekRaw.reduce((sum, s) => sum + s.total_amount, 0);
  const weekSalesCount = weekRaw.length;

  // Month revenue + count (derive from chart raw)
  const monthRaw = chartSalesRaw.filter((s) => s.created_at >= monthStart.toISOString());
  const monthRevenue = monthRaw.reduce((sum, s) => sum + s.total_amount, 0);
  const monthSalesCount = monthRaw.length;


  const monthExpenses = (monthExpensesRes.data ?? []).reduce((s, e) => s + e.amount, 0);
  const lastMonthExpenses = (lastMonthExpensesRes.data ?? []).reduce((s, e) => s + e.amount, 0);
  const lastMonthRevenue = (lastMonthSalesRes.data ?? []).reduce((s, r) => s + r.total_amount, 0);

  // COGS = sum of (cost_price × quantity) across all sale_items for each sale
  const monthCOGS = (monthCOGSRes.data ?? [])
    .flatMap((s) => (s.sale_items as { cost_price: number; quantity: number }[] | null) ?? [])
    .reduce((sum, item) => sum + item.cost_price * item.quantity, 0);

  const lastMonthCOGS = (lastMonthCOGSRes.data ?? [])
    .flatMap((s) => (s.sale_items as { cost_price: number; quantity: number }[] | null) ?? [])
    .reduce((sum, item) => sum + item.cost_price * item.quantity, 0);

  const products = productsRes.data ?? [];
  const lowStockProducts = products.filter((p) => p.stock_quantity <= p.low_stock_threshold);
  const totalProductsSellValue = products.reduce((sum, p) => sum + (p.selling_price ?? 0) * p.stock_quantity, 0);

  const totalCustomers = customersRes.count ?? 0;
  const newCustomers = newCustomersRes.count ?? 0;

  const netProfit = monthRevenue - monthCOGS - monthExpenses;
  const revenueGrowthPct = lastMonthRevenue > 0
    ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : null;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white lg:bg-[#F7F9FC]">
      <div className="hidden lg:block">
        <TopBar title="Dashboard" />
      </div>

      {/* ── Mobile dashboard (Bumpa-style) ── */}
      <div className="flex flex-col flex-1 min-h-0 lg:hidden">
        <MobileDashboard
          businessName={business.name}
          businessType={businessType}
          slug={businessSlug}
          currency={business.currency}
          avatarUrl={profile?.avatar_url ?? null}
          firstName={profile?.full_name?.trim().split(" ")[0] ?? businessSlug}
          referralCode={referralCode}
          todayRevenue={todayRevenue}
          todaySalesCount={todaySalesCount}
          weekRevenue={weekRevenue}
          weekSalesCount={weekSalesCount}
          monthRevenue={monthRevenue}
          monthSalesCount={monthSalesCount}
          monthExpenses={monthExpenses}
          netProfit={netProfit}
          revenueGrowthPct={revenueGrowthPct}
          sales={todaySales as any}
          totalProducts={products.length}
          totalProductsSellValue={totalProductsSellValue}
          totalCustomers={totalCustomers}
          newCustomers={newCustomers}
          locations={locations}
        />
      </div>

      {/* ── Desktop dashboard ── */}
      <div className="hidden lg:flex flex-col flex-1 overflow-auto">
      <div className="flex-1 p-4 sm:p-6 space-y-5 max-w-screen-2xl mx-auto w-full">

        {/* Header + Quick Actions */}
        <DashboardHeader
          businessName={business.name}
          businessType={businessType}
          slug={businessSlug}
        />

        {/* KPI Grid */}
        <KpiGrid
          todayRevenue={todayRevenue}
          todaySalesCount={todaySalesCount}
          yesterdayRevenue={yesterdayRevenue}
          yesterdaySalesCount={yesterdayCount}
          monthRevenue={monthRevenue}
          monthCOGS={monthCOGS}
          monthExpenses={monthExpenses}
          lastMonthRevenue={lastMonthRevenue}
          lastMonthCOGS={lastMonthCOGS}
          lastMonthExpenses={lastMonthExpenses}
          currency={business.currency}
          businessType={businessType}
        />

        {/* Revenue chart */}
        <RevenueChart sales={chartSales} currency={business.currency} />

        {/* Health + Inventory row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BusinessHealth
            monthRevenue={monthRevenue}
            lastMonthRevenue={lastMonthRevenue}
            monthExpenses={monthExpenses}
            totalProducts={products.length}
            lowStockCount={lowStockProducts.length}
            totalCustomers={totalCustomers}
            newCustomers={newCustomers}
            slug={businessSlug}
          />
          {businessType === "retail" ? (
            <InventoryPanel products={products} slug={businessSlug} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-center items-center gap-2 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customers</p>
              <p className="text-3xl font-bold text-slate-900">{totalCustomers.toLocaleString()}</p>
              <p className="text-xs text-slate-400">{newCustomers} new this month</p>
            </div>
          )}
        </div>

        {/* Transactions + Products */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <RecentTransactions
              sales={todaySales as any}
              currency={business.currency}
              businessType={businessType}
              slug={businessSlug}
            />
          </div>
          <div className="lg:col-span-2">
            <TopProductsPanel
              businessId={business.id}
              currency={business.currency}
              businessType={businessType}
              slug={businessSlug}
            />
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}
