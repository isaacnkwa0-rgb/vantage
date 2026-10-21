"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Eye, EyeOff, ShoppingCart, Box, Users, FileText,
  DollarSign, TrendingUp, TrendingDown, ChevronRight,
  ChevronDown, Bell, User, Store, Share2, BarChart2, X, Check, MapPin, Download, Copy, PackagePlus, Receipt, Wallet,
} from "lucide-react";

const PROMO_SLIDES = [
  {
    bg: "#F2542D",
    title: "Record Sales Anywhere",
    body: "Use the Stokka POS to record in-store and online sales with ease.",
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
import { createClient } from "@/lib/supabase/client";
import {
  REVENUE_MILESTONES, SALES_MILESTONES, TOTAL_MILESTONES, computeMilestones,
} from "@/lib/milestones";

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
  todayItemsSold: number;
  weekItemsSold: number;
  monthItemsSold: number;
  todayNewCustomers: number;
  weekNewCustomers: number;
  todayStoreVisits: number;
  weekStoreVisits: number;
  monthStoreVisits: number;
  locations: { id: string; name: string }[];
  allTimeRevenue: number;
  allTimeSalesCount: number;
}

const METHOD_STYLES: Record<string, string> = {
  cash:     "bg-primary-soft text-primary",
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
  totalProducts, totalProductsSellValue, totalCustomers, newCustomers,
  todayItemsSold, weekItemsSold, monthItemsSold,
  todayNewCustomers, weekNewCustomers,
  todayStoreVisits, weekStoreVisits, monthStoreVisits,
  locations,
  allTimeRevenue,
  allTimeSalesCount,
}: Props) {
  const [hidden, setHidden] = useState(false);
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [promoSlide, setPromoSlide] = useState(0);
  const [codeCopied, setCodeCopied] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    async function fetchCount() {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const { data: biz } = await supabase
        .from("businesses").select("id, business_type").eq("slug", slug).single();
      if (!biz) return;
      const bizId = biz.id;
      const isService = biz.business_type === "service";

      const [productsRes, overdueRes, creditRes, persistedRes] = await Promise.all([
        isService
          ? Promise.resolve({ data: [] })
          : supabase.from("products")
              .select("stock_quantity, low_stock_threshold")
              .eq("business_id", bizId).eq("track_inventory", true).eq("is_active", true),
        supabase.from("invoices").select("id", { count: "exact", head: true })
          .eq("business_id", bizId).not("status", "in", '("paid","cancelled")')
          .lt("due_date", today),
        supabase.from("customers").select("id", { count: "exact", head: true })
          .eq("business_id", bizId).gt("credit_balance", 0),
        supabase.from("notifications").select("id", { count: "exact", head: true })
          .eq("business_id", bizId).is("read_at", null),
      ]);

      const lowStockCount = (productsRes.data ?? []).filter(
        (p) => p.stock_quantity <= p.low_stock_threshold
      ).length;

      setNotifCount(
        Math.min(lowStockCount, 5) +
        (overdueRes.count ?? 0) +
        (creditRes.count ?? 0) +
        (persistedRes.count ?? 0)
      );
    }
    fetchCount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoSlide((p) => (p + 1) % PROMO_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
    { label: isService ? "Clients" : "Add Product", icon: isService ? Users : PackagePlus, href: isService ? "customers" : "products", primary: false },
    { label: "Invoice",  icon: Receipt,        href: "invoices",  primary: false },
    { label: "Expense",  icon: Wallet,         href: "expenses",  primary: false },
  ] as const;

  const revenueMilestones = computeMilestones(REVENUE_MILESTONES, allTimeRevenue);
  const salesMilestones   = computeMilestones(SALES_MILESTONES, allTimeSalesCount);
  const totalAchieved     = [...revenueMilestones, ...salesMilestones].filter((m) => m.status === "achieved").length;
  const nextRevMilestone  = revenueMilestones.find((m) => m.status === "next");
  const nextSalesMilestone = salesMilestones.find((m) => m.status === "next");
  const nextMilestone     = nextRevMilestone ?? nextSalesMilestone;

  const itemsSold    = period === "today" ? todayItemsSold  : period === "week" ? weekItemsSold  : monthItemsSold;
  const periodNewCx  = period === "today" ? todayNewCustomers : period === "week" ? weekNewCustomers : newCustomers;
  const storeVisits  = period === "today" ? todayStoreVisits : period === "week" ? weekStoreVisits  : monthStoreVisits;

  const STATS = [
    { display: String(txCount),       label: isService ? "Services" : "Orders",           bg: "bg-primary-soft" },
    { display: String(itemsSold),     label: "Items sold",                                 bg: "bg-[#E8F5EC]"    },
    { display: String(periodNewCx),   label: isService ? "New clients" : "New customers",  bg: "bg-amber-50"     },
    { display: String(storeVisits),   label: "Store visits",                               bg: "bg-blue-50"      },
  ];

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="pb-10">

        {/* ── Hero section (cream background, Catlog-style warmth) ──── */}
        <div className="bg-[#FFF6EC] px-4 pt-9 pb-7 rounded-b-[32px]">
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
                <p className="text-[12px] text-primary mt-0.5 flex items-center gap-0.5">
                  Share your website link
                  <ChevronRight className="w-3 h-3" aria-hidden="true" />
                </p>
              </div>
            </div>

            {/* Subscription badge */}
            {isFree ? (
              <span className="text-[11px] text-primary mt-1">Free plan</span>
            ) : (
              <span className="text-[11px] text-violet-600 mt-1 capitalize">
                {activeBusiness?.subscription_tier ?? "Starter"}
              </span>
            )}
          </div>

          {/* Utility buttons row */}
          <div className="flex items-center gap-2">
            <a
              href={`/store/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-[4px] text-[12px] text-slate-600 border border-slate-200"
            >
              <Store className="w-3.5 h-3.5" aria-hidden="true" />
              Visit store
            </a>
            <button
              onClick={() => {
                const url = `${window.location.origin}/store/${slug}`;
                if (navigator.share) {
                  navigator.share({ title: businessName, url });
                } else {
                  navigator.clipboard.writeText(url);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-[4px] text-[12px] text-slate-600 border border-slate-200"
            >
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              Share link
            </button>
            <div className="flex-1" />
            <Link
              href={`/${slug}/reports`}
              className="p-1 text-primary"
              aria-label="Analytics"
            >
              <BarChart2 className="w-5 h-5" aria-hidden="true" />
            </Link>
            <Link
              href={`/${slug}/notifications`}
              className="relative p-1 text-primary"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </Link>
          </div>

          {/* ── Feature pills (Bumpa/Catlog-style horizontal chips) ── */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 -mb-1 pb-1">
            {(isService
              ? ["Record Service", "Invoices", "Clients", "Expenses", "Analytics"]
              : ["POS Sales", "Invoices", "Inventory", "Expenses", "Customers", "Analytics"]
            ).map((tag) => (
              <span key={tag} className="flex-shrink-0 bg-white border border-[#EADFD2] text-[11px] font-medium text-slate-600 px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Location picker ───────────────────────────────── */}
        <div className="mx-4 mt-4 mb-3">
          <button
            onClick={() => setShowLocationPicker(true)}
            className="w-full flex items-center gap-2.5 text-[13px] font-semibold text-slate-700 bg-white border border-[#EADFD2] px-4 py-3 rounded-[8px]"
          >
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
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
                        active ? "bg-primary-soft border border-primary" : "bg-slate-50"
                      )}
                    >
                      <span className={cn("text-[14px] font-semibold flex-1", active ? "text-slate-900" : "text-slate-700")}>
                        {loc.name}
                      </span>
                      {active && <Check className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Revenue card — Catlog-accent-bar style ───────────── */}
        <div className="mx-4 mb-3 rounded-[14px] bg-white border border-[#EADFD2] overflow-hidden shadow-sm">
          {/* Ember gradient top accent — Catlog-inspired */}
          <div className="h-[3px] bg-gradient-to-r from-[#F2542D] via-[#FBBCAA] to-[#FDE3D9]" />
        <div className="px-4 pt-4 pb-5 relative">

          {/* Label row — label left, eye right */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-slate-500">Total Revenue:</p>
            <button
              onClick={() => setHidden((v) => !v)}
              aria-label={hidden ? "Show amounts" : "Hide amounts"}
              className="text-primary p-0.5"
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
              revenueGrowthPct >= 0 ? "bg-primary-soft text-primary" : "bg-red-50 text-red-500"
            )}>
              {revenueGrowthPct >= 0
                ? <TrendingUp   className="w-3 h-3" aria-hidden="true" />
                : <TrendingDown className="w-3 h-3" aria-hidden="true" />}
              {revenueGrowthPct >= 0 ? "+" : ""}{revenueGrowthPct.toFixed(1)}% vs last month
            </div>
          )}
        </div>
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
                    period === p ? "text-primary bg-primary-soft" : "text-slate-700 hover:bg-slate-50"
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
            <div key={s.label} className={cn("rounded-[8px] min-h-[70px] flex flex-col items-center justify-center py-3", s.bg)}>
              <p className="text-[18px] font-bold leading-none text-slate-900">
                {s.display}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Milestone card ────────────────────────────────── */}
        <Link href={`/${slug}/targets`} className="mx-4 mb-3 block bg-white rounded-[14px] border border-slate-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] font-bold text-slate-900">Growth Milestones</p>
                <span className="text-[11px] font-semibold text-slate-400 flex-shrink-0">{totalAchieved}/{TOTAL_MILESTONES}</span>
              </div>
              {nextMilestone ? (
                <>
                  <p className="text-[12px] text-slate-400 mt-0.5 leading-snug">
                    Next: <span className="font-semibold text-amber-500">{nextMilestone.emoji} {nextMilestone.label}</span>
                  </p>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${nextMilestone.progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{Math.round(nextMilestone.progress)}% there · tap to see all</p>
                </>
              ) : (
                <>
                  <p className="text-[12px] text-primary font-semibold mt-0.5">🎉 All milestones achieved!</p>
                  <div className="mt-2 h-1.5 bg-primary-soft rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-full" />
                  </div>
                </>
              )}
            </div>
            <span className="text-[44px] leading-none select-none flex-shrink-0" aria-hidden="true">
              {nextMilestone ? nextMilestone.emoji : "🏆"}
            </span>
          </div>
        </Link>

        {/* ── Business Report banner ────────────────────────── */}
        <Link
          href={`/${slug}/reports`}
          className="mx-4 mb-3 flex items-center justify-between bg-gradient-to-r from-primary-soft to-[#FFF6EC] rounded-[32px] px-4 h-12 border border-[#FBBCAA]"
        >
          <p className="text-[13px] font-semibold text-slate-700">Your business report is ready.</p>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-3">
            <Download className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
        </Link>

        {/* ── Quick Actions ─────────────────────────────────── */}
        <div className="mx-4 mb-3 bg-white rounded-[16px] border border-[#EADFD2] px-3 pt-5 pb-6">
          <p className="text-[13px] font-bold text-slate-800 mb-4">Quick Actions</p>
          <div className="grid grid-cols-4 gap-1.5">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={`/${slug}/${action.href}`} className="flex flex-col items-center">
                  <div className={cn(
                    "w-full h-[96px] rounded-[10px] flex flex-col items-center justify-center gap-2.5",
                    action.href === "pos"                               ? "bg-primary-soft" :
                    action.href === "products" || action.href === "customers" ? "bg-blue-50"   :
                    action.href === "invoices"                          ? "bg-purple-50"    :
                    "bg-amber-50"
                  )}>
                    <Icon aria-hidden="true" className={cn("w-[26px] h-[26px]",
                      action.href === "pos"                               ? "text-primary"    :
                      action.href === "products" || action.href === "customers" ? "text-blue-500" :
                      action.href === "invoices"                          ? "text-violet-500" :
                      "text-amber-500"
                    )} />
                    <span className="text-[11px] font-semibold text-slate-600 text-center leading-tight">
                      {action.label}
                    </span>
                  </div>
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
              className="flex items-center gap-0.5 text-[13px] text-primary font-semibold"
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
                  <div className="w-9 h-9 rounded-full bg-primary-soft flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-4 h-4 text-primary" aria-hidden="true" />
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
                    <p className="text-[10px] text-slate-400 mt-0.5" suppressHydrationWarning>
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
                  i === promoSlide ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-slate-200"
                )}
              />
            ))}
          </div>
        </div>

        {/* ── Refer & Earn — Bumpa-style full-width CTA card ── */}
        <div className="mx-4 mb-3 rounded-[16px] overflow-hidden border border-[#EADFD2]">
          {/* Ember CTA banner */}
          <div className="bg-primary px-4 pt-5 pb-5">
            <p className="text-[16px] font-bold text-white mb-1">Refer &amp; Earn</p>
            <p className="text-[12px] leading-snug mb-4" style={{ color: "rgba(255,255,255,0.75)" }}>
              Help other business owners discover Stokka &amp; earn rewards!
            </p>
            <Link
              href={`/${slug}/referrals`}
              className="inline-flex items-center gap-2 bg-white rounded-[8px] px-4 h-9"
            >
              <span className="text-[13px] font-bold text-primary">Join the Community</span>
              <ChevronRight className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            </Link>
          </div>
          {referralCode && (
            <div className="px-4 pb-4 pt-3 bg-white">
              <div className="flex items-center justify-between bg-[#FFF6EC] rounded-[8px] px-3 py-2.5 border border-[#EADFD2]">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Your Referral Code</p>
                  <p className="text-[15px] font-bold text-slate-900 tracking-widest">{referralCode}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={copyReferralCode}
                    className="p-1.5 rounded-[6px] bg-white border border-[#EADFD2]"
                    aria-label="Copy referral code"
                  >
                    {codeCopied
                      ? <Check className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                      : <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />}
                  </button>
                  <Link href={`/${slug}/referrals`} className="text-[12px] font-semibold text-primary flex items-center gap-0.5">
                    View Earnings <ChevronRight className="w-3 h-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
