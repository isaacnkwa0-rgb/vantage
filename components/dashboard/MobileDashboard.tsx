"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye, EyeOff, ShoppingCart, Box, Users, FileText,
  DollarSign, TrendingUp, TrendingDown, ChevronRight,
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
  totalProducts: number;
  totalCustomers: number;
  newCustomers: number;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  return "Good evening,";
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
  totalProducts, totalCustomers, newCustomers,
}: Props) {
  const [hidden, setHidden] = useState(false);

  const fmt = (n: number) =>
    hidden ? "••••••" : formatCurrency(n, currency);

  const isService = businessType === "service";
  const txLabel      = isService ? "services" : "sales";
  const walkIn       = isService ? "Walk-in client" : "Walk-in";
  const primaryLabel = isService ? "Record Service" : "New Sale";

  const QUICK_ACTIONS = [
    {
      label: primaryLabel,
      icon:  ShoppingCart,
      href:  "pos",
      primary: true,
    },
    {
      label: isService ? "Clients" : "Products",
      icon:  isService ? Users : Box,
      href:  isService ? "customers" : "products",
      primary: false,
    },
    {
      label: "Invoice",
      icon:  FileText,
      href:  "invoices",
      primary: false,
    },
    {
      label: "Expense",
      icon:  DollarSign,
      href:  "expenses",
      primary: false,
    },
  ] as const;

  return (
    <div className="flex-1 overflow-auto bg-[#F2F4F7]">
      <div className="px-4 pt-4 pb-8 space-y-4">

        {/* ── Greeting ─────────────────────────────────────── */}
        <div className="pt-1">
          <p className="text-[12px] text-slate-400 font-medium tracking-wide">
            {getFormattedDate()}
          </p>
          <h1 className="text-[26px] font-bold text-slate-900 mt-1 leading-tight tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-[26px] font-bold text-slate-900 leading-tight tracking-tight uppercase">
            {businessName}
          </p>
        </div>

        {/* ── Revenue card ─────────────────────────────────── */}
        <div className="bg-[#0D1B2A] rounded-3xl overflow-hidden shadow-xl shadow-slate-900/25">
          <div className="px-5 pt-5 pb-5">

            {/* Label + eye toggle */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">
                Today&apos;s Revenue
              </p>
              <button
                onClick={() => setHidden((v) => !v)}
                aria-label={hidden ? "Show amounts" : "Hide amounts"}
                className="text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded"
              >
                {hidden
                  ? <EyeOff className="w-[18px] h-[18px]" aria-hidden="true" />
                  : <Eye    className="w-[18px] h-[18px]" aria-hidden="true" />}
              </button>
            </div>

            {/* Today's amount */}
            <p className="font-numeric text-[42px] font-bold text-white leading-none tracking-tight">
              {fmt(todayRevenue)}
            </p>
            <p className="text-[12px] text-slate-500 mt-2">
              {todaySalesCount} {txLabel} today
            </p>

            {/* Divider */}
            <div className="my-4 border-t border-white/10" />

            {/* This month */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em] mb-1.5">
                  This Month
                </p>
                <p className="font-numeric text-[28px] font-bold text-white leading-none tracking-tight">
                  {fmt(monthRevenue)}
                </p>
              </div>

              {revenueGrowthPct !== null && (
                <div className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold mb-0.5",
                  revenueGrowthPct >= 0
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                )}>
                  {revenueGrowthPct >= 0
                    ? <TrendingUp   className="w-3 h-3" aria-hidden="true" />
                    : <TrendingDown className="w-3 h-3" aria-hidden="true" />}
                  {revenueGrowthPct >= 0 ? "+" : ""}
                  {revenueGrowthPct.toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick stats row ───────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl px-3 py-3.5 border border-slate-100 shadow-sm text-center">
            <p className="font-numeric text-[22px] font-bold text-slate-900 leading-none">
              {todaySalesCount}
            </p>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{txLabel} today</p>
          </div>
          <div className="bg-white rounded-2xl px-3 py-3.5 border border-slate-100 shadow-sm text-center">
            <p className="font-numeric text-[22px] font-bold text-slate-900 leading-none">
              {totalCustomers}
            </p>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
              {isService ? "clients" : "customers"}
            </p>
          </div>
          <div className="bg-white rounded-2xl px-3 py-3.5 border border-slate-100 shadow-sm text-center">
            <p className="font-numeric text-[22px] font-bold text-[#1a9c38] leading-none">
              +{newCustomers}
            </p>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">new this month</p>
          </div>
        </div>

        {/* ── Quick Actions ─────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={`/${slug}/${action.href}`}
                className="flex flex-col items-center gap-2"
              >
                <div className={cn(
                  "w-[60px] h-[60px] rounded-[18px] flex items-center justify-center",
                  action.primary
                    ? "bg-[#1a9c38] shadow-md shadow-green-900/30"
                    : "bg-white border border-slate-100 shadow-sm shadow-slate-200/60"
                )}>
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "w-[22px] h-[22px]",
                      action.primary ? "text-white" : "text-slate-500"
                    )}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 text-center leading-tight">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── Financial summary ─────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">

          {/* Month Expenses */}
          <div className="bg-white rounded-2xl px-4 py-4 border border-slate-100 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Month Expenses
            </p>
            <p className={cn(
              "font-numeric text-[22px] font-bold mt-2 leading-none",
              monthExpenses > 0 && monthRevenue > 0 && monthExpenses > monthRevenue * 0.7
                ? "text-red-600"
                : "text-slate-900"
            )}>
              {fmt(monthExpenses)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5">this month</p>
          </div>

          {/* Net Profit */}
          <div className="bg-white rounded-2xl px-4 py-4 border border-slate-100 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Net Profit
            </p>
            <p className={cn(
              "font-numeric text-[22px] font-bold mt-2 leading-none",
              netProfit >= 0 ? "text-[#1a9c38]" : "text-red-600"
            )}>
              {fmt(netProfit)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5">this month</p>
          </div>
        </div>

        {/* ── Recent Sales ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

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
                <p className="text-[15px] font-bold text-slate-800">
                  No {txLabel} yet today
                </p>
                <p className="text-[13px] text-slate-400">
                  Your {txLabel} will appear here once recorded.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {sales.slice(0, 7).map((sale) => (
                <div key={sale.id} className="flex items-center gap-3 px-4 py-3.5">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-4 h-4 text-[#1a9c38]" aria-hidden="true" />
                  </div>

                  {/* Customer + ref */}
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

                  {/* Amount + time */}
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
