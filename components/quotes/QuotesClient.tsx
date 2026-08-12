"use client";

import { useState, useRef } from "react";
import {
  Plus, FileText, Search, Printer, CheckCircle2, Clock,
  AlertCircle, X, Loader2, ArrowRightLeft, Send,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { generateQuoteHTML } from "@/lib/utils/quote";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { QuoteForm } from "./QuoteForm";
import { cn } from "@/lib/utils";

interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

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
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:     { label: "Draft",     color: "bg-slate-100 text-slate-600",     icon: FileText },
  sent:      { label: "Sent",      color: "bg-blue-50 text-blue-700",        icon: Send },
  accepted:  { label: "Accepted",  color: "bg-emerald-50 text-emerald-700",  icon: CheckCircle2 },
  rejected:  { label: "Rejected",  color: "bg-red-50 text-red-700",          icon: X },
  expired:   { label: "Expired",   color: "bg-orange-50 text-orange-700",    icon: Clock },
  converted: { label: "Converted", color: "bg-violet-50 text-violet-700",    icon: ArrowRightLeft },
};

const STATUSES = ["draft", "sent", "accepted", "rejected", "expired", "converted"];

export function QuotesClient({ quotes, business, customers, userId }: Props) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [converting, setConverting] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fmt = (n: number) => formatCurrency(n, business.currency);

  const filtered = quotes.filter((q) => {
    const search_ = search.toLowerCase();
    const matchSearch =
      q.quote_number.toLowerCase().includes(search_) ||
      (q.client_name ?? q.customers?.name ?? "").toLowerCase().includes(search_);
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPending = quotes
    .filter((q) => q.status === "sent" || q.status === "draft")
    .reduce((s, q) => s + q.total_amount, 0);

  const totalAccepted = quotes
    .filter((q) => q.status === "accepted" || q.status === "converted")
    .reduce((s, q) => s + q.total_amount, 0);

  async function updateStatus(q: Quote, status: string) {
    setUpdatingStatus(q.id + status);
    const supabase = createClient();
    await supabase.from("quotes").update({ status }).eq("id", q.id);
    setUpdatingStatus(null);
    router.refresh();
  }

  async function convertToInvoice(q: Quote) {
    setConverting(q.id);
    const supabase = createClient();

    // Fetch items
    const { data: items } = await supabase
      .from("quote_items")
      .select("description, quantity, unit_price, line_total")
      .eq("quote_id", q.id);

    // Generate invoice number
    const { data: numData } = await supabase
      .rpc("generate_invoice_number", { p_business_id: business.id })
      .single<string>();
    const invoiceNumber = numData ?? `INV-${Date.now()}`;

    // Create invoice
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .insert({
        business_id: business.id,
        invoice_number: invoiceNumber,
        customer_id: q.customers ? null : null,
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

    if (invErr || !inv) {
      setConverting(null);
      return;
    }

    // Copy items to invoice
    if (items && items.length > 0) {
      await supabase.from("invoice_items").insert(
        items.map((i) => ({ ...i, invoice_id: inv.id }))
      );
    }

    // Mark quote as converted
    await supabase
      .from("quotes")
      .update({ status: "converted", converted_invoice_id: inv.id })
      .eq("id", q.id);

    setConverting(null);
    router.refresh();
  }

  function handlePrint(q: Quote) {
    const supabase = createClient();
    supabase
      .from("quote_items")
      .select("description, quantity, unit_price, line_total")
      .eq("quote_id", q.id)
      .then(({ data }) => {
        const html = generateQuoteHTML(
          {
            quote_number: q.quote_number,
            issue_date: q.issue_date,
            valid_until: q.valid_until,
            status: q.status,
            client_name: q.client_name ?? q.customers?.name ?? null,
            client_email: q.client_email,
            client_address: q.client_address,
            subtotal: q.subtotal,
            discount_amount: q.discount_amount,
            tax_amount: q.tax_amount,
            total_amount: q.total_amount,
            notes: q.notes,
            terms: q.terms,
            items: (data ?? []) as QuoteItem[],
          },
          business
        );
        const iframe = iframeRef.current;
        if (!iframe) return;
        const doc = iframe.contentDocument;
        if (!doc) return;
        doc.open();
        doc.write(html);
        doc.close();
        iframe.onload = () => iframe.contentWindow?.print();
      });
  }

  return (
    <div className="flex-1 p-3 sm:p-5 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-green-400" />
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-sm shadow-green-200 flex-shrink-0">
              <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide leading-tight">Total Quotes</p>
          </div>
          <p className="font-numeric text-sm sm:text-xl font-bold text-[#0F172A]">{quotes.length}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">all time</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400" />
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200 flex-shrink-0">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide leading-tight">Pending Value</p>
          </div>
          <p className="font-numeric text-sm sm:text-xl font-bold text-blue-600">{fmt(totalPending)}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">draft + sent</p>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-50 p-3 sm:p-4 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-200 flex-shrink-0">
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide leading-tight">Accepted Value</p>
          </div>
          <p className="font-numeric text-sm sm:text-xl font-bold text-emerald-600">{fmt(totalAccepted)}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">accepted + converted</p>
        </div>
      </div>

      {/* Filters + New */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by quote # or client..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
          ))}
        </select>
        <button
          onClick={() => { setEditingQuote(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm shadow-green-300/40"
        >
          <Plus className="w-4 h-4" />
          New Quote
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-14 h-14 text-slate-200 mb-4" />
          <p className="text-slate-600 font-medium">
            {search ? "No quotes match your search" : "No quotations yet"}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {search ? "Try a different keyword" : "Create your first quote to send to a client"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div className="w-28 flex-shrink-0">Quote #</div>
            <div className="flex-1">Client</div>
            <div className="w-24 flex-shrink-0 hidden sm:block">Status</div>
            <div className="w-28 flex-shrink-0 hidden md:block">Valid Until</div>
            <div className="w-24 text-right flex-shrink-0">Amount</div>
            <div className="w-40 flex-shrink-0" />
          </div>

          <div className="divide-y divide-slate-50">
            {filtered.map((q) => {
              const cfg = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.draft;
              const StatusIcon = cfg.icon;
              const clientName = q.client_name ?? q.customers?.name ?? "Unknown";
              const isExpired = q.valid_until && q.status === "sent" && new Date(q.valid_until) < new Date();

              return (
                <div key={q.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition group">
                  <div className="w-28 flex-shrink-0">
                    <span className="text-sm font-bold text-[#0F172A] font-numeric">{q.quote_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{clientName}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(q.issue_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="w-24 flex-shrink-0 hidden sm:block">
                    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg", cfg.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="w-28 flex-shrink-0 hidden md:block text-xs text-slate-500">
                    {q.valid_until
                      ? <span className={isExpired ? "text-orange-500 font-medium" : ""}>
                          {new Date(q.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      : "—"}
                  </div>
                  <div className="w-24 text-right flex-shrink-0">
                    <p className="font-numeric font-bold text-sm text-[#0F172A]">{fmt(q.total_amount)}</p>
                  </div>
                  <div className="w-40 flex-shrink-0 flex items-center gap-1 justify-end">
                    {/* Print */}
                    <button
                      onClick={() => handlePrint(q)}
                      className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                      title="Print quote"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Status update shortcuts */}
                    {q.status === "sent" && (
                      <>
                        <button
                          onClick={() => updateStatus(q, "accepted")}
                          disabled={!!updatingStatus}
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Mark accepted"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Accept
                        </button>
                        <button
                          onClick={() => updateStatus(q, "rejected")}
                          disabled={!!updatingStatus}
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Mark rejected"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}

                    {/* Convert to Invoice */}
                    {(q.status === "accepted" || q.status === "sent") && !q.converted_invoice_id && (
                      <button
                        onClick={() => convertToInvoice(q)}
                        disabled={converting === q.id}
                        className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg border border-violet-200 text-violet-700 hover:bg-violet-50 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Convert to invoice"
                      >
                        {converting === q.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <ArrowRightLeft className="w-3 h-3" />}
                        Invoice
                      </button>
                    )}

                    {/* Edit */}
                    {q.status !== "converted" && (
                      <button
                        onClick={() => { setEditingQuote(q); setShowForm(true); }}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition opacity-0 group-hover:opacity-100"
                      >
                        Edit
                      </button>
                    )}

                    {q.status === "converted" && q.converted_invoice_id && (
                      <span className="text-xs text-violet-500 font-medium opacity-0 group-hover:opacity-100">→ Invoice</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {quotes.length} quotations
          </div>
        </div>
      )}

      {showForm && (
        <QuoteForm
          business={business}
          customers={customers}
          editingQuote={editingQuote}
          userId={userId}
          onClose={() => { setShowForm(false); setEditingQuote(null); }}
        />
      )}

      <iframe ref={iframeRef} className="hidden" title="quote-print" />
    </div>
  );
}
