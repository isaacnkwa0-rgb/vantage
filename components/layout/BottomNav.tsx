"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Users, MoreHorizontal, X, Zap,
  Package, Package2, Vault, ActivitySquare, Megaphone, BadgePercent, Receipt,
  BarChart3, TrendingUp, Settings, FileText, FilePen, Ticket, Target, Truck,
  ShoppingBag, Tag, CalendarDays, BookOpen, FileX, Globe, Gift, Share2,
  RefreshCw, Barcode, Thermometer, BellRing, Landmark, Wallet,
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
    label: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "dashboard" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { label: "Point of Sale", serviceLabel: "Record Service", icon: ShoppingCart, href: "pos" },
      { label: "Transactions", icon: ClipboardList, href: "sales" },
      { label: "Invoices", icon: FileText, href: "invoices" },
      { label: "Quotes", icon: FilePen, href: "quotes" },
      { label: "Discounts", icon: Ticket, href: "discounts" },
      { label: "Recurring", icon: RefreshCw, href: "recurring" },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      { label: "Products", serviceLabel: "Services", icon: Package, href: "products" },
      { label: "Bundles", icon: Package2, href: "bundles", retailOnly: true },
      { label: "Pricing Tiers", icon: Tag, href: "pricing" },
      { label: "Barcode Labels", icon: Barcode, href: "barcode-labels", retailOnly: true },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    items: [
      { label: "Customers", serviceLabel: "Clients", icon: Users, href: "customers" },
      { label: "Campaigns", icon: Megaphone, href: "campaigns" },
      { label: "Referrals", icon: Share2, href: "referrals" },
      { label: "Gift Cards", icon: Gift, href: "gift-cards" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    retailOnly: true,
    items: [
      { label: "Suppliers", icon: Truck, href: "suppliers" },
      { label: "Purchase Orders", icon: ShoppingBag, href: "purchase-orders" },
      { label: "Store Orders", icon: Globe, href: "store-orders" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      { label: "Expenses", icon: Receipt, href: "expenses" },
      { label: "Cashbook", icon: BookOpen, href: "cashbook" },
      { label: "Credit Notes", icon: FileX, href: "credit-notes" },
      { label: "Bank Accounts", icon: Landmark, href: "bank-accounts" },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      { label: "Reports", icon: BarChart3, href: "reports" },
      { label: "Analytics", icon: TrendingUp, href: "analytics" },
      { label: "Targets", icon: Target, href: "targets" },
      { label: "Commissions", icon: BadgePercent, href: "commissions" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { label: "Cash Shifts", icon: Vault, href: "shifts" },
      { label: "Appointments", icon: CalendarDays, href: "appointments" },
      { label: "Payroll", icon: Wallet, href: "payroll" },
      { label: "Thermal Printer", icon: Thermometer, href: "thermal-printer" },
    ],
  },
  {
    id: "system",
    label: "System",
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

function MoreSheet({ slug, onClose }: { slug: string; onClose: () => void }) {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const isService = activeBusiness?.business_type === "service";

  const visibleSections = NAV_SECTIONS.filter((s) => !(s.retailOnly && isService));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl max-h-[88vh] flex flex-col shadow-2xl"
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Image
              src="/vantage-icon.svg"
              alt="VANTAGE"
              width={28}
              height={28}
              className="rounded-lg flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold text-slate-900 leading-tight">VANTAGE</p>
              <p className="text-[11px] text-slate-400 truncate leading-tight">
                {activeBusiness?.name ?? ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable nav sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {visibleSections.map((section) => {
            const items = section.items.filter((item) => !(item.retailOnly && isService));
            if (!items.length) return null;

            return (
              <div key={section.id}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">
                  {section.label}
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {items.map((item) => {
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
                          "flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
                          isActive
                            ? "bg-green-50"
                            : "hover:bg-slate-50 active:bg-slate-100"
                        )}
                      >
                        <div
                          className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                            isActive ? "bg-green-600 shadow-md shadow-green-900/25" : "bg-slate-100"
                          )}
                        >
                          <Icon
                            aria-hidden="true"
                            className={cn(
                              "w-5 h-5",
                              isActive ? "text-white" : "text-slate-500"
                            )}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-medium text-center leading-tight line-clamp-2",
                            isActive ? "text-green-700" : "text-slate-600"
                          )}
                        >
                          {label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upgrade CTA */}
        {activeBusiness?.subscription_tier === "free" && (
          <div className="flex-shrink-0 p-3 border-t border-slate-100">
            <Link
              href={`/${slug}/settings?tab=billing`}
              onClick={onClose}
              className="flex items-center gap-2.5 w-full px-4 py-3 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white rounded-xl text-sm font-bold transition shadow-md shadow-green-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2"
            >
              <Zap className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>Upgrade to Starter</span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export function BottomNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const [showMore, setShowMore] = useState(false);

  const isService = activeBusiness?.business_type === "service";
  const posLabel = isService ? "Services" : "POS";
  const customersLabel = isService ? "Clients" : "Customers";

  // Close the sheet whenever the user navigates
  useEffect(() => {
    setShowMore(false);
  }, [pathname]);

  return (
    <>
      {showMore && <MoreSheet slug={slug} onClose={() => setShowMore(false)} />}

      <nav
        aria-label="Main navigation"
        className="bottom-nav flex-shrink-0 bg-white border-t border-slate-200 flex items-stretch h-16"
      >
        {BOTTOM_TABS.map((tab) => {
          const href = `/${slug}/${tab.href}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
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
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none",
                  isActive ? "text-green-600" : "text-slate-400"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* More — opens the nav sheet */}
        <button
          onClick={() => setShowMore(true)}
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
          <span
            className={cn(
              "text-[10px] font-semibold leading-none",
              showMore ? "text-green-600" : "text-slate-400"
            )}
          >
            More
          </span>
        </button>
      </nav>
    </>
  );
}
