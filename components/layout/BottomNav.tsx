"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, ClipboardList, Users, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { useBusinessStore } from "@/store/businessStore";

const BOTTOM_TABS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "dashboard" },
  { label: "POS", icon: ShoppingCart, href: "pos" },
  { label: "Sales", icon: ClipboardList, href: "sales" },
  { label: "Customers", icon: Users, href: "customers" },
] as const;

export function BottomNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { setSidebarOpen } = useUIStore();
  const { activeBusiness } = useBusinessStore();

  const posLabel = activeBusiness?.business_type === "service" ? "Services" : "POS";
  const customersLabel = activeBusiness?.business_type === "service" ? "Clients" : "Customers";

  return (
    <nav className="lg:hidden flex-shrink-0 bg-white border-t border-slate-200 flex items-stretch h-16 safe-area-pb">
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
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
              isActive ? "text-green-600" : "text-slate-400 active:text-slate-600"
            )}
          >
            <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
            <span className={cn("text-[10px] font-semibold leading-none", isActive ? "text-green-600" : "text-slate-400")}>
              {label}
            </span>
          </Link>
        );
      })}

      {/* More — opens full sidebar */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-400 active:text-slate-600 transition-colors"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] font-semibold leading-none text-slate-400">More</span>
      </button>
    </nav>
  );
}
