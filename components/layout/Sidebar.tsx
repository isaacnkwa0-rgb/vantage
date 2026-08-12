"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Package, Package2, Vault,
  ActivitySquare, Megaphone, BadgePercent, Users, Receipt,
  BarChart3, TrendingUp, Settings, X, ChevronLeft, ChevronRight,
  ChevronDown, Zap, ClipboardList, FileText, FilePen, Ticket,
  Target, Truck, ShoppingBag, Tag, CalendarDays, BookOpen,
  FileX, Globe, Gift, Share2, RefreshCw, Barcode, Thermometer,
  BellRing, Landmark, Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
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

function Tooltip({ label }: { label: string }) {
  return (
    <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 border border-slate-700 text-white text-xs font-medium rounded-lg opacity-0 group-hover/tip:opacity-100 pointer-events-none whitespace-nowrap z-[60] transition-opacity duration-150 shadow-lg">
      {label}
    </span>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  Icon: LucideIcon;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function NavLink({ href, label, Icon, isActive, collapsed, onClick }: NavLinkProps) {
  const link = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
        collapsed
          ? "lg:w-9 lg:h-9 lg:justify-center px-3 py-2 lg:p-0"
          : "px-3 py-2",
        isActive
          ? "bg-green-600 text-white shadow-md shadow-green-900/30"
          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
      )}
    >
      <Icon
        className={cn(
          "flex-shrink-0 transition-colors",
          collapsed ? "w-[18px] h-[18px]" : "w-4 h-4",
          isActive ? "text-green-100" : "text-slate-500 group-hover/link:text-green-400"
        )}
      />
      <span className={cn("truncate group/link", collapsed && "lg:hidden")}>{label}</span>
      {isActive && !collapsed && (
        <div className="ml-auto w-1 h-4 bg-green-300/60 rounded-full flex-shrink-0" />
      )}
    </Link>
  );

  if (!collapsed) return <div className="group/link">{link}</div>;

  return (
    <div className="relative group/tip">
      <div className="group/link">{link}</div>
      <div className="hidden lg:block">
        <Tooltip label={label} />
      </div>
    </div>
  );
}

