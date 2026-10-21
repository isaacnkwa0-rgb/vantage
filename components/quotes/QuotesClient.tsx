"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus, FileText, Search, CheckCircle2, Clock,
  X, Loader2, ArrowRightLeft, Send,
  SlidersHorizontal, Check,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/currency";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Quote {
  id: string;
  quote_number: string;
  status: string;
  issue_date: string;
  valid_until: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  terms: string | null;
  client_name: string | null;
  client_email: string | null;
  client_address: string | null;
  converted_invoice_id: string | null;
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
  quotes: Quote[];
  business: Business;
  customers: Customer[];
  userId: string;
  businessSlug: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  draft:     { label: "Draft",     bg: "bg-[#EADFD2]",     text: "text-text-muted",  icon: FileText },
  sent:      { label: "Sent",      bg: "bg-ink/10",         text: "text-ink",         icon: Send },
  accepted:  { label: "Accepted",  bg: "bg-primary-soft",   text: "text-primary",     icon: CheckCircle2 },
  rejected:  { label: "Rejected",  bg: "bg-danger/10",      text: "text-danger",      icon: X },
  expired:   { label: "Expired",   bg: "bg-sun/20",         text: "text-ink",         icon: Clock },
  converted: { label: "Converted", bg: "bg-violet-50",      text: "text-violet-700",  icon: ArrowRightLeft },
};

const STATUS_TABS = [
  { value: "all",       label: "All" },
  { value: "draft",     label: "Draft" },
  { value: "sent",      label: "Sent" },
  { value: "accepted",  label: "Accepted" },
  { value: "rejected",  label: "Rejected" },
  { value: "expired",   label: "Expired" },
  { value: "converted", label: "Converted" },
] as const;

