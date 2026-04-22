"use client";

import { useState } from "react";
import { Plus, Receipt, Trash2, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expense-categories";
import { X, Loader2 } from "lucide-react";

interface Expense {
  id: string;
  category: string;
  title: string;
  amount: number;
  description: string | null;
  expense_date: string;
  created_at: string;
}

interface Props {
  expenses: Expense[];
  businessId: string;
  currency: string;
  userId: string;
}

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  expense_date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function ExpensesClient({ expenses, businessId, currency, userId }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fmt = (n: number) => formatCurrency(n, currency);

  const filtered = expenses.filter((e) =>
    filterCategory === "all" ? true : e.category === filterCategory
  );

  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0);

  const categoryTotals = EXPENSE_CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses.filter((e) => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0);

  function exportCSV() {
    const headers = ["Title", "Category", "Date", "Amount", "Description"];
    const rows = filtered.map((e) => {
      const cat = EXPENSE_CATEGORIES.find((c) => c.value === e.category);
      return [
        e.title,
        cat?.label ?? e.category,
        e.expense_date,
        e.amount.toFixed(2),
        e.description ?? "",
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteExpense(id: string) {
    setDeleting(id);
    const supabase = createClient();
    await supabase.from("expenses").delete().eq("id", id);
    router.refresh();
    setDeleting(null);
  }

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      expense_date: new Date().toISOString().split("T")[0],
      category: "other",
    },
  });

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    await supabase.from("expenses").insert({
      business_id: businessId,
      category: data.category,
      title: data.title,
      amount: data.amount,
      description: data.description || null,
      expense_date: data.expense_date,
      recorded_by: userId,
    });
    reset({ expense_date: new Date().toISOString().split("T")[0], category: "other" });
    setShowForm(false);
    router.refresh();
  }

  return (
    <div className="flex-1 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 bg-white"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm shadow-green-300/40"
          >
            <Plus className="w-4 h-4" />
            Log Expense
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-1 bg-white rounded-xl border border-red-100 p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Expenses</p>
          <p className="font-numeric text-xl font-bold text-red-500 mt-1">{fmt(totalExpenses)}</p>
          <p className="text-xs text-slate-400">{filtered.length} records</p>
        </div>
        {categoryTotals.slice(0, 3).map((cat) => (
          <div key={cat.value} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500">{cat.icon} {cat.label}</p>
            <p className="font-numeric text-base font-bold text-[#0F172A] mt-1">{fmt(cat.total)}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Receipt className="w-14 h-14 text-slate-200 mb-4" />
          <p className="text-slate-600 font-medium">No expenses recorded</p>
          <p className="text-slate-400 text-sm mt-1">Start tracking your business expenses</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                <th className="text-left px-4 py-3">Expense</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Date</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((expense) => {
                const cat = EXPENSE_CATEGORIES.find((c) => c.value === expense.category);
                return (
                  <tr key={expense.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#0F172A]">{expense.title}</p>
                      {expense.description && (
                        <p className="text-xs text-slate-400 truncate max-w-[180px]">{expense.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {cat?.icon} {cat?.label ?? expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-numeric text-sm font-semibold text-red-500">{fmt(expense.amount)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        disabled={deleting === expense.id}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add expense modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-[#0F172A]">Log Expense</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Title *</label>
                <input {...register("title")} placeholder="e.g. Monthly rent" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Category *</label>
                  <select {...register("category")} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Date *</label>
                  <input {...register("expense_date")} type="date" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Amount *</label>
                <input {...register("amount")} type="number" step="0.01" min="0" placeholder="0.00" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-numeric" />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea {...register("description")} rows={2} placeholder="Details..." className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm shadow-green-300/40">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Log expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
