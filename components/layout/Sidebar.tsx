"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Receipt,
  BarChart3,
  TrendingUp,
  Settings,
  X,
  ChevronDown,
  Zap,
  ClipboardList,
  FileText,
  Scissors,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { useBusinessStore } from "@/store/businessStore";

const SELLING_NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "dashboard" },
  { label: "Point of Sale", icon: ShoppingCart, href: "pos" },
  { label: "Transactions", icon: ClipboardList, href: "sales" },
  { label: "Invoices", icon: FileText, href: "invoices" },
  { label: "Products", icon: Package, href: "products" },
  { label: "Customers", icon: Users, href: "customers" },
  { label: "Expenses", icon: Receipt, href: "expenses" },
  { label: "Reports", icon: BarChart3, href: "reports" },
  { label: "Analytics", icon: TrendingUp, href: "analytics" },
  { label: "Settings", icon: Settings, href: "settings" },
];

const SERVICE_NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "dashboard" },
  { label: "Record Service", icon: Scissors, href: "pos" },
  { label: "Transactions", icon: ClipboardList, href: "sales" },
  { label: "Invoices", icon: FileText, href: "invoices" },
  { label: "Services", icon: Briefcase, href: "products" },
  { label: "Clients", icon: UserCheck, href: "customers" },
  { label: "Expenses", icon: Receipt, href: "expenses" },
  { label: "Reports", icon: BarChart3, href: "reports" },
  { label: "Analytics", icon: TrendingUp, href: "analytics" },
  { label: "Settings", icon: Settings, href: "settings" },
];

interface SidebarProps {
  slug: string;
}

export function Sidebar({ slug }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { activeBusiness, userBusinesses } = useBusinessStore();

  const isService = activeBusiness?.business_type === "service";
  const NAV_ITEMS = isService ? SERVICE_NAV : SELLING_NAV;

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out",
          "lg:relative lg:translate-x-0 lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top accent line */}
        <div className="h-0.5 bg-gradient-to-r from-green-500 via-green-400 to-green-600 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-green-200">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-green-700">
                VANTAGE
              </h1>
              <p className="text-slate-500 text-xs truncate max-w-[120px] leading-tight">
                {activeBusiness?.name ?? "Loading..."}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 transition rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const href = `/${slug}/${item.href}`;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={item.href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-green-600 text-white shadow-md shadow-green-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0 transition-colors",
                    isActive ? "text-green-100" : "text-slate-400 group-hover:text-green-600"
                  )}
                />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-200 rounded-full animate-pulse" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          {activeBusiness?.subscription_tier === "free" && (
            <Link
              href={`/${slug}/settings?tab=billing`}
              className="flex items-center gap-2 w-full px-3 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-green-200"
            >
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              Upgrade to Starter
            </Link>
          )}
          {userBusinesses.length > 1 && (
            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition">
              <ChevronDown className="w-3.5 h-3.5" />
              Switch business
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
