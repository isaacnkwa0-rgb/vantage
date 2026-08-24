"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Users, MoreHorizontal, Zap,
  Package, Package2, Vault, ActivitySquare, Megaphone, BadgePercent, Receipt,
  BarChart3, TrendingUp, Settings, FileText, FilePen, Ticket, Target, Truck,
  ShoppingBag, Tag, CalendarDays, BookOpen, FileX, Globe, Gift, Share2,
  RefreshCw, Barcode, Thermometer, BellRing, Landmark, Wallet,
  ChevronRight, ChevronDown, UserCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBusinessStore } from "@/store/businessStore";

interface NavItem {
  label: string;
  serviceLabel?: string;
  icon: LucideIcon;
  href: string;
  retailOnly?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  retailOnly?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: "overview",
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "dashboard" },
    ],
  },
  {
    id: "sales",
    label: "SALES",
    items: [
      { label: "Point of Sale", serviceLabel: "Record Service", icon: ShoppingCart, href: "pos" },
      { label: "Transactions", icon: ClipboardList, href: "sales" },
      { label: "Invoices", icon: FileText, href: "invoices" },
      { label: "Quotes", icon: FilePen, href: "quotes" },
      { label: "Discounts", icon: Ticket, href: "discounts" },
      { label: "Recurring Billing", icon: RefreshCw, href: "recurring" },
    ],
  },
  {
    id: "catalog",
    label: "CATALOG",
    items: [
      { label: "Products", serviceLabel: "Services", icon: Package, href: "products" },
      { label: "Bundles", icon: Package2, href: "bundles", retailOnly: true },
      { label: "Pricing Tiers", icon: Tag, href: "pricing" },
      { label: "Barcode Labels", icon: Barcode, href: "barcode-labels", retailOnly: true },
    ],
  },
  {
    id: "customers",
    label: "CUSTOMERS",
    items: [
      { label: "Customers", serviceLabel: "Clients", icon: Users, href: "customers" },
      { label: "Campaigns", icon: Megaphone, href: "campaigns" },
      { label: "Referrals", icon: Share2, href: "referrals" },
      { label: "Gift Cards", icon: Gift, href: "gift-cards" },
    ],
  },
  {
    id: "inventory",
    label: "INVENTORY",
    retailOnly: true,
    items: [
      { label: "Suppliers", icon: Truck, href: "suppliers" },
      { label: "Purchase Orders", icon: ShoppingBag, href: "purchase-orders" },
      { label: "Store Orders", icon: Globe, href: "store-orders" },
    ],
  },
  {
    id: "finance",
    label: "FINANCE",
    items: [
      { label: "Expenses", icon: Receipt, href: "expenses" },
      { label: "Cashbook", icon: BookOpen, href: "cashbook" },
      { label: "Credit Notes", icon: FileX, href: "credit-notes" },
      { label: "Bank Accounts", icon: Landmark, href: "bank-accounts" },
    ],
  },
  {
    id: "insights",
    label: "INSIGHTS",
    items: [
      { label: "Reports", icon: BarChart3, href: "reports" },
      { label: "Analytics", icon: TrendingUp, href: "analytics" },
      { label: "Targets", icon: Target, href: "targets" },
      { label: "Commissions", icon: BadgePercent, href: "commissions" },
    ],
  },
  {
    id: "operations",
    label: "OPERATIONS",
    items: [
      { label: "Cash Shifts", icon: Vault, href: "shifts" },
      { label: "Appointments", icon: CalendarDays, href: "appointments" },
      { label: "Payroll", icon: Wallet, href: "payroll" },
      { label: "Thermal Printer", icon: Thermometer, href: "thermal-printer" },
    ],
  },
  {
    id: "system",
    label: "SYSTEM",
    items: [
      { label: "Notifications", icon: BellRing, href: "notifications" },
      { label: "Activity", icon: ActivitySquare, href: "activity" },
      { label: "Settings", icon: Settings, href: "settings" },
    ],
  },
];

const BOTTOM_TABS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "dashboard" },
  { label: "POS", icon: ShoppingCart, href: "pos" },
  { label: "Sales", icon: ClipboardList, href: "sales" },
  { label: "Customers", icon: Users, href: "customers" },
] as const;

