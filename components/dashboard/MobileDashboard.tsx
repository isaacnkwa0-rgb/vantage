"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye, EyeOff, ShoppingCart, Box, Users, FileText,
  DollarSign, TrendingUp, TrendingDown, ChevronRight,
  ChevronDown, Bell, User, Store, Share2, BarChart2, X, Check, MapPin, Trophy,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { useBusinessStore } from "@/store/businessStore";

interface Sale {
  id: string;
  sale_number: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  customers: { name: string } | null;
}

interface Props {
  businessName: string;
  businessType: "retail" | "service" | "restaurant";
  slug: string;
  currency: string;
  todayRevenue: number;
  todaySalesCount: number;
  weekRevenue: number;
  weekSalesCount: number;
  monthRevenue: number;
  monthSalesCount: number;
  monthExpenses: number;
  netProfit: number;
  revenueGrowthPct: number | null;
  sales: Sale[];
  totalProducts: number;
  totalCustomers: number;
  newCustomers: number;
  locations: { id: string; name: string }[];
}

const METHOD_STYLES: Record<string, string> = {
  cash:     "bg-green-50 text-green-700",
  card:     "bg-blue-50 text-blue-700",
  transfer: "bg-purple-50 text-purple-700",
  split:    "bg-amber-50 text-amber-700",
  credit:   "bg-orange-50 text-orange-700",
};

