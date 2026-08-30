"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Eye, EyeOff, ShoppingCart, Box, Users, FileText,
  DollarSign, TrendingUp, TrendingDown, ChevronRight,
  ChevronDown, Bell, User, Store, Share2, BarChart2, X, Check, MapPin, Download, Copy,
} from "lucide-react";

const PROMO_SLIDES = [
  {
    bg: "#1a9c38",
    title: "Record Sales Anywhere",
    body: "Use the Vantage POS to record in-store and online sales with ease.",
    cta: "Get started",
    href: "pos",
    emoji: "🛒",
  },
  {
    bg: "#0f172a",
    title: "Track Your Inventory",
    body: "Stay on top of stock levels and never run out of your best sellers.",
    cta: "Add products",
    href: "products",
    emoji: "📦",
  },
  {
    bg: "#6d28d9",
    title: "Send Professional Invoices",
    body: "Create and share invoices with your customers in seconds.",
    cta: "Create invoice",
    href: "invoices",
    emoji: "📄",
  },
];
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
  avatarUrl?: string | null;
  firstName?: string;
  referralCode?: string;
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
  totalProductsSellValue: number;
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
  businessName, businessType, slug, currency, avatarUrl, firstName, referralCode,
  todayRevenue, todaySalesCount,
  weekRevenue, weekSalesCount,
  monthRevenue, monthSalesCount,
  monthExpenses, netProfit, revenueGrowthPct, sales,
  totalProducts, totalProductsSellValue, totalCustomers, newCustomers, locations,
}: Props) {
  const [hidden, setHidden] = useState(false);
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [promoSlide, setPromoSlide] = useState(0);
  const [codeCopied, setCodeCopied] = useState(false);
  const touchStartX = useRef(0);

  function copyReferralCode() {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }
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

  function fmtCompact(n: number): string {
    if (hidden) return "••••";
    const symbol = formatCurrency(0, currency).charAt(0);
    if (n >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${symbol}${(n / 1_000).toFixed(1)}K`;
    return `${symbol}${n.toFixed(0)}`;
  }

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

  const STATS = [
    { display: String(txCount),                        label: isService ? "Services" : "Orders",   bg: "bg-slate-50"  },
    { display: fmtCompact(totalProductsSellValue),     label: "Sold",                              bg: "bg-[#E8F5EC]" },
    { display: String(totalCustomers),                 label: isService ? "Clients" : "Customers", bg: "bg-[#FEF9EC]" },
    { display: String(newCustomers),                   label: "Store visits",                      bg: "bg-[#FEF0F0]" },
  ];

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="pb-10">

        {/* ── Hero section (grey background, Bumpa-style) ──── */}
        <div className="bg-[#f6f6f6] px-4 pt-9 pb-7 rounded-b-[32px]">
          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Avatar – tappable, navigates to profile */}
              <Link href={`/${slug}/profile`} className="flex-shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="profile" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" aria-hidden="true" />
                  </div>
                )}
              </Link>
              <div>
                <p className="text-[15px] font-semibold text-slate-900 leading-tight">
                  Hi, {firstName ?? businessName.split(" ")[0]}
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
              <p className="text-[18px] font-bold leading-none text-slate-900">
                {s.display}
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

        {/* ── Business Report banner ────────────────────────── */}
        <Link
          href={`/${slug}/reports`}
          className="mx-4 mb-3 flex items-center justify-between bg-[#f6f6f6] rounded-[32px] px-4 h-12"
        >
          <p className="text-[13px] font-medium text-slate-500">Your business report is ready.</p>
          <div className="w-9 h-9 rounded-full bg-[#1a9c38] flex items-center justify-center flex-shrink-0 ml-3">
            <Download className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
        </Link>

        {/* ── Quick Actions ─────────────────────────────────── */}
        <div className="mx-4 mb-3 bg-white rounded-[16px] border border-slate-100 shadow-[0_1px_6px_rgba(15,23,42,0.06)] px-5 pt-4 pb-5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Quick Actions</p>
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={`/${slug}/${action.href}`} className="flex flex-col items-center gap-2.5">
                  <div className={cn(
                    "w-[52px] h-[52px] rounded-[15px] flex items-center justify-center",
                    action.primary
                      ? "bg-[#1a9c38] shadow-[0_4px_14px_rgba(26,156,56,0.38)]"
                      : "bg-[#f4f6f8]"
                  )}>
                    <Icon
                      aria-hidden="true"
                      className={cn("w-[19px] h-[19px]", action.primary ? "text-white" : "text-slate-500")}
                    />
                  </div>
                  <span className={cn(
                    "text-[11px] text-center leading-tight",
                    action.primary ? "font-semibold text-slate-800" : "font-medium text-slate-500"
                  )}>
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Recent Sales ──────────────────────────────────── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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

        {/* ── Promo Carousel ───────────────────────────────── */}
        <div className="mx-4 mb-3">
          <div
            className="overflow-hidden rounded-[16px]"
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              if (diff > 50 && promoSlide < PROMO_SLIDES.length - 1) setPromoSlide((p) => p + 1);
              if (diff < -50 && promoSlide > 0) setPromoSlide((p) => p - 1);
            }}
          >
            <div
              className="flex transition-transform duration-300"
              style={{ transform: `translateX(-${promoSlide * 100}%)` }}
            >
              {PROMO_SLIDES.map((slide, i) => (
                <Link
                  key={i}
                  href={`/${slug}/${slide.href}`}
                  className="w-full flex-shrink-0 px-5 pt-5 pb-6 flex items-center justify-between"
                  style={{ backgroundColor: slide.bg }}
                >
                  <div className="flex-1 pr-3">
                    <p className="text-[16px] font-bold text-white leading-snug mb-1">{slide.title}</p>
                    <p className="text-[12px] leading-snug mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>{slide.body}</p>
                    <span className="text-[12px] font-semibold text-white flex items-center gap-1">
                      {slide.cta} <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </div>
                  <span className="text-[52px] leading-none flex-shrink-0" aria-hidden="true">{slide.emoji}</span>
                </Link>
              ))}
            </div>
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-2.5">
            {PROMO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setPromoSlide(i)}
                className={cn(
                  "rounded-full transition-all",
                  i === promoSlide ? "w-4 h-1.5 bg-[#1a9c38]" : "w-1.5 h-1.5 bg-slate-200"
                )}
              />
            ))}
          </div>
        </div>

        {/* ── Refer & Earn ─────────────────────────────────── */}
        <div className="mx-4 mb-3 bg-white rounded-[16px] border border-slate-100 shadow-[0_1px_6px_rgba(15,23,42,0.06)] overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <p className="text-[15px] font-bold text-slate-900 mb-0.5">Refer &amp; Earn</p>
            <p className="text-[12px] text-slate-400 leading-snug">
              Help other business owners discover Vantage &amp; earn rewards!
            </p>
          </div>
          <div className="px-4 pb-4 space-y-3">
            <Link
              href={`/${slug}/referrals`}
              className="w-full h-10 bg-[#1a9c38] rounded-[8px] flex items-center justify-center"
            >
              <span className="text-[13px] font-bold text-white">Join the Vantage Referral Community</span>
            </Link>
            {referralCode && (
              <div className="flex items-center justify-between bg-slate-50 rounded-[8px] px-3 py-2.5">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Referral Code</p>
                  <p className="text-[15px] font-bold text-slate-900 tracking-widest">{referralCode}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={copyReferralCode}
                    className="p-1.5 rounded-[6px] bg-white border border-slate-200"
                    aria-label="Copy referral code"
                  >
                    {codeCopied
                      ? <Check className="w-3.5 h-3.5 text-[#1a9c38]" aria-hidden="true" />
                      : <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />}
                  </button>
                  <Link href={`/${slug}/referrals`} className="text-[12px] font-semibold text-[#1a9c38] flex items-center gap-0.5">
                    View Earnings <ChevronRight className="w-3 h-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