function MorePage({ slug, onClose }: { slug: string; onClose: () => void }) {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const isService = activeBusiness?.business_type === "service";

  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(NAV_SECTIONS.map((s) => s.id))
  );

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleSections = NAV_SECTIONS.filter((s) => !(s.retailOnly && isService));

  return (
    /* Covers full viewport except the bottom nav (h-16 = 64px) */
    <div className="fixed inset-x-0 top-0 bottom-16 z-50 bg-[#F5F6F8] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-[#F5F6F8] flex-shrink-0">
        <div className="w-9" /> {/* balance the avatar */}
        <h1 className="text-base font-bold text-slate-900 truncate max-w-[60%] text-center">
          {activeBusiness?.name ?? ""}
        </h1>
        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
          <UserCircle className="w-5 h-5 text-slate-400" aria-hidden="true" />
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">

        {/* Upgrade CTA — free tier only */}
        {activeBusiness?.subscription_tier === "free" && (
          <Link
            href={`/${slug}/settings?tab=billing`}
            onClick={onClose}
            className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 shadow-sm border border-slate-100 active:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full border-2 border-green-500 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-green-500" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Upgrade to Starter</p>
              <p className="text-xs text-slate-500 mt-0.5">Unlock the full benefits of VANTAGE</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" aria-hidden="true" />
          </Link>
        )}

        {/* Nav sections */}
        {visibleSections.map((section) => {
          const items = section.items.filter((item) => !(item.retailOnly && isService));
          if (!items.length) return null;
          const isOpen = openSections.has(section.id);

          return (
            <div key={section.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500"
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                  {section.label}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0",
                    !isOpen && "-rotate-90"
                  )}
                />
              </button>

              {/* Items */}
              {isOpen && items.map((item, i) => {
                const label = isService && item.serviceLabel ? item.serviceLabel : item.label;
                const href = `/${slug}/${item.href}`;
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500",
                      i >= 0 && "border-t border-slate-100",
                      isActive ? "bg-green-50" : "active:bg-slate-50"
                    )}
                  >
                    {/* Icon badge */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        isActive ? "bg-green-100" : "bg-green-50"
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          "w-5 h-5",
                          isActive ? "text-green-700" : "text-green-600"
                        )}
                      />
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        "flex-1 text-[14px] font-medium",
                        isActive ? "text-green-700" : "text-slate-700"
                      )}
                    >
                      {label}
                    </span>

                    {/* Chevron */}
                    <ChevronRight
                      aria-hidden="true"
                      className="w-4 h-4 text-slate-300 flex-shrink-0"
                    />
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BottomNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const [showMore, setShowMore] = useState(false);

  const isService = activeBusiness?.business_type === "service";
  const posLabel = isService ? "Services" : "POS";
  const customersLabel = isService ? "Clients" : "Customers";

  // Close when the user navigates to any route
  useEffect(() => {
    setShowMore(false);
  }, [pathname]);

  return (
    <>
      {showMore && <MorePage slug={slug} onClose={() => setShowMore(false)} />}

      <nav
        aria-label="Main navigation"
        className="bottom-nav flex-shrink-0 bg-white border-t border-slate-200 flex items-stretch h-16"
      >
        {BOTTOM_TABS.map((tab) => {
          const href = `/${slug}/${tab.href}`;
          const isActive = !showMore && (pathname === href || pathname.startsWith(`${href}/`));
          const Icon = tab.icon;
          const label =
            tab.href === "pos" ? posLabel
            : tab.href === "customers" ? customersLabel
            : tab.label;

          return (
            <Link
              key={tab.href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500",
                isActive ? "text-green-600" : "text-slate-400 active:text-slate-600"
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn("w-5 h-5 transition-transform", isActive && "scale-110")}
              />
              <span className={cn("text-[10px] font-semibold leading-none", isActive ? "text-green-600" : "text-slate-400")}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* More */}
        <button
          onClick={() => setShowMore((v) => !v)}
          aria-label="Open full navigation menu"
          aria-expanded={showMore}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500",
            showMore ? "text-green-600" : "text-slate-400 active:text-slate-600"
          )}
        >
          <MoreHorizontal
            aria-hidden="true"
            className={cn("w-5 h-5 transition-transform", showMore && "scale-110")}
          />
          <span className={cn("text-[10px] font-semibold leading-none", showMore ? "text-green-600" : "text-slate-400")}>
            More
          </span>
        </button>
      </nav>
    </>
  );
}
