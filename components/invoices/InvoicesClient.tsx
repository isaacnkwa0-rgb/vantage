"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus, FileText, Search, CheckCircle2, Clock,
  AlertCircle, X, Loader2,
  SlidersHorizontal, Check,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/currency";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  notes: string | null;
  bank_details: string | null;
  client_name: string | null;
  client_email: string | null;
  client_address: string | null;
  payment_link_token: string | null;
  customers: { name: string; phone: string | null } | null;
}

interface Business {
  id: string;
  name: string;
  currency: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  invoice_accent_color?: string | null;
  invoice_footer_notes?: string | null;
  social_instagram?: string | null;
  social_twitter?: string | null;
  social_whatsapp?: string | null;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface Props {
  invoices: Invoice[];
  business: Business;
  customers: Customer[];
  businessSlug: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  draft:     { label: "Draft",     bg: "bg-slate-100",   text: "text-slate-600",   icon: FileText },
  sent:      { label: "Sent",      bg: "bg-blue-50",     text: "text-blue-600",    icon: Clock },
  paid:      { label: "Paid",      bg: "bg-emerald-50",  text: "text-emerald-700", icon: CheckCircle2 },
  overdue:   { label: "Overdue",   bg: "bg-red-50",      text: "text-red-600",     icon: AlertCircle },
  cancelled: { label: "Cancelled", bg: "bg-slate-100",   text: "text-slate-400",   icon: X },
};

const STATUS_TABS = [
  { value: "all",      label: "All" },
  { value: "draft",    label: "Draft" },
  { value: "sent",     label: "Sent" },
  { value: "paid",     label: "Paid" },
  { value: "overdue",  label: "Overdue" },
] as const;

export function InvoicesClient({ invoices, business, customers, businessSlug }: Props) {
  const router = useRouter();
  const filterRef = useRef<HTMLDivElement>(null);

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [markingPaid, setMarkingPaid]   = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    }
    if (showFilterMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterMenu]);

  const fmt = (n: number) => formatCurrency(n, business.currency);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      inv.invoice_number.toLowerCase().includes(q) ||
      (inv.client_name ?? inv.customers?.name ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function markAsPaid(inv: Invoice) {
    setMarkingPaid(inv.id);
    const supabase = createClient();
    const { error } = await supabase.from("invoices").update({ status: "paid", amount_paid: inv.total_amount }).eq("id", inv.id);
    setMarkingPaid(null);
    if (error) { toast.error("Failed to mark invoice as paid"); return; }
    router.refresh();
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white overflow-x-hidden">

      {/* Search + filter + new */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-2 items-stretch h-11">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full h-full pl-9 pr-4 border border-slate-200 rounded-[8px] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a9c38] transition"
            />
          </div>

          {/* Status filter */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setShowFilterMenu((v) => !v)}
              className={cn(
                "h-full flex items-center gap-1.5 px-3 border rounded-[8px] text-[13px] font-medium transition bg-white",
                statusFilter !== "all"
                  ? "border-[#1a9c38] text-[#1a9c38]"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {statusFilter !== "all" && <span className="w-1.5 h-1.5 rounded-full bg-[#1a9c38]" />}
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-[8px] border border-slate-200 shadow-lg z-20 overflow-hidden">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => { setStatusFilter(tab.value); setShowFilterMenu(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    {tab.label}
                    {statusFilter === tab.value && <Check className="w-3.5 h-3.5 text-[#1a9c38]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New Invoice */}
          <button
            onClick={() => router.push(`/${businessSlug}/invoices/new`)}
            className="h-full flex items-center gap-1.5 px-3 bg-[#1a9c38] hover:bg-green-700 text-white rounded-[8px] text-[13px] font-semibold transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 pb-4 pt-2 space-y-4">

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <FileText className="w-9 h-9 text-slate-300" />
            </div>
            <p className="text-[16px] font-bold text-slate-800">
              {search || statusFilter !== "all" ? "No invoices found" : "No invoices yet"}
            </p>
            <p className="text-[13px] text-slate-400 mt-1.5 max-w-xs">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filter"
                : "Create your first invoice to get started"}
            </p>
            {!search && statusFilter === "all" && (
              <button
                onClick={() => router.push(`/${businessSlug}/invoices/new`)}
                className="mt-6 flex items-center gap-2 bg-[#1a9c38] hover:bg-green-700 text-white px-5 py-3 rounded-xl text-sm font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                New Invoice
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
            </p>

            <div className="bg-white rounded-[8px] border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {filtered.map((inv) => {
                const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
                const StatusIcon = cfg.icon;
                const clientName = inv.client_name ?? inv.customers?.name ?? "Unknown";
                const balanceDue = inv.total_amount - inv.amount_paid;
                const isOverdue = inv.due_date && inv.status !== "paid" && new Date(inv.due_date) < new Date();
                const isPending = inv.status !== "paid" && inv.status !== "cancelled";

                return (
                  <div key={inv.id} className="px-4 py-4">
                    {/* Main row */}
                    <div
                      className="flex items-start gap-3 cursor-pointer active:opacity-70 transition"
                      onClick={() => router.push(`/${businessSlug}/invoices/${inv.id}/edit`)}
                    >
                      {/* Status icon avatar */}
                      <div className={cn("w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5", cfg.bg)}>
                        <StatusIcon className={cn("w-4 h-4", cfg.text)} />
                      </div>

                      {/* Left — client + invoice # */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[15px] text-slate-900 leading-none truncate max-w-[140px]">{clientName}</span>
                          <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0", cfg.bg, cfg.text)}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] text-slate-400">{inv.invoice_number}</span>
                          {inv.due_date && (
                            <span className={cn("text-[13px]", isOverdue ? "text-red-500 font-semibold" : "text-slate-400")}>
                              · Due <span suppressHydrationWarning>{shortDate(inv.due_date)}</span>
                              {isOverdue && " ⚠"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right — amount + balance */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0 min-w-0 max-w-[100px]">
                        <span className="text-[15px] font-bold text-slate-900 leading-none truncate w-full text-right">{fmt(inv.total_amount)}</span>
                        {balanceDue > 0 && isPending ? (
                          <span className="text-[11px] font-semibold text-red-500">Due {fmt(balanceDue)}</span>
                        ) : inv.status === "paid" ? (
                          <span className="text-[11px] text-emerald-600 font-semibold">Paid</span>
                        ) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
                      </div>
                    </div>

                    {/* Single action — Mark Paid only for pending invoices */}
                    {isPending && (
                      <div className="mt-3 pl-[52px]">
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsPaid(inv); }}
                          disabled={markingPaid === inv.id}
                          className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition active:scale-95 disabled:opacity-50"
                        >
                          {markingPaid === inv.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <CheckCircle2 className="w-3 h-3" />}
                          Mark Paid
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[11px] text-slate-400 pt-1">
              {filtered.length} of {invoices.length} invoices
            </p>
          </div>
        )}

        <div className="h-6" />
      </div>


    </div>
  );
}