export function QuotesClient({ quotes, business, customers, userId, businessSlug }: Props) {
  const router = useRouter();
  const filterRef = useRef<HTMLDivElement>(null);

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [converting, setConverting]     = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

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

  const filtered = quotes.filter((q) => {
    const q_ = search.toLowerCase();
    const matchSearch =
      q.quote_number.toLowerCase().includes(q_) ||
      (q.client_name ?? q.customers?.name ?? "").toLowerCase().includes(q_);
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function updateStatus(q: Quote, status: string) {
    setUpdatingStatus(q.id + status);
    const supabase = createClient();
    const { error } = await supabase.from("quotes").update({ status }).eq("id", q.id);
    setUpdatingStatus(null);
    if (error) { toast.error("Failed to update quote status"); return; }
    router.refresh();
  }

  async function convertToInvoice(q: Quote) {
    setConverting(q.id);
    const supabase = createClient();
    const { data: items } = await supabase
      .from("quote_items")
      .select("description, quantity, unit_price, line_total")
      .eq("quote_id", q.id);

    const { data: numData } = await supabase
      .rpc("generate_invoice_number", { p_business_id: business.id })
      .single<string>();
    const invoiceNumber = numData ?? `INV-${Date.now()}`;

    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .insert({
        business_id: business.id,
        invoice_number: invoiceNumber,
        client_name: q.client_name,
        client_email: q.client_email,
        client_address: q.client_address,
        issue_date: new Date().toISOString().split("T")[0],
        due_date: null,
        status: "draft",
        subtotal: q.subtotal,
        discount_amount: q.discount_amount,
        tax_amount: q.tax_amount,
        total_amount: q.total_amount,
        amount_paid: 0,
        notes: q.notes,
        bank_details: null,
      })
      .select("id")
      .single();

    if (invErr || !inv) { setConverting(null); toast.error("Failed to convert quote to invoice"); return; }

    if (items && items.length > 0) {
      await supabase.from("invoice_items").insert(
        items.map((i) => ({ ...i, invoice_id: inv.id }))
      );
    }

    await supabase
      .from("quotes")
      .update({ status: "converted", converted_invoice_id: inv.id })
      .eq("id", q.id);

    setConverting(null);
    router.refresh();
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white overflow-x-hidden">

      {/* Search + Filter + New */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-2 items-stretch h-11">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full h-full pl-9 pr-4 border border-slate-200 rounded-[8px] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setShowFilterMenu((v) => !v)}
              className={cn(
                "h-full flex items-center gap-1.5 px-3 border rounded-[8px] text-[13px] font-medium transition bg-white",
                statusFilter !== "all"
                  ? "border-primary text-primary"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {statusFilter !== "all" && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-[8px] border border-slate-200 shadow-lg z-20 overflow-hidden">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => { setStatusFilter(tab.value); setShowFilterMenu(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    {tab.label}
                    {statusFilter === tab.value && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* New Quote */}
          <button
            onClick={() => router.push(`/${businessSlug}/quotes/new`)}
            className="h-full flex items-center gap-1.5 px-3 bg-primary hover:bg-ember-deep text-on-primary rounded-[8px] text-[13px] font-semibold transition active:scale-95"
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
              {search || statusFilter !== "all" ? "No quotes found" : "No quotations yet"}
            </p>
            <p className="text-[13px] text-slate-400 mt-1.5 max-w-xs">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filter"
                : "Create your first quote to send to a client"}
            </p>
            {!search && statusFilter === "all" && (
              <button
                onClick={() => router.push(`/${businessSlug}/quotes/new`)}
                className="mt-6 flex items-center gap-2 bg-primary hover:bg-ember-deep text-on-primary px-5 py-3 rounded-xl text-sm font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                New Quote
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              {filtered.length} quote{filtered.length !== 1 ? "s" : ""}
            </p>

            <div className="bg-white rounded-[8px] border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {filtered.map((q) => {
                const cfg = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.draft;
                const StatusIcon = cfg.icon;
                const clientName = q.client_name ?? q.customers?.name ?? "Unknown";
                const isExpired = q.valid_until && q.status === "sent" && new Date(q.valid_until) < new Date();
                const isConvertible = (q.status === "accepted" || q.status === "sent") && !q.converted_invoice_id;

                return (
                  <div key={q.id} className="px-4 py-4">
                    {/* Main row */}
                    <div
                      className="flex items-start gap-3 cursor-pointer active:opacity-70 transition"
                      onClick={() => router.push(`/${businessSlug}/quotes/${q.id}/edit`)}
                    >
                      <div className={cn("w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5", cfg.bg)}>
                        <StatusIcon className={cn("w-4 h-4", cfg.text)} />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[15px] text-slate-900 leading-none truncate max-w-[140px]">{clientName}</span>
                          <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0", cfg.bg, cfg.text)}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] text-slate-400">{q.quote_number}</span>
                          {q.valid_until && (
                            <span className={cn("text-[13px]", isExpired ? "text-orange-500 font-semibold" : "text-slate-400")}>
                              · Valid <span suppressHydrationWarning>{shortDate(q.valid_until)}</span>
                              {isExpired && " ⚠"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0 min-w-0 max-w-[100px]">
                        <span className="text-[15px] font-bold text-slate-900 leading-none truncate w-full text-right">{fmt(q.total_amount)}</span>
                        {q.status === "accepted" || q.status === "converted" ? (
                          <span className="text-[11px] text-success font-semibold">Accepted</span>
                        ) : q.status === "rejected" ? (
                          <span className="text-[11px] text-red-500 font-semibold">Rejected</span>
                        ) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
                      </div>
                    </div>

                    {/* Action row */}
                    {(isConvertible || (q.status === "sent" && !q.converted_invoice_id)) && (
                      <div className="flex items-center gap-2 mt-3 pl-[52px]">
                        {isConvertible && (
                          <button
                            onClick={(e) => { e.stopPropagation(); convertToInvoice(q); }}
                            disabled={converting === q.id}
                            className="flex items-center gap-1.5 text-[13px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-lg transition active:scale-95 disabled:opacity-50"
                          >
                            {converting === q.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <ArrowRightLeft className="w-3 h-3" />}
                            Convert to Invoice
                          </button>
                        )}
                        {q.status === "sent" && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateStatus(q, "accepted"); }}
                              disabled={!!updatingStatus}
                              className="flex items-center gap-1.5 text-[13px] font-semibold text-primary bg-primary-soft hover:bg-primary-soft border border-primary px-3 py-1.5 rounded-lg transition active:scale-95 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Accept
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateStatus(q, "rejected"); }}
                              disabled={!!updatingStatus}
                              className="flex items-center gap-1.5 text-[13px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition active:scale-95 disabled:opacity-50"
                            >
                              <X className="w-3 h-3" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[11px] text-slate-400 pt-1">
              {filtered.length} of {quotes.length} quotes
            </p>
          </div>
        )}

        <div className="h-6" />
      </div>

    </div>
  );
}
