"use client";

import Link from "next/link";
import { ShoppingCart, Plus, Package, Users, FileText, Receipt, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  businessName: string;
  businessType: "retail" | "service" | "restaurant";
  slug: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const QUICK_ACTIONS = [
  { label: "New Sale", icon: ShoppingCart, href: "pos", color: "bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-200" },
  { label: "Add Product", icon: Package, href: "products", color: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200" },
  { label: "Add Customer", icon: Users, href: "customers", color: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200" },
  { label: "Create Invoice", icon: FileText, href: "invoices", color: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200" },
  { label: "Record Expense", icon: Receipt, href: "expenses", color: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200" },
] as const;

const SERVICE_ACTIONS = [
  { label: "Record Service", icon: ShoppingCart, href: "pos", color: "bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-200" },
  { label: "Add Client", icon: Users, href: "customers", color: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200" },
  { label: "Create Invoice", icon: FileText, href: "invoices", color: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200" },
  { label: "Record Expense", icon: Receipt, href: "expenses", color: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200" },
] as const;

export function DashboardHeader({ businessName, businessType, slug }: Props) {
  const [showMore, setShowMore] = useState(false);
  const actions = businessType === "service" ? SERVICE_ACTIONS : QUICK_ACTIONS;
  const primaryAction = actions[0];
  const secondaryActions = actions.slice(1);

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 font-medium">{getFormattedDate()}</p>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            {getGreeting()}, {businessName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Primary CTA */}
        <Link
          href={`/${slug}/${primaryAction.href}`}
          className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all", primaryAction.color)}
        >
          <primaryAction.icon className="w-3.5 h-3.5" />
          {primaryAction.label}
        </Link>

        {/* Secondary actions — visible on sm+ */}
        <div className="hidden sm:flex items-center gap-2">
          {secondaryActions.map((action) => (
            <Link
              key={action.href}
              href={`/${slug}/${action.href}`}
              className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all", action.color)}
            >
              <action.icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* More — mobile */}
        <div className="relative sm:hidden">
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            More <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showMore && "rotate-180")} />
          </button>
          {showMore && (
            <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg z-20 w-44 py-1">
              {secondaryActions.map((action) => (
                <Link
                  key={action.href}
                  href={`/${slug}/${action.href}`}
                  onClick={() => setShowMore(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <action.icon className="w-4 h-4 text-slate-400" />
                  {action.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
