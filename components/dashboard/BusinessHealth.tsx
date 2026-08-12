import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Props {
  monthRevenue: number;
  lastMonthRevenue: number;
  monthExpenses: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  newCustomers: number;
  slug: string;
}

type HealthLevel = "excellent" | "good" | "attention" | "critical" | "no-data";

function getLevel(value: number | null, thresholds: [number, number]): HealthLevel {
  if (value === null) return "no-data";
  if (value >= thresholds[0]) return "excellent";
  if (value >= thresholds[1]) return "good";
  if (value >= 0) return "attention";
  return "critical";
}

const LEVEL_CONFIG: Record<HealthLevel, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  excellent: { label: "Excellent", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  good:      { label: "Good",      icon: TrendingUp,  color: "text-green-600",   bg: "bg-green-50"   },
  attention: { label: "Needs attention", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  critical:  { label: "Critical",  icon: XCircle,     color: "text-red-600",     bg: "bg-red-50"     },
  "no-data": { label: "No data",   icon: Minus,       color: "text-slate-400",   bg: "bg-slate-50"   },
};

interface IndicatorProps {
  label: string;
  level: HealthLevel;
  detail: string;
  href?: string;
}

function Indicator({ label, level, detail, href }: IndicatorProps) {
  const cfg = LEVEL_CONFIG[level];
  const Icon = cfg.icon;
  const inner = (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", cfg.bg)}>
          <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
        </div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
      </div>
      <div className="text-right">
        <p className={cn("text-xs font-semibold", cfg.color)}>{cfg.label}</p>
        <p className="text-[11px] text-slate-400">{detail}</p>
      </div>
    </div>
  );
  if (href) return <Link href={href} className="block hover:bg-slate-50 rounded-lg px-2 -mx-2 transition">{inner}</Link>;
  return <div className="px-2 -mx-2">{inner}</div>;
}

export function BusinessHealth({
  monthRevenue, lastMonthRevenue, monthExpenses,
  totalProducts, lowStockCount, totalCustomers, newCustomers, slug,
}: Props) {
  const revenueGrowth = lastMonthRevenue > 0
    ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : null;
  const margin = monthRevenue > 0
    ? ((monthRevenue - monthExpenses) / monthRevenue) * 100
    : null;
  const stockHealthPct = totalProducts > 0
    ? ((totalProducts - lowStockCount) / totalProducts) * 100
    : null;

  const revenueLevel = getLevel(revenueGrowth, [15, 0]);
  const marginLevel = getLevel(margin, [25, 10]);
  const stockLevel = getLevel(stockHealthPct, [95, 80]);
  const customerLevel: HealthLevel = newCustomers > 5 ? "excellent" : newCustomers > 0 ? "good" : totalCustomers > 0 ? "attention" : "no-data";

  const revenueDetail = revenueGrowth !== null ? `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}% vs last month` : "Insufficient data";
  const marginDetail = margin !== null ? `${margin.toFixed(1)}% profit margin` : "No sales this month";
  const stockDetail = totalProducts > 0 ? `${lowStockCount} of ${totalProducts} need restock` : "No products";
  const customerDetail = `${newCustomers} new this month`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-900">Business Health</p>
        <span className="text-xs text-slate-400">This month</span>
      </div>
      <div className="divide-y divide-slate-100">
        <Indicator label="Revenue growth" level={revenueLevel} detail={revenueDetail} />
        <Indicator label="Profit margin" level={marginLevel} detail={marginDetail} />
        <Indicator label="Inventory health" level={stockLevel} detail={stockDetail} href={`/${slug}/products`} />
        <Indicator label="Customer growth" level={customerLevel} detail={customerDetail} href={`/${slug}/customers`} />
      </div>
    </div>
  );
}
