"use client";

import { useState, useRef } from "react";
import { Plus, Receipt, Trash2, Search, SlidersHorizontal, ChevronDown, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expense-categories";
import { cn } from "@/lib/utils";

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
  title:        z.string().min(1, "Title is required"),
  category:     z.string().min(1, "Category is required"),
  amount:       z.coerce.number().min(0.01, "Amount must be greater than 0"),
  expense_date: z.string().min(1, "Date is required"),
  description:  z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const innerCls = "w-full text-sm bg-transparent focus:outline-none text-[#0F172A] placeholder:text-slate-400 pt-0.5 pb-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-slate-200 rounded-[8px] px-3 pt-0 pb-2 focus-within:border-[#1a9c38] transition">
      <legend className="text-[11px] font-medium text-slate-600 px-1 ml-0.5 leading-none">{label}</legend>
      {children}
    </fieldset>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

export function ExpensesClient({ expenses, businessId, currency, userId }: Props) {
  const router = useRouter();
  const fmt = (n: number) => formatCurrency(n, currency);

  const [showForm, setShowForm]         = useState(false);
  const [search, setSearch]             = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterOpen, setFilterOpen]     = useState(false);
  const [deleting, setDeleting]         = useState<string | null>(null);
  const filterRef                       = useRef<HTMLDivElement>(null);

  const filtered = expenses.filter((e) => {
    const cat = EXPENSE_CATEGORIES.find((c) => c.value === e.category);
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (cat?.label ?? e.category).toLowerCase().includes(search.toLowerCase()) ||
      (e.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0);

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
      business_id:  businessId,
      category:     data.category,
      title:        data.title,
      amount:       data.amount,
      description:  data.description || null,
      expense_date: data.expense_date,
      recorded_by:  userId,
    });
    reset({ expense_date: new Date().toISOString().split("T")[0], category: "other" });
    setShowForm(false);
    router.refresh();
  }

  const activeFilterLabel = filterCategory === "all"
    ? "All"
    : EXPENSE_CATEGORIES.find((c) => c.value === filterCategory)?.label ?? "All";

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-6 space-y-4">

      {/* Search + Filter + New */}
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
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={cn(
              "h-full flex items-center gap-1 px-3 border rounded-[8px] text-[13px] font-semibold transition",
              filterCategory !== "all"
                ? "border-[#1a9c38] text-[#1a9c38] bg-emerald-50"
                : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-[10px] shadow-lg z-20 overflow-hidden py-1 max-h-72 overflow-y-auto">
              <button
                onClick={() => { setFilterCategory("all"); setFilterOpen(false); }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-[13px] font-medium transition",
                  filterCategory === "all" ? "bg-emerald-50 text-[#1a9c38] font-semibold" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                All categories
              </button>
              {EXPENSE_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setFilterCategory(c.value); setFilterOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-[13px] font-medium transition flex items-center gap-2",
                    filterCategory === c.value ? "bg-emerald-50 text-[#1a9c38] font-semibold" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span>{c.icon}</span> {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="h-full flex items-center gap-1.5 px-3 bg-[#1a9c38] hover:bg-green-700 text-white rounded-[8px] text-[13px] font-semibold transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        )}
      </div>

      {/* Total stat */}
      <div className="border border-slate-200 rounded-[8px] px-4 py-3 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-slate-500">
          {filterCategory === "all" ? "Total Expenses" : `${activeFilterLabel} Total`}
        </p>
        <p className="text-[20px] font-extrabold text-red-500 leading-none">{fmt(totalExpenses)}</p>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="border border-slate-200 rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-[13px] font-semibold text-[#0F172A]">Log Expense</span>
            <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-600 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-4 pt-4 pb-3 space-y-4">
              <SectionDivider label="Details" />
              <div className="space-y-3">
                <Field label="Title *">
                  <input
                    {...register("title")}
                    placeholder="e.g. Monthly rent"
                    className={innerCls}
                  />
                  {errors.title && <p className="text-[11px] text-red-500 -mt-1">{errors.title.message}</p>}
                </Field>
                <Field label="Category *">
                  <select {...register("category")} className={`${innerCls} -ml-0.5`}>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Description">
                  <textarea
                    {...register("description")}
                    rows={2}
                    placeholder="Optional details..."
                    className={`${innerCls} resize-none`}
                  />
                </Field>
              </div>

              <SectionDivider label="Amount & Date" />
              <div className="space-y-3">
                <Field label={`Amount (${currency}) *`}>
                  <input
                    {...register("amount")}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={innerCls}
                  />
                  {errors.amount && <p className="text-[11px] text-red-500 -mt-1">{errors.amount.message}</p>}
                </Field>
                <Field label="Date *">
                  <input
                    {...register("expense_date")}
                    type="date"
                    className={innerCls}
                  />
                </Field>
              </div>
            </div>

            <div className="px-4 pb-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="py-2.5 px-4 border border-slate-200 rounded-[8px] text-[14px] text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1a9c38] hover:bg-green-700 text-white py-2.5 rounded-[8px] text-[14px] font-semibold transition disabled:opacity-50 shadow-sm shadow-green-900/20"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Log Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses list */}
      {filtered.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Receipt className="w-9 h-9 text-slate-300" />
          </div>
          <p className="text-[16px] font-bold text-slate-800">
            {search || filterCategory !== "all" ? "No expenses found" : "No expenses yet"}
          </p>
          <p className="text-[13px] text-slate-400 mt-1.5 max-w-xs">
            {search || filterCategory !== "all" ? "Try a different search or filter" : "Start tracking your business expenses"}
          </p>
        </div>
      ) : filtered.length > 0 && (
        <>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            {filtered.length} expense{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="bg-white rounded-[8px] border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {filtered.map((expense) => {
              const cat = EXPENSE_CATEGORIES.find((c) => c.value === expense.category);
              return (
                <div key={expense.id} className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center mt-0.5 text-[18px]">
                      {cat?.icon ?? "💸"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-[15px] text-slate-900 leading-tight truncate">{expense.title}</p>
                        <span className="text-[15px] font-extrabold text-red-500 leading-tight flex-shrink-0">{fmt(expense.amount)}</span>
                      </div>
                      <p className="text-[12px] text-slate-400 mt-0.5">
                        {cat?.label ?? expense.category}
                        <span className="mx-1.5">·</span>
                        <span suppressHydrationWarning>{shortDate(expense.expense_date)}</span>
                      </p>
                      {expense.description && (
                        <p className="text-[12px] text-slate-400 mt-0.5 italic line-clamp-1">{expense.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pl-[52px]">
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      disabled={deleting === expense.id}
                      className="flex items-center gap-1.5 text-[13px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg transition active:scale-95 disabled:opacity-50"
                    >
                      {deleting === expense.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Trash2 className="w-3 h-3" />}
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
