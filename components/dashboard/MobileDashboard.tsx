"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye, EyeOff, ShoppingCart, Package, Users, FileText,
  Receipt, TrendingUp, TrendingDown, ChevronRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

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
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

const METHOD_STYLES: Record<string, string> = {
  cash:     "bg-green-50 text-green-700",
  card:     "bg-blue-50 text-blue-700",
  transfer: "bg-purple-50 text-purple-700",
  split:    "bg-amber-50 text-amber-700",
};

export function MobileDashboard({
  businessName, businessType, slug, currency,
  todayRevenue, todaySalesCount, monthRevenue,
  monthExpenses, netProfit, revenueGrowthPct, sales,
}: Props) {
  const [hidden, setHidden] = useState(false);

  const fmt = (n: number) =>
    hidden ? "••••••" : formatCurrency(n, currency);

  const isService = businessType === "service";
  const txLabel   = isService ? "services" : "sales";
  const walkIn    = isService ? "Walk-in client" : "Walk-in";
  const primaryLabel = isService ? "Record Service" : "New Sale";

  const QUICK_ACTIONS = [
    { label: primaryLabel,                        icon: ShoppingCart, href: "pos",       primary: true  },
    { label: isService ? "Clients" : "Products",  icon: isService ? Users : Package, href: isService ? "customers" : "products", primary: false },
    { label: "Invoice",                           icon: FileText,     href: "invoices",  primary: false },
    { label: "Expense",                           icon: Receipt,      href: "expenses",  primary: false },
  ];

  return (
    <div className="flex-1 overflow-auto bg-[#F5F6F8]">
      <div className="px-4 pt-5 pb-6 space-y-4">

        {/* ── Greeting ── */}
        <div>
          <p className="text-[11px] text-slate-400 font-medium">{getFormattedDate()}</p>
          <h1 className="text-[22px] font-extrabold text-slate-900 mt-0.5 leading-tight">
            {getGreeting()},
          </h1>
          <p className="text-base font-semibold text-slate-600 leading-tight">{businessName}</p>
        </div>

        {/* ── Revenue card ── */}
        <div className="bg-[#0C1526] rounded-2xl p-5 shadow-lg shadow-slate-900/20">
          {/* top accent */}
          <div className="h-0.5 -mx-5 -mt-5 mb-4 bg-gradient-to-r from-green-600 via-green-400 to-emerald-500 rounded-t-2xl" />

          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Today's Revenue
            </p>
            <button
              onClick={() => setHidden((v) => !v)}
              aria-label={hidden ? "Show amounts" : "Hide amounts"}
              className="p-1.5 text-slate-500 hover:text-slate-300 transition rounded-lg"
            >
              {hidden
                ? <EyeOff className="w-4 h-4" aria-hidden="true" />
                : <Eye    className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>

          <p className="font-numeric text-[34px] font-extrabold text-white tracking-tight mt-1 leading-none">
            {fmt(todayRevenue)}
          </p>
          <p className="text-xs text-slate-500 mt-1.5">
            {todaySalesCount} {txLabel} today
          </p>

          {/* divider */}
          <div className="mt-4 pt-4 border-t border-white/8 flex items-end justify-between">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">This month</p>
              <p className="font-numeric text-lg font-bold text-white mt-0.5">
                {fmt(monthRevenue)}
              </p>
            </div>

            {revenueGrowthPct !== null && (
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                revenueGrowthPct >= 0
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              )}>
                {revenueGrowthPct >= 0
                  ? <TrendingUp   className="w-3.5 h-3.5" aria-hidden="true" />
                  : <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
                {revenueGrowthPct >= 0 ? "+" : ""}{revenueGrowthPct.toFixed(1)}% vs last month
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={`/${slug}/${action.href}`}
                className="flex flex-col items-center gap-1.5"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm",
                  action.primary
                    ? "bg-green-600 shadow-green-900/25"
                    : "bg-white border border-slate-100"
                )}>
                  <Icon
                    aria-hidden="true"
                    className={cn("w-6 h-6", action.primary ? "text-white" : "text-slate-600")}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── Mini stats ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Month Expenses
            </p>
            <p className={cn(
              "font-numeric text-xl font-extrabold mt-1.5 leading-none",
              monthExpenses > monthRevenue * 0.7 ? "text-red-600" : "text-slate-900"
            )}>
              {fmt(monthExpenses)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">this month</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Net Profit
            </p>
            <p className={cn(
              "font-numeric text-xl font-extrabold mt-1.5 leading-none",
              netProfit >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {fmt(netProfit)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">this month</p>
          </div>
        </div>

        {/* ── Recent Transactions ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-900">
              Recent {isService ? "Services" : "Sales"}
            </p>
            <Link
              href={`/${slug}/sales`}
              className="flex items-center gap-0.5 text-xs text-green-600 font-semibold"
            >
              View all <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {sales.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-3 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-slate-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">No {txLabel} yet today</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your {txLabel} will appear here once recorded.
                </p>
              </div>
              <Link
                href={`/${slug}/pos`}
                className="mt-1 px-5 py-2 bg-green-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-green-900/20"
              >
                {primaryLabel}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sales.slice(0, 7).map((sale) => (
                <div key={sale.id} className="flex items-center gap-3 px-4 py-3.5">
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-4 h-4 text-green-600" aria-hidden="true" />
                  </div>

                  {/* Customer + ref */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {sale.customers?.name ?? walkIn}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[11px] text-slate-400">{sale.sale_number}</p>
                      <span className={cn(
                        "px-1.5 py-0 rounded-full text-[10px] font-semibold capitalize",
                        METHOD_STYLES[sale.payment_method] ?? "bg-slate-100 text-slate-600"
                      )}>
                        {sale.payment_method}
                      </span>
                    </div>
                  </div>

                  {/* Amount + time */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-numeric text-sm font-bold text-slate-900">
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
