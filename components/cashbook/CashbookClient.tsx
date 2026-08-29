"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Plus, ArrowUpCircle, ArrowDownCircle, Trash2, BookOpen, X, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Entry {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string | null;
  reference: string | null;
  entry_date: string;
}

interface Props {
  entries: Entry[];
  currency: string;
  businessId: string;
  userId: string;
  fromDate: string;
  toDate: string;
  businessSlug: string;
}

const INCOME_CATEGORIES = ["Sales Revenue", "Loan", "Investment", "Refund", "Other Income"];
const EXPENSE_CATEGORIES = ["Petty Cash", "Utilities", "Rent", "Salaries", "Supplies", "Transport", "Maintenance", "Marketing", "Other Expense"];

const EMPTY_FORM = {
  type: "expense" as "income" | "expense",
  amount: "",
  description: "",
  category: "",
  reference: "",
  entry_date: new Date().toISOString().split("T")[0],
};

export function CashbookClient({ entries: initialEntries, currency, businessId, userId, fromDate, toDate, businessSlug }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const fmt = (n: number) => formatCurrency(n, currency);

  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [from, setFrom] = useState(fromDate);
  const [to, setTo] = useState(toDate);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalIncome = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  function applyRange() {
    router.push(`/${businessSlug}/cashbook?from=${from}&to=${to}`);
  }

  async function save() {
    if (!form.amount || !form.description.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("cashbook_entries")
      .insert({
        business_id: businessId,
        type: form.type,
        amount: parseFloat(form.amount),
        description: form.description.trim(),
        category: form.category || null,
        reference: form.reference.trim() || null,
        entry_date: form.entry_date,
        created_by: userId,
      })
      .select()
      .single();
    if (!error && data) {
      setEntries((prev) => [data as Entry, ...prev]);
      setShowCreate(false);
      setForm(EMPTY_FORM);
    }
    setSaving(false);
  }

  async function deleteEntry(id: string) {
    setDeletingId(id);
    await supabase.from("cashbook_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
  }

  function exportCSV() {
    const rows = [
      ["Date", "Type", "Description", "Category", "Reference", "Amount"],
      ...entries.map((e) => [e.entry_date, e.type, e.description, e.category ?? "", e.reference ?? "", e.amount.toString()]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cashbook-${fromDate}-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="flex-1 p-5 space-y-4">
      {/* Date range */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <button onClick={applyRange} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition">Apply</button>
        <div className="ml-auto flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm">
            <Plus className="w-4 h-4" /> Add Entry
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 flex items-center gap-1"><ArrowUpCircle className="w-3.5 h-3.5 text-green-500" /> Total Income</p>
          <p className="text-xl font-bold text-green-600 mt-1">{fmt(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 flex items-center gap-1"><ArrowDownCircle className="w-3.5 h-3.5 text-red-500" /> Total Expenses</p>
          <p className="text-xl font-bold text-red-500 mt-1">{fmt(totalExpense)}</p>
        </div>
        <div className={cn("rounded-xl border p-4 shadow-sm", balance >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
          <p className="text-xs text-slate-500">Net Balance</p>
          <p className={cn("text-xl font-bold mt-1", balance >= 0 ? "text-green-700" : "text-red-600")}>{fmt(balance)}</p>
        </div>
      </div>

      {/* Entries table */}
      {entries.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-[#0F172A]">No entries for this period</p>
          <p className="text-xs text-slate-400">Add income or expense entries to track your cash flow</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Description</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Ref</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 transition group">
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{e.entry_date}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {e.type === "income"
                        ? <ArrowUpCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        : <ArrowDownCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                      <span className="text-sm text-[#0F172A]">{e.description}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">{e.category ?? <span className="text-slate-200">—</span>}</td>
                  <td className="px-5 py-3 text-xs text-slate-400 font-mono">{e.reference ?? <span className="text-slate-200">—</span>}</td>
                  <td className={cn("px-5 py-3 text-right text-sm font-bold", e.type === "income" ? "text-green-600" : "text-red-500")}>
                    {e.type === "income" ? "+" : "-"}{fmt(e.amount)}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => deleteEntry(e.id)}
                      disabled={deletingId === e.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
              <h3 className="text-base font-bold text-[#0F172A]">Add Cashbook Entry</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type toggle */}
            <div className="flex gap-2">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t, category: "" })}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-semibold transition",
                    form.type === t
                      ? t === "income" ? "bg-green-600 text-white" : "bg-red-500 text-white"
                      : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {t === "income" ? "Income" : "Expense"}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description *</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this for?" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Amount *</label>
                  <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                  <input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">— None —</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Reference</label>
                <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Receipt no., invoice no., etc." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={save} disabled={saving || !form.amount || !form.description.trim()} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                {saving ? "Saving..." : "Add Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
