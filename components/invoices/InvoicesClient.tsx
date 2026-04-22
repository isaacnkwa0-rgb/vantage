"use client";

import { useState, useRef } from "react";
import { Plus, FileText, Search, Printer, CheckCircle2, Clock, AlertCircle, X, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { generateInvoiceHTML } from "@/lib/utils/invoice";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { InvoiceForm } from "./InvoiceForm";
import { cn } from "@/lib/utils";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

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
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:     { label: "Draft",     color: "bg-slate-100 text-slate-600",   icon: FileText },
  sent:      { label: "Sent",      color: "bg-green-50 text-green-700",      icon: Clock },
  paid:      { label: "Paid",      color: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  overdue:   { label: "Overdue",   color: "bg-red-50 text-red-700",        icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-400",   icon: X },
};

export function InvoicesClient({ invoices, business, customers }: Props) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const fmt = (n: number) => formatCurrency(n, business.currency);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      inv.invoice_number.toLowerCase().includes(q) ||
      (inv.client_name ?? inv.customers?.name ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalOutstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((s, i) => s + (i.total_amount - i.amount_paid), 0);

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.total_amount, 0);

  function handlePrint(inv: Invoice) {
    const invoiceData = {
      invoice_number: inv.invoice_number,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      status: inv.status,
      client_name: inv.client_name ?? inv.customers?.name ?? null,
      client_email: inv.client_email,
      client_address: inv.client_address,
      subtotal: inv.subtotal,
      discount_amount: inv.discount_amount,
      tax_amount: inv.tax_amount,
      total_amount: inv.total_amount,
      amount_paid: inv.amount_paid,
      notes: inv.notes,
      bank_details: inv.bank_details,
      items: [],
    };
    // Fetch items then print
    const supabase = createClient();
    supabase
      .from("invoice_items")
      .select("description, quantity, unit_price, line_total")
      .eq("invoice_id", inv.id)
      .then(({ data }) => {
        const html = generateInvoiceHTML(
          { ...invoiceData, items: (data ?? []) as InvoiceItem[] },
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

  async function markAsPaid(inv: Invoice) {
    setMarkingPaid(inv.id);
    const supabase = createClient();
    await supabase.from("invoices").update({ status: "paid", amount_paid: inv.total_amount }).eq("id", inv.id);
    setMarkingPaid(null);
    router.refresh();
  }

  return (
    <div className="flex-1 p-5 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-green-400" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-sm shadow-green-200">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Invoices</p>
          </div>
          <p className="font-numeric text-xl font-bold text-[#0F172A]">{invoices.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">all time</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Collected</p>
          </div>
          <p className="font-numeric text-xl font-bold text-emerald-600 truncate">{fmt(totalPaid)}</p>
          <p className="text-xs text-slate-400 mt-0.5">from paid invoices</p>
        </div>

        <div className="bg-white rounded-2xl border border-red-50 p-4 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-400" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center shadow-sm shadow-red-200">
              <Clock className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Outstanding</p>
          </div>
          <p className="font-numeric text-xl font-bold text-red-500 truncate">{fmt(totalOutstanding)}</p>
          <p className="text-xs text-slate-400 mt-0.5">pending collection</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice # or client..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <button
          onClick={() => { setEditingInvoice(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm shadow-green-300/40"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </button>
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-14 h-14 text-slate-200 mb-4" />
          <p className="text-slate-600 font-medium">
            {search ? "No invoices match your search" : "No invoices yet"}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {search ? "Try a different keyword" : "Create your first invoice for a client"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div className="w-32 flex-shrink-0">Invoice #</div>
            <div className="flex-1">Client</div>
            <div className="w-24 flex-shrink-0 hidden sm:block">Status</div>
            <div className="w-32 flex-shrink-0 hidden md:block">Due Date</div>
            <div className="w-28 text-right flex-shrink-0">Amount</div>
            <div className="w-28 flex-shrink-0" />
          </div>

          <div className="divide-y divide-slate-50">
            {filtered.map((inv) => {
              const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
              const StatusIcon = cfg.icon;
              const clientName = inv.client_name ?? inv.customers?.name ?? "Unknown";
              const balanceDue = inv.total_amount - inv.amount_paid;
              const isOverdue = inv.due_date && inv.status !== "paid" && new Date(inv.due_date) < new Date();

              return (
                <div key={inv.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition group">
                  <div className="w-32 flex-shrink-0">
                    <span className="text-sm font-bold text-[#0F172A] font-numeric">{inv.invoice_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{clientName}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(inv.issue_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="w-24 flex-shrink-0 hidden sm:block">
                    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg", cfg.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="w-32 flex-shrink-0 hidden md:block text-xs text-slate-500">
                    {inv.due_date
                      ? <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                          {new Date(inv.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      : "—"}
                  </div>
                  <div className="w-28 text-right flex-shrink-0">
                    <p className="font-numeric font-bold text-sm text-[#0F172A]">{fmt(inv.total_amount)}</p>
                    {balanceDue > 0 && inv.status !== "cancelled" && (
                      <p className="text-xs text-red-500">Due: {fmt(balanceDue)}</p>
                    )}
                  </div>
                  <div className="w-28 flex-shrink-0 flex items-center gap-1 justify-end">
                    <button
                      onClick={() => handlePrint(inv)}
                      className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                      title="Print invoice"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    {inv.status !== "paid" && inv.status !== "cancelled" && (
                      <button
                        onClick={() => markAsPaid(inv)}
                        disabled={markingPaid === inv.id}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        {markingPaid === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        Paid
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingInvoice(inv); setShowForm(true); }}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition opacity-0 group-hover:opacity-100"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {invoices.length} invoices
          </div>
        </div>
      )}

      {showForm && (
        <InvoiceForm
          business={business}
          customers={customers}
          editingInvoice={editingInvoice}
          onClose={() => { setShowForm(false); setEditingInvoice(null); }}
        />
      )}

      <iframe ref={iframeRef} className="hidden" title="invoice-print" />
    </div>
  );
}
