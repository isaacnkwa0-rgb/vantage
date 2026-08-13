import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface KpiGridProps {
  todayRevenue: number;
  todaySalesCount: number;
  yesterdayRevenue: number;
  yesterdaySalesCount: number;
  monthRevenue: number;
  monthCOGS: number;
  monthExpenses: number;
  lastMonthRevenue: number;
  lastMonthCOGS: number;
  lastMonthExpenses: number;
  currency: string;
  businessType: "retail" | "service" | "restaurant";
}

function pct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  if (value > 0) return <span className="trend-up"><TrendingUp className="w-3 h-3" />+{value.toFixed(1)}%</span>;
  if (value < 0) return <span className="trend-down"><TrendingDown className="w-3 h-3" />{value.toFixed(1)}%</span>;
  return <span className="trend-neutral"><Minus className="w-3 h-3" />0%</span>;
}

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  trend: number | null;
  trendLabel: string;
  accentClass: string;
}

function KpiCard({ label, value, sub, trend, trendLabel, accentClass }: KpiCardProps) {
  return (
    <div className="kpi-card group">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 tracking-wide">{label}</p>
        <TrendBadge value={trend} />
      </div>
      <p className={cn("font-numeric text-2xl font-bold tracking-tight", accentClass)}>{value}</p>
      <p className="text-xs text-slate-400 mt-1.5">{sub}</p>
      {trend !== null && (
        <p className="text-[11px] text-slate-400 mt-0.5">{trendLabel}</p>
      )}
    </div>
  );
}

export function KpiGrid({
  todayRevenue,
  todaySalesCount,
  yesterdayRevenue,
  yesterdaySalesCount,
  monthRevenue,
  monthCOGS,
  monthExpenses,
  lastMonthRevenue,
  lastMonthCOGS,
  lastMonthExpenses,
  currency,
  businessType,
}: KpiGridProps) {
  const fmt = (n: number) => formatCurrency(n, currency);

  // Gross profit = Revenue − Cost of Goods Sold − Operating Expenses
  const netProfit = monthRevenue - monthCOGS - monthExpenses;
  const lastMonthProfit = lastMonthRevenue - lastMonthCOGS - lastMonthExpenses;
  const margin = monthRevenue > 0 ? (netProfit / monthRevenue) * 100 : null;

  const txLabel = businessType === "service" ? "services" : businessType === "restaurant" ? "orders" : "sales";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <KpiCard
        label="Today's Revenue"
        value={todayRevenue > 0 ? fmt(todayRevenue) : "—"}
        sub={`${todaySalesCount} ${txLabel} today`}
        trend={pct(todayRevenue, yesterdayRevenue)}
        trendLabel="vs yesterday"
        accentClass="text-slate-900"
      />
      <KpiCard
        label="Today's Sales"
        value={String(todaySalesCount)}
        sub={`${txLabel}`}
        trend={pct(todaySalesCount, yesterdaySalesCount)}
        trendLabel="vs yesterday"
        accentClass="text-slate-900"
      />
      <KpiCard
        label="Month Expenses"
        value={monthExpenses > 0 ? fmt(monthExpenses) : "—"}
        sub="this month"
        trend={lastMonthExpenses > 0 ? pct(monthExpenses, lastMonthExpenses) : null}
        trendLabel="vs last month"
        accentClass={monthExpenses > monthRevenue * 0.7 ? "text-red-600" : "text-slate-900"}
      />
      <KpiCard
        label="Net Profit"
        value={monthRevenue > 0 ? fmt(netProfit) : "—"}
        sub={margin !== null ? `${margin.toFixed(1)}% margin` : "this month"}
        trend={pct(netProfit, lastMonthProfit)}
        trendLabel="vs last month"
        accentClass={netProfit >= 0 ? "text-emerald-600" : "text-red-600"}
      />
    </div>
  );
}
