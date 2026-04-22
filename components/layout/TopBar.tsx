"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Menu, Bell, LogOut, AlertTriangle, FileText, BookOpen, Loader2 } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useBusinessStore } from "@/store/businessStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";

interface TopBarProps {
  title: string;
}

interface Notification {
  id: string;
  type: "low_stock" | "overdue_invoice" | "credit_due";
  title: string;
  body: string;
  href: string;
}

export function TopBar({ title }: TopBarProps) {
  const { toggleSidebar } = useUIStore();
  const { clearBusiness, activeBusiness } = useBusinessStore();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const fetchNotifications = useCallback(async () => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    const supabase = createClient();
    const businessId = activeBusiness.id;
    const slug = activeBusiness.slug;
    const currency = activeBusiness.currency ?? "USD";
    const today = new Date().toISOString().split("T")[0];

    const isService = activeBusiness?.business_type === "service";

    const [{ data: allProducts }, { data: overdueInvoices }, { data: creditCustomers }] =
      await Promise.all([
        isService
          ? Promise.resolve({ data: [] })
          : supabase
              .from("products")
              .select("id, name, stock_quantity, low_stock_threshold")
              .eq("business_id", businessId)
              .eq("track_inventory", true)
              .eq("is_active", true),
        supabase
          .from("invoices")
          .select("id, invoice_number, due_date, total_amount, client_name, customers(name)")
          .eq("business_id", businessId)
          .not("status", "in", '("paid","cancelled")')
          .lt("due_date", today)
          .order("due_date", { ascending: true })
          .limit(10),
        supabase
          .from("customers")
          .select("id, name, credit_balance")
          .eq("business_id", businessId)
          .gt("credit_balance", 0)
          .order("credit_balance", { ascending: false })
          .limit(10),
      ]);

    const lowStockItems = (allProducts ?? []).filter(
      (p) => p.stock_quantity <= p.low_stock_threshold
    );

    const notifs: Notification[] = [];

    lowStockItems.slice(0, 5).forEach((p) => {
      notifs.push({
        id: `low_${p.id}`,
        type: "low_stock",
        title: "Low stock",
        body: `${p.name} — only ${p.stock_quantity} left`,
        href: `/${slug}/products`,
      });
    });

    (overdueInvoices ?? []).slice(0, 5).forEach((inv) => {
      const clientName =
        inv.client_name ?? (inv.customers as any)?.name ?? "Unknown client";
      const daysOverdue = Math.floor(
        (Date.now() - new Date(inv.due_date!).getTime()) / 86400000
      );
      notifs.push({
        id: `inv_${inv.id}`,
        type: "overdue_invoice",
        title: "Overdue invoice",
        body: `${inv.invoice_number} · ${clientName} — ${daysOverdue}d overdue`,
        href: `/${slug}/invoices`,
      });
    });

    (creditCustomers ?? []).slice(0, 5).forEach((c) => {
      notifs.push({
        id: `credit_${c.id}`,
        type: "credit_due",
        title: "Credit outstanding",
        body: `${c.name} owes ${formatCurrency(c.credit_balance, currency)}`,
        href: `/${slug}/customers`,
      });
    });

    setNotifications(notifs);
    setCount(notifs.length);
    setLoading(false);
  }, [activeBusiness]);

  useEffect(() => {
    if (activeBusiness?.id) {
      fetchNotifications();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusiness?.id]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearBusiness();
    router.push("/login");
  }

  const ICONS: Record<Notification["type"], React.ReactNode> = {
    low_stock: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />,
    overdue_invoice: <FileText className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />,
    credit_due: <BookOpen className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />,
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0 relative">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 via-green-400 to-transparent pointer-events-none" />

      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h2 className="text-base font-bold text-[#0F172A] flex-1 truncate">{title}</h2>

      <div className="flex items-center gap-1">
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className={`relative p-2 rounded-lg transition ${
              showNotifications
                ? "bg-green-600 text-white shadow-md shadow-green-200"
                : "text-slate-500 hover:text-green-600 hover:bg-green-50"
            }`}
          >
            <Bell className="w-5 h-5" />
            {count > 0 && !showNotifications && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-green-600 to-green-400" />
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="font-semibold text-sm text-[#0F172A]">Notifications</p>
                {count > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                    {count} alert{count !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">All clear!</p>
                  <p className="text-xs text-slate-400 mt-1">No alerts right now</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => setShowNotifications(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition"
                    >
                      {ICONS[n.type]}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700">{n.title}</p>
                        <p className="text-xs text-slate-500 truncate">{n.body}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={fetchNotifications}
                  className="text-xs text-green-600 hover:underline font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
