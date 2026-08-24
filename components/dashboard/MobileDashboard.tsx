"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye, EyeOff, ShoppingCart, Box, Users, FileText,
  DollarSign, TrendingUp, TrendingDown, ChevronRight,
  ChevronDown, BarChart3, Bell, Zap,
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
  monthRevenue: number;
  monthExpenses: number;
  netProfit: number;
  revenueGrowthPct: number | null;
  sales: Sale[];
  totalProducts: number;
  totalCustomers: number;
  newCustomers: number;
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
  todayRevenue, todaySalesCount, monthRevenue,
  monthExpenses, netProfit, revenueGrowthPct, sales,
  totalProducts, totalCustomers, newCustomers,
}: Props) {
  const [hidden, setHidden] = useState(false);
  const [period, setPeriod] = useState<"today" | "month">("today");
  const [showPeriod, setShowPeriod] = useState(false);
  const { activeBusiness } = useBusinessStore();

  const isService   = businessType === "service";
  const txLabel     = isService ? "services" : "sales";
  const walkIn      = isService ? "Walk-in client" : "Walk-in";
  const primaryLabel = isService ? "Record Service" : "New Sale";

  const revenue     = period === "today" ? todayRevenue : monthRevenue;
  const periodLabel = period === "today" ? "Today" : "This month";
  const txCount     = period === "today" ? todaySalesCount : sales.length;

  const fmt = (n: number) => hidden ? "••••••" : formatCurrency(n, currency);

  const initials = businessName.slice(0, 2).toUpperCase();
  const isFree = activeBusiness?.subscription_tier === "free";

  const QUICK_ACTIONS = [
    { label: primaryLabel, icon: ShoppingCart, href: "pos",       primary: true  },
    { label: isService ? "Clients" : "Products", icon: isService ? Users : Box, href: isService ? "customers" : "products", primary: false },
    { label: "Invoice",  icon: FileText,      href: "invoices",  primary: false },
    { label: "Expense",  icon: DollarSign,    href: "expenses",  primary: false },
  ] as const;

  const STATS: { value: number; label: string; bg: string; green?: boolean }[] = [
    { value: todaySalesCount, label: isService ? "Services" : "Orders",   bg: "bg-slate-50"  },
    { value: totalProducts,   label: isService ? "Services" : "Products", bg: "bg-[#E8F5EC]" },
    { value: totalCustomers,  label: isService ? "Clients" : "Customers", bg: "bg-[#FEF9EC]" },
    { value: newCustomers,    label: "New this mo.",                       bg: "bg-[#FEF0F0]", green: true },
  ];

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="pb-10">

        {/* ── Header (Bumpa-style inside scroll) ───────────── */}
        <div className="flex items-start justify-between px-4 pt-12 pb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-[#1a9c38] font-bold text-[15px] leading-none">{initials}</span>
            </div>
            <div>
              <p className="text-[15px] font-bold text-slate-900 leading-tight">
                Hi, {businessName.split(" ")[0]}
              </p>
              <p className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-1">
                Record a sale today
                <ShoppingCart className="w-3 h-3" aria-hidden="true" />
              </p>
            </div>
          </div>

          {/* Subscription badge */}
          {isFree ? (
            <span className="text-[11px] font-semibold text-green-600 mt-1">Free plan</span>
          ) : (
            <span className="text-[11px] font-semibold text-violet-600 mt-1 capitalize">
              {activeBusiness?.subscription_tier ?? "Starter"}
            </span>
          )}
        </div>

        {/* ── Utility buttons row ───────────────────────────── */}
        <div className="flex items-center gap-2 px-4 pb-4">
          <Link
            href={`/${slug}/pos`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-[12px] font-semibold text-slate-600"
          >
            <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
            {primaryLabel}
          </Link>
          <Link
            href={`/${slug}/sales`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-[12px] font-semibold text-slate-600"
          >
            <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
            Sales
          </Link>
          <div className="flex-1" />
          <Link
            href={`/${slug}/notifications`}
            className="p-2 rounded-full bg-slate-100 text-slate-500"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" aria-hidden="true" />
          </Link>
        </div>

        {/* ── Business name bar ─────────────────────────────── */}
        <div className="mx-4 mb-3">
          <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-2.5 border border-slate-100">
            <div className="w-6 h-6 rounded-md bg-[#1a9c38] flex items-center justify-center flex-shrink-0">
              <Box className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            </div>
            <span className="text-[13px] font-semibold text-slate-800 flex-1 truncate">{businessName}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
          </div>
        </div>

        {/* ── Upgrade CTA (free tier) ───────────────────────── */}
        {isFree && (
          <Link
            href={`/${slug}/settings?tab=billing`}
            className="mx-4 mb-3 flex items-center gap-3 bg-[#1a9c38] rounded-xl px-4 py-3"
          >
            <Zap className="w-4 h-4 text-white flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white">Upgrade to Starter</p>
              <p className="text-[11px] text-green-100 mt-0.5">Unlock the full benefits of VANTAGE</p>
            </div>
            <ChevronRight className="w-4 h-4 text-green-200 flex-shrink-0" aria-hidden="true" />
          </Link>
        )}

        {/* ── Revenue card (white, Bumpa-style) ────────────── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">

          {/* Label row */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-slate-500">Total Revenue:</p>
            <div className="flex items-center gap-2">
              {/* Period selector */}
              <div className="relative">
                <button
                  onClick={() => setShowPeriod((v) => !v)}
                  className="flex items-center gap-1 text-[12px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full"
                >
                  {periodLabel}
                  <ChevronDown className="w-3 h-3" aria-hidden="true" />
                </button>
                {showPeriod && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-10 overflow-hidden min-w-[120px]">
                    {(["today", "month"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => { setPeriod(p); setShowPeriod(false); }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-[13px] font-medium",
                          period === p ? "text-[#1a9c38] bg-green-50" : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {p === "today" ? "Today" : "This month"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Eye toggle */}
              <button
                onClick={() => setHidden((v) => !v)}
                aria-label={hidden ? "Show amounts" : "Hide amounts"}
                className="text-slate-400 p-0.5"
              >
                {hidden
                  ? <EyeOff className="w-4 h-4" aria-hidden="true" />
                  : <Eye    className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Amount */}
          <p className="font-numeric text-[40px] font-bold text-slate-900 leading-none tracking-tight">
            {fmt(revenue)}
          </p>
          <p className="text-[12px] text-slate-400 mt-2">
            {txCount} {txLabel} {period === "today" ? "today" : "this month"}
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

        {/* ── 4-column stats (Bumpa-style colored boxes) ────── */}
        <div className="mx-4 mb-3 grid grid-cols-4 gap-2">
          {STATS.map((s) => (
            <div key={s.label} className={cn("rounded-xl p-2.5 text-center", s.bg)}>
              <p className={cn(
                "font-numeric text-[20px] font-bold leading-none",
                s.green ? "text-[#1a9c38]" : "text-slate-900"
              )}>
                {s.green && s.value > 0 ? `+${s.value}` : s.value}
              </p>
              <p className="text-[9px] text-slate-500 mt-1 leading-tight font-medium">{s.label}</p>
            </div>
          ))}
        </div>

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
                    <p className="font-numeric text-[14px] font-bold text-slate-900">
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
