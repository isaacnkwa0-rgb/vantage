"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Plus, FileX, Search, X, Check, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditNote {
  id: string;
  cn_number: string;
  reason: string;
  amount: number;
  status: "open" | "applied" | "voided";
  notes: string | null;
  created_at: string;
  customers: { name: string } | null;
  invoices: { invoice_number: string } | null;
}

interface Customer { id: string; name: string; }
interface Invoice { id: string; invoice_number: string; }

interface Props {
  creditNotes: CreditNote[];
  customers: Customer[];
  invoices: Invoice[];
  currency: string;
  businessId: string;
  userId: string;
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  applied: "bg-green-100 text-green-700",
  voided: "bg-slate-100 text-slate-500",
};

const REASONS = [
  "Returned goods",
  "Overcharge correction",
  "Damaged goods",
  "Service not delivered",
  "Duplicate invoice",
  "Goodwill gesture",
  "Other",
];

function nextCNNumber(notes: CreditNote[]): string {
  const nums = notes.map((n) => parseInt(n.cn_number.replace(/\D/g, ""), 10)).filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `CN-${String(max + 1).padStart(4, "0")}`;
}

export function CreditNotesClient({ creditNotes: initialNotes, customers, invoices, currency, businessId, userId }: Props) {
  const supabase = createClient();
  const fmt = (n: number) => formatCurrency(n, currency);

  const [notes, setNotes] = useState<CreditNote[]>(initialNotes);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customer_id: "",
    invoice_id: "",
    reason: "",
    amount: "",
    notes: "",
  });

  const filtered = notes.filter(
    (n) =>
      n.cn_number.toLowerCase().includes(search.toLowerCase()) ||
      (n.customers?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      n.reason.toLowerCase().includes(search.toLowerCase())
  );

  const totalOpen = notes.filter((n) => n.status === "open").reduce((s, n) => s + n.amount, 0);

  function closeCreate() {
    setShowCreate(false);
    setForm({ customer_id: "", invoice_id: "", reason: "", amount: "", notes: "" });
  }

  async function create() {
    if (!form.reason || !form.amount) return;
    setSaving(true);
    const cn_number = nextCNNumber(notes);
    const { data, error } = await supabase
      .from("credit_notes")
      .insert({
        business_id: businessId,
        customer_id: form.customer_id || null,
        invoice_id: form.invoice_id || null,
        cn_number,
        reason: form.reason,
        amount: parseFloat(form.amount),
        status: "open",
        notes: form.notes.trim() || null,
        created_by: userId,
      })
      .select("*, customers(name), invoices(invoice_number)")
      .single();
    if (!error && data) {
      setNotes((prev) => [data as CreditNote, ...prev]);
      closeCreate();
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: CreditNote["status"]) {
    await supabase.from("credit_notes").update({ status }).eq("id", id);
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, status } : n)));
  }

  return (
    <div className="flex-1 p-5 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search credit notes..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm">
          <Plus className="w-4 h-4" /> New Credit Note
        </button>
      </div>

      {/* Summary */}
      {totalOpen > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <FileX className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-bold">{fmt(totalOpen)}</span> in open credit notes outstanding
          </p>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <FileX className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-[#0F172A]">No credit notes yet</p>
          <p className="text-xs text-slate-400">Issue a credit note for returns, overcharges, or goodwill</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                <th className="text-left px-5 py-3">CN #</th>
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-5 py-3">Reason</th>
                <th className="text-left px-5 py-3">Invoice</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50 transition group">
                  <td className="px-5 py-3 text-sm font-mono font-semibold text-[#0F172A]">{n.cn_number}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{n.customers?.name ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{n.reason}</td>
                  <td className="px-5 py-3 text-xs text-slate-400 font-mono">{n.invoices?.invoice_number ?? <span className="text-slate-200">—</span>}</td>
                  <td className="px-5 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", STATUS_STYLES[n.status])}>{n.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-[#0F172A]">{fmt(n.amount)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition justify-end">
                      {n.status === "open" && (
                        <>
                          <button onClick={() => updateStatus(n.id, "applied")} title="Mark Applied" className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => updateStatus(n.id, "voided")} title="Void" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">New Credit Note</h3>
              <button onClick={closeCreate} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Customer</label>
                <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">— None —</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Linked Invoice</label>
                <select value={form.invoice_id} onChange={(e) => setForm({ ...form, invoice_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">— None —</option>
                  {invoices.map((i) => <option key={i.id} value={i.id}>{i.invoice_number}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Reason *</label>
                <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">— Select reason —</option>
                  {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Credit Amount *</label>
                <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional details..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={closeCreate} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={create} disabled={saving || !form.reason || !form.amount} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                {saving ? "Saving..." : "Issue Credit Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
