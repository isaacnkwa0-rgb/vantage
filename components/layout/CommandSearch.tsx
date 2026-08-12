"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard, ShoppingCart, Package, Package2, Vault,
  ActivitySquare, Megaphone, BadgePercent, Users, Receipt,
  BarChart3, TrendingUp, Settings, ClipboardList, FileText,
  FilePen, Ticket, Target, Truck, ShoppingBag, Tag, CalendarDays,
  BookOpen, FileX, Globe, Gift, Share2, RefreshCw, Barcode,
  Thermometer, BellRing, Landmark, Wallet, Search, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { useBusinessStore } from "@/store/businessStore";
import { cn } from "@/lib/utils";

interface CommandItem {
  label: string;
  group: string;
  icon: LucideIcon;
  href: string;
  keywords?: string;
}

const NAV_COMMANDS: CommandItem[] = [
  // OVERVIEW
  { label: "Dashboard", group: "Navigate", icon: LayoutDashboard, href: "dashboard" },
  // SALES
  { label: "Point of Sale", group: "Navigate", icon: ShoppingCart, href: "pos", keywords: "pos sell sale new" },
  { label: "Transactions", group: "Navigate", icon: ClipboardList, href: "sales", keywords: "sales history" },
  { label: "Invoices", group: "Navigate", icon: FileText, href: "invoices" },
  { label: "Quotes", group: "Navigate", icon: FilePen, href: "quotes" },
  { label: "Discounts", group: "Navigate", icon: Ticket, href: "discounts" },
  { label: "Recurring Billing", group: "Navigate", icon: RefreshCw, href: "recurring" },
  // CATALOG
  { label: "Products", group: "Navigate", icon: Package, href: "products", keywords: "inventory items catalog" },
  { label: "Bundles", group: "Navigate", icon: Package2, href: "bundles" },
  { label: "Pricing Tiers", group: "Navigate", icon: Tag, href: "pricing" },
  { label: "Barcode Labels", group: "Navigate", icon: Barcode, href: "barcode-labels" },
  // CUSTOMERS
  { label: "Customers", group: "Navigate", icon: Users, href: "customers", keywords: "clients people" },
  { label: "Campaigns", group: "Navigate", icon: Megaphone, href: "campaigns", keywords: "marketing promotions" },
  { label: "Referrals", group: "Navigate", icon: Share2, href: "referrals" },
  { label: "Gift Cards", group: "Navigate", icon: Gift, href: "gift-cards" },
  // INVENTORY
  { label: "Suppliers", group: "Navigate", icon: Truck, href: "suppliers" },
  { label: "Purchase Orders", group: "Navigate", icon: ShoppingBag, href: "purchase-orders" },
  { label: "Store Orders", group: "Navigate", icon: Globe, href: "store-orders" },
  // FINANCE
  { label: "Expenses", group: "Navigate", icon: Receipt, href: "expenses" },
  { label: "Cashbook", group: "Navigate", icon: BookOpen, href: "cashbook" },
  { label: "Credit Notes", group: "Navigate", icon: FileX, href: "credit-notes" },
  { label: "Bank Accounts", group: "Navigate", icon: Landmark, href: "bank-accounts" },
  // INSIGHTS
  { label: "Reports", group: "Navigate", icon: BarChart3, href: "reports" },
  { label: "Analytics", group: "Navigate", icon: TrendingUp, href: "analytics" },
  { label: "Targets", group: "Navigate", icon: Target, href: "targets" },
  { label: "Commissions", group: "Navigate", icon: BadgePercent, href: "commissions" },
  // OPERATIONS
  { label: "Cash Shifts", group: "Navigate", icon: Vault, href: "shifts" },
  { label: "Appointments", group: "Navigate", icon: CalendarDays, href: "appointments" },
  { label: "Payroll", group: "Navigate", icon: Wallet, href: "payroll" },
  { label: "Thermal Printer", group: "Navigate", icon: Thermometer, href: "thermal-printer" },
  // SYSTEM
  { label: "Notifications", group: "Navigate", icon: BellRing, href: "notifications" },
  { label: "Activity", group: "Navigate", icon: ActivitySquare, href: "activity" },
  { label: "Settings", group: "Navigate", icon: Settings, href: "settings" },
];

const QUICK_ACTIONS: CommandItem[] = [
  { label: "New Sale", group: "Quick Actions", icon: ShoppingCart, href: "pos", keywords: "sell create" },
  { label: "Add Product", group: "Quick Actions", icon: Package, href: "products?action=new", keywords: "create new item" },
  { label: "Add Customer", group: "Quick Actions", icon: Users, href: "customers?action=new", keywords: "create new client" },
  { label: "New Invoice", group: "Quick Actions", icon: FileText, href: "invoices?action=new", keywords: "create bill" },
  { label: "Record Expense", group: "Quick Actions", icon: Receipt, href: "expenses?action=new", keywords: "spend cost" },
  { label: "Billing & Plans", group: "Quick Actions", icon: Settings, href: "settings?tab=billing", keywords: "upgrade subscribe" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandSearch({ open, onClose }: Props) {
  const router = useRouter();
  const { activeBusiness } = useBusinessStore();
  const slug = activeBusiness?.slug ?? "";

  const runCommand = useCallback((href: string) => {
    onClose();
    router.push(`/${slug}/${href}`);
  }, [slug, router, onClose]);

  if (!slug) return null;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      label="Command palette"
      className={cn(
        "fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
          <Command.Input
            placeholder="Search pages, actions…"
            className="flex-1 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
            autoFocus
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <Command.List className="max-h-[360px] overflow-y-auto p-2">
          <Command.Empty className="py-10 text-center text-sm text-slate-400">
            No results found.
          </Command.Empty>

          <Command.Group
            heading="Quick Actions"
            className="[&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:py-1.5 [&>[cmdk-group-heading]]:text-[10px] [&>[cmdk-group-heading]]:font-bold [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-widest [&>[cmdk-group-heading]]:text-slate-400"
          >
            {QUICK_ACTIONS.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <Command.Item
                  key={`action-${cmd.href}`}
                  value={`${cmd.label} ${cmd.keywords ?? ""}`}
                  onSelect={() => runCommand(cmd.href)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors",
                    "data-[selected=true]:bg-green-50 data-[selected=true]:text-green-900",
                    "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-green-700" />
                  </span>
                  <span className="font-medium">{cmd.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto flex-shrink-0" />
                </Command.Item>
              );
            })}
          </Command.Group>

          <Command.Group
            heading="Navigate"
            className="[&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:py-1.5 [&>[cmdk-group-heading]]:text-[10px] [&>[cmdk-group-heading]]:font-bold [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-widest [&>[cmdk-group-heading]]:text-slate-400"
          >
            {NAV_COMMANDS.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <Command.Item
                  key={`nav-${cmd.href}`}
                  value={`${cmd.label} ${cmd.keywords ?? ""}`}
                  onSelect={() => runCommand(cmd.href)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors",
                    "data-[selected=true]:bg-slate-100",
                    "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{cmd.label}</span>
                </Command.Item>
              );
            })}
          </Command.Group>
        </Command.List>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center gap-3">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-sm">↑↓</kbd>
            navigate
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-sm">↵</kbd>
            open
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-sm">esc</kbd>
            close
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}

// Provider — wraps the entire dashboard to handle Ctrl+K
export function CommandSearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {children}
      <CommandSearch open={open} onClose={() => setOpen(false)} />
    </>
  );
}