export function MobileDashboard({
  businessName, businessType, slug, currency,
  todayRevenue, todaySalesCount,
  weekRevenue, weekSalesCount,
  monthRevenue, monthSalesCount,
  monthExpenses, netProfit, revenueGrowthPct, sales,
  totalProducts, totalCustomers, newCustomers, locations,
}: Props) {
  const [hidden, setHidden] = useState(false);
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [showPeriod, setShowPeriod] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const selectedLocationName = selectedLocationId
    ? (locations.find((l) => l.id === selectedLocationId)?.name ?? "Headquarters")
    : "Headquarters";
  const { activeBusiness } = useBusinessStore();

  const isService    = businessType === "service";
  const txLabel      = isService ? "services" : "sales";
  const walkIn       = isService ? "Walk-in client" : "Walk-in";
  const primaryLabel = isService ? "Record Service" : "New Sale";

  const revenue     = period === "today" ? todayRevenue : period === "week" ? weekRevenue : monthRevenue;
  const periodLabel = period === "today" ? "Today" : period === "week" ? "This week" : "This month";
  const txCount     = period === "today" ? todaySalesCount : period === "week" ? weekSalesCount : monthSalesCount;

  const fmt = (n: number) => hidden ? "••••••" : formatCurrency(n, currency);

  const isFree = activeBusiness?.subscription_tier === "free";

  const QUICK_ACTIONS = [
    { label: primaryLabel, icon: ShoppingCart, href: "pos",       primary: true  },
    { label: isService ? "Clients" : "Products", icon: isService ? Users : Box, href: isService ? "customers" : "products", primary: false },
    { label: "Invoice",  icon: FileText,      href: "invoices",  primary: false },
    { label: "Expense",  icon: DollarSign,    href: "expenses",  primary: false },
  ] as const;

  const MILESTONES = [
    { label: "Record your first sale",    done: monthSalesCount > 0 },
    { label: "Add your first product",    done: totalProducts > 0   },
    { label: "Add your first customer",   done: totalCustomers > 0  },
  ];
  const milestoneDone  = MILESTONES.filter((m) => m.done).length;
  const milestoneTotal = MILESTONES.length;
  const nextMilestone  = MILESTONES.find((m) => !m.done);

  const STATS: { value: number; label: string; bg: string; green?: boolean }[] = [
    { value: txCount,        label: isService ? "Services" : "Orders",   bg: "bg-slate-50"  },
    { value: totalProducts,  label: "Sold",         bg: "bg-[#E8F5EC]" },
    { value: totalCustomers, label: isService ? "Clients" : "Customers", bg: "bg-[#FEF9EC]" },
    { value: newCustomers,   label: "Store visits", bg: "bg-[#FEF0F0]" },
  ];

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="pb-10">

        {/* ── Hero section (grey background, Bumpa-style) ──── */}
        <div className="bg-[#f6f6f6] px-4 pt-9 pb-7 rounded-b-[32px]">
          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-0.5">
              {/* Avatar – bare person silhouette like Bumpa */}
              <User className="w-10 h-10 text-slate-300 flex-shrink-0 -ml-2" aria-hidden="true" />
              <div>
                <p className="text-[15px] font-bold text-slate-900 leading-tight">
                  Hi, {businessName.split(" ")[0]}
                </p>
                <p className="text-[12px] text-[#1a9c38] mt-0.5 flex items-center gap-0.5">
                  Share your website link
                  <ChevronRight className="w-3 h-3" aria-hidden="true" />
                </p>
              </div>
            </div>

            {/* Subscription badge */}
            {isFree ? (
              <span className="text-[11px] text-green-600 mt-1">Free plan</span>
            ) : (
              <span className="text-[11px] text-violet-600 mt-1 capitalize">
                {activeBusiness?.subscription_tier ?? "Starter"}
              </span>
            )}
          </div>

          {/* Utility buttons row */}
          <div className="flex items-center gap-2">
            <Link
              href={`/${slug}/store`}
              className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-[4px] text-[12px] text-slate-600 border border-slate-200"
            >
              <Store className="w-3.5 h-3.5" aria-hidden="true" />
              Visit store
            </Link>
            <Link
              href={`/${slug}/share`}
              className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-[4px] text-[12px] text-slate-600 border border-slate-200"
            >
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              Share link
            </Link>
            <div className="flex-1" />
            <Link
              href={`/${slug}/reports`}
              className="p-1 text-[#1a9c38]"
              aria-label="Analytics"
            >
              <BarChart2 className="w-5 h-5" aria-hidden="true" />
            </Link>
            <Link
              href={`/${slug}/notifications`}
              className="p-1 text-[#1a9c38]"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* ── Location picker ───────────────────────────────── */}
        <div className="mx-4 mt-4 mb-3">
          <button
            onClick={() => setShowLocationPicker(true)}
            className="w-full flex items-center gap-2.5 text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 px-4 py-3 rounded-[8px]"
          >
            <MapPin className="w-4 h-4 text-[#1a9c38] flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left">{selectedLocationName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
          </button>
        </div>

        {/* Location bottom sheet */}
        {showLocationPicker && (
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-end"
            onClick={() => setShowLocationPicker(false)}
          >
            <div
              className="w-full bg-white rounded-t-2xl px-5 pt-5 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[16px] font-bold text-slate-900">Select Location</h3>
                <button onClick={() => setShowLocationPicker(false)} className="p-1">
                  <X className="w-5 h-5 text-slate-400" aria-hidden="true" />
                </button>
              </div>
              {locations.length === 0 && (
                <p className="text-[13px] text-slate-400 mb-4 leading-relaxed">
                  You can set up or add locations in Settings → Locations.
                </p>
              )}
              <div className="space-y-2 mt-4">
                {/* Headquarters — always first */}
                {[{ id: null, name: "Headquarters" }, ...locations].map((loc) => {
                  const active = loc.id === selectedLocationId;
                  return (
                    <button
                      key={loc.id ?? "hq"}
                      onClick={() => { setSelectedLocationId(loc.id); setShowLocationPicker(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition",
                        active ? "bg-[#ecf7f1] border border-[#1a9c38]" : "bg-slate-50"
                      )}
                    >
                      <span className={cn("text-[14px] font-semibold flex-1", active ? "text-slate-900" : "text-slate-700")}>
                        {loc.name}
                      </span>
                      {active && <Check className="w-4 h-4 text-[#1a9c38] flex-shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Revenue card (Bumpa wallet style) ───────────── */}
        <div className="mx-4 mb-3 rounded-[14px] px-4 pt-4 pb-[34px] relative overflow-hidden border-l-4 border-[#1a9c38]" style={{ backgroundColor: "#f6f6f6" }}>

          {/* Label row — label left, eye right */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-slate-500">Total Revenue:</p>
            <button
              onClick={() => setHidden((v) => !v)}
              aria-label={hidden ? "Show amounts" : "Hide amounts"}
              className="text-[#1a9c38] p-0.5"
            >
              {hidden
                ? <EyeOff className="w-4 h-4" aria-hidden="true" />
                : <Eye    className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>

          {/* Amount — smaller currency symbol */}
          <p className="font-bold text-slate-900 leading-none">
            {hidden ? (
              <span className="text-[40px]">••••••</span>
            ) : (
              <>
                <span className="text-[30px]">{fmt(revenue).charAt(0)}</span>
                <span className="text-[40px] ml-1">{fmt(revenue).slice(1)}</span>
              </>
            )}
          </p>
          <p className="text-[12px] text-slate-400 mt-2">
            {txCount} {txLabel} {period === "today" ? "today" : period === "week" ? "this week" : "this month"}
          </p>

          {/* Growth badge — month only */}
          {period === "month" && revenueGrowthPct !== null && (
            <div className={cn(
              "inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-full text-[11px] font-bold",
              revenueGrowthPct >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
            )}>
              {revenueGrowthPct >= 0
                ? <TrendingUp   className="w-3 h-3" aria-hidden="true" />
                : <TrendingDown className="w-3 h-3" aria-hidden="true" />}
              {revenueGrowthPct >= 0 ? "+" : ""}{revenueGrowthPct.toFixed(1)}% vs last month
            </div>
          )}
        </div>

        {/* ── Period picker (Bumpa Total Sales style) ───────── */}
        <div className="mx-4 mt-5 mb-3 relative">
          <button
            onClick={() => setShowPeriod((v) => !v)}
            className="w-full flex items-center justify-between bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-[14px]"
          >
            <div className="text-left">
              <p className="text-[12px] text-slate-400 font-normal">Total {isService ? "Services" : "Sales"}:</p>
              <p className="font-bold text-slate-900 leading-tight">
                {hidden ? (
                  <span className="text-[20px]">••••••</span>
                ) : (
                  <>
                    <span className="text-[14px]">{fmt(revenue).charAt(0)}</span>
                    <span className="text-[20px] ml-0.5">{fmt(revenue).slice(1)}</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[13px] font-normal text-slate-700">
              {periodLabel}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
            </div>
          </button>
          {showPeriod && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-20 overflow-hidden">
              {(["today", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPeriod(p); setShowPeriod(false); }}
                  className={cn(
                    "w-full text-left px-4 py-3 text-[13px] font-medium",
                    period === p ? "text-[#1a9c38] bg-green-50" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {p === "today" ? "Today" : p === "week" ? "This week" : "This month"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 4-column stats (Bumpa-style colored boxes) ────── */}
        <div className="mx-4 mb-3 grid grid-cols-4 gap-1">
          {STATS.map((s) => (
            <div key={s.label} className={cn("rounded-[8px] h-[70px] flex flex-col items-center justify-center", s.bg)}>
              <p className="text-[20px] font-bold leading-none text-slate-900">
                {s.value}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Milestone card ────────────────────────────────── */}
        <Link href={`/${slug}/targets`} className="mx-4 mb-3 block bg-white rounded-[14px] border border-slate-200 px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[14px] font-bold text-slate-900">Milestone</p>
              <p className="text-[12px] text-slate-400 mt-0.5 leading-snug">
                {nextMilestone ? nextMilestone.label : "You've achieved all milestones!"}
              </p>
              <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1a9c38] rounded-full transition-all"
                  style={{ width: `${(milestoneDone / milestoneTotal) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">{milestoneDone}/{milestoneTotal}</p>
            </div>
            <span className="text-[52px] leading-none select-none flex-shrink-0" aria-hidden="true">🏆</span>
          </div>
        </Link>

        {/* ── Quick Actions ─────────────────────────────────── */}
        <div className="mx-4 mb-3 grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={`/${slug}/${action.href}`} className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-[58px] h-[58px] rounded-[18px] flex items-center justify-center",
                  action.primary
                    ? "bg-[#1a9c38] shadow-md shadow-green-900/20"
                    : "bg-slate-100"
                )}>
                  <Icon
                    aria-hidden="true"
                    className={cn("w-[22px] h-[22px]", action.primary ? "text-white" : "text-slate-500")}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 text-center leading-tight">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── Recent Sales ──────────────────────────────────── */}
        <div className="mx-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4">
            <p className="text-[15px] font-bold text-slate-900">
              Recent {isService ? "Services" : "Sales"}
            </p>
            <Link
              href={`/${slug}/sales`}
              className="flex items-center gap-0.5 text-[13px] text-[#1a9c38] font-semibold"
            >
              View all <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="border-t border-slate-100" />

          {/* Empty state */}
          {sales.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <ShoppingCart className="w-7 h-7 text-slate-400" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-[15px] font-bold text-slate-800">No {txLabel} yet today</p>
                <p className="text-[13px] text-slate-400">
                  Your {txLabel} will appear here once recorded.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {sales.slice(0, 7).map((sale) => (
                <div key={sale.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-4 h-4 text-[#1a9c38]" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-slate-900 truncate">
                      {sale.customers?.name ?? walkIn}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[11px] text-slate-400">{sale.sale_number}</p>
                      <span className={cn(
                        "px-1.5 rounded-full text-[10px] font-semibold capitalize leading-[18px]",
                        METHOD_STYLES[sale.payment_method] ?? "bg-slate-100 text-slate-600"
                      )}>
                        {sale.payment_method}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[14px] font-bold text-slate-900">
                      {formatCurrency(sale.total_amount, currency)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(sale.created_at).toLocaleTimeString("en-US", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