export function Sidebar({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { activeBusiness } = useBusinessStore();

  const isService = activeBusiness?.business_type === "service";

  // Initialize open sections — expand whichever section has the active route
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    NAV_SECTIONS.forEach((section) => {
      const hasActive = section.items.some((item) => {
        const href = `/${slug}/${item.href}`;
        return pathname === href || pathname.startsWith(`${href}/`);
      });
      if (hasActive || ["overview", "sales", "catalog", "customers"].includes(section.id)) {
        initial.add(section.id);
      }
    });
    return initial;
  });

  // If active route changes (navigation), ensure its section is expanded
  useEffect(() => {
    NAV_SECTIONS.forEach((section) => {
      const hasActive = section.items.some((item) => {
        const href = `/${slug}/${item.href}`;
        return pathname === href || pathname.startsWith(`${href}/`);
      });
      if (hasActive) {
        setOpenSections((prev) => new Set([...prev, section.id]));
      }
    });
  }, [pathname, slug]);

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
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0C1526] transition-all duration-300 ease-in-out overflow-hidden",
          "lg:relative lg:translate-x-0 lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Width: mobile always 256px, desktop depends on collapsed state
          "w-64",
          sidebarCollapsed ? "lg:w-[68px]" : "lg:w-64"
        )}
      >
        {/* Top accent line */}
        <div className="h-0.5 bg-gradient-to-r from-green-600 via-green-400 to-emerald-500 flex-shrink-0" />

        {/* Header */}
        <div
          className={cn(
            "flex items-center border-b border-white/5 flex-shrink-0 h-14 px-4",
            sidebarCollapsed ? "lg:justify-center lg:px-0" : "justify-between"
          )}
        >
          {/* Expanded: logo + name */}
          <div className={cn("flex items-center gap-2.5 min-w-0", sidebarCollapsed && "lg:hidden")}>
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-900/50">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold tracking-tight text-white leading-tight">VANTAGE</p>
              <p className="text-[11px] text-slate-500 truncate leading-tight">
                {activeBusiness?.name ?? "Loading..."}
              </p>
            </div>
          </div>

          {/* Collapsed: icon only */}
          {sidebarCollapsed && (
            <button
              onClick={toggleSidebarCollapsed}
              aria-label="Expand sidebar"
              className="hidden lg:flex w-9 h-9 items-center justify-center rounded-lg bg-green-600 text-white shadow-lg shadow-green-900/50 hover:bg-green-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C1526]"
            >
              <Zap className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          {/* Right controls */}
          <div className={cn("flex items-center gap-1", sidebarCollapsed && "lg:hidden")}>
            {/* Desktop collapse */}
            <button
              onClick={toggleSidebarCollapsed}
              aria-label="Collapse sidebar"
              className="hidden lg:flex p-1.5 text-slate-600 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0C1526]"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            {/* Mobile close */}
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          {visibleSections.map((section) => {
            const items = section.items.filter((item) => !(item.retailOnly && isService));
            if (items.length === 0) return null;

            const isOpen = openSections.has(section.id);
            const hasActiveItem = items.some((item) => {
              const href = `/${slug}/${item.href}`;
              return pathname === href || pathname.startsWith(`${href}/`);
            });

            return (
              <div key={section.id} className="mb-0.5">
                {/* Section header — hidden when collapsed on desktop */}
                <div className={cn(sidebarCollapsed && "lg:hidden")}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={isOpen}
                    aria-label={`${section.label.charAt(0) + section.label.slice(1).toLowerCase()} section`}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500 rounded",
                      hasActiveItem ? "text-green-400" : "text-slate-600 hover:text-slate-400"
                    )}
                  >
                    {section.label}
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        "w-3 h-3 transition-transform duration-200 flex-shrink-0",
                        isOpen ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  </button>
                </div>

                {/* Collapsed divider on desktop */}
                {sidebarCollapsed && (
                  <div className="hidden lg:block mx-3 my-1 h-px bg-white/5" />
                )}

                {/* Items — when collapsed, always show all icons; when expanded, respect open state */}
                <div
                  className={cn(
                    "px-2 space-y-0.5",
                    // Collapsed desktop: center icons
                    sidebarCollapsed && "lg:flex lg:flex-col lg:items-center lg:px-[10px]",
                    // When section is closed on non-collapsed, hide items
                    !isOpen && !sidebarCollapsed && "hidden"
                  )}
                >
                  {items.map((item) => {
                    const label = isService && item.serviceLabel ? item.serviceLabel : item.label;
                    const href = `/${slug}/${item.href}`;
                    const isActive = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <NavLink
                        key={item.href}
                        href={href}
                        label={label}
                        Icon={item.icon}
                        isActive={isActive}
                        collapsed={sidebarCollapsed}
                        onClick={() => setSidebarOpen(false)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom upgrade CTA */}
        {activeBusiness?.subscription_tier === "free" && (
          <div
            className={cn(
              "flex-shrink-0 border-t border-white/5 p-2",
              sidebarCollapsed ? "lg:flex lg:justify-center" : ""
            )}
          >
            {/* Collapsed: icon button with tooltip */}
            <div className={cn("hidden", sidebarCollapsed && "lg:block relative group/tip")}>
              <Link
                href={`/${slug}/settings?tab=billing`}
                className="flex w-9 h-9 items-center justify-center rounded-lg bg-green-700 hover:bg-green-600 text-white transition shadow-md shadow-green-900/50"
              >
                <Zap className="w-4 h-4" />
              </Link>
              <Tooltip label="Upgrade to Starter" />
            </div>

            {/* Expanded */}
            <div className={cn(sidebarCollapsed && "lg:hidden")}>
              <Link
                href={`/${slug}/settings?tab=billing`}
                className="flex items-center gap-2 w-full px-3 py-2.5 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-green-900/40"
              >
                <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Upgrade to Starter</span>
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
