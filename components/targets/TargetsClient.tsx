"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Target, Plus, Trash2, TrendingUp, ShoppingCart, DollarSign, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesTarget {
  id: string;
  name: string;
  period: "daily" | "weekly" | "monthly" | "custom";
  target_type: "revenue" | "units" | "transactions";
  target_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Props {
  targets: SalesTarget[];
  currency: string;
  businessId: string;
  businessSlug: string;
  userId: string;
  revenueThisMonth: number;
  transactionsThisMonth: number;
  monthStart: string;
  monthEnd: string;
}

const PERIOD_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  custom: "Custom",
};

const TYPE_ICONS: Record<string, typeof DollarSign> = {
  revenue: DollarSign,
  units: ShoppingCart,
  transactions: TrendingUp,
};

function getProgress(target: SalesTarget, revenue: number, transactions: number): number {
  const current = target.target_type === "revenue" ? revenue : transactions;
  return Math.min(100, (current / target.target_value) * 100);
}

function getCurrentValue(target: SalesTarget, revenue: number, transactions: number): number {
  return target.target_type === "revenue" ? revenue : transactions;
}

export function TargetsClient({
  targets: initialTargets,
  currency,
  businessId,
  userId,
  revenueThisMonth,
  transactionsThisMonth,
  monthStart,
  monthEnd,
}: Props) {
  const supabase = createClient();
  const fmt = (n: number) => formatCurrency(n, currency);

  const [targets, setTargets] = useState<SalesTarget[]>(initialTargets);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    period: "monthly" as SalesTarget["period"],
    target_type: "revenue" as SalesTarget["target_type"],
    target_value: "",
    start_date: monthStart,
    end_date: monthEnd,
  });

  function resetForm() {
    setForm({ name: "", period: "monthly", target_type: "revenue", target_value: "", start_date: monthStart, end_date: monthEnd });
    setShowCreate(false);
  }

  async function createTarget() {
    if (!form.name.trim() || !form.target_value) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("sales_targets")
      .insert({
        business_id: businessId,
        name: form.name.trim(),
        period: form.period,
        target_type: form.target_type,
        target_value: parseFloat(form.target_value),
        start_date: form.start_date,
        end_date: form.end_date,
        is_active: true,
        created_by: userId,
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setTargets((prev) => [data as SalesTarget, ...prev]);
      resetForm();
    }
  }

  async function deleteTarget(id: string) {
    setDeletingId(id);
    await supabase.from("sales_targets").update({ is_active: false }).eq("id", id);
    setTargets((prev) => prev.filter((t) => t.id !== id));
    setDeletingId(null);
  }

  const activeTargets = targets.filter((t) => t.is_active);

  return (
    <div className="flex-1 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Active Targets</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track progress toward your sales goals</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Target
        </button>
      </div>

      {/* Month summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500">Revenue This Month</p>
          <p className="font-numeric text-2xl font-bold text-[#0F172A] mt-1">{fmt(revenueThisMonth)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500">Transactions This Month</p>
          <p className="font-numeric text-2xl font-bold text-[#0F172A] mt-1">{transactionsThisMonth}</p>
        </div>
      </div>

      {/* Targets list */}
      {activeTargets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <Target className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">No targets yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Create a target to start tracking your goals</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTargets.map((target) => {
            const progress = getProgress(target, revenueThisMonth, transactionsThisMonth);
            const current = getCurrentValue(target, revenueThisMonth, transactionsThisMonth);
            const isRevenue = target.target_type === "revenue";
            const achieved = progress >= 100;
            const Icon = TYPE_ICONS[target.target_type];

            return (
              <div key={target.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", achieved ? "bg-green-100" : "bg-slate-100")}>
                      <Icon className={cn("w-5 h-5", achieved ? "text-green-600" : "text-slate-500")} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#0F172A] truncate">{target.name}</p>
                        {achieved && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {PERIOD_LABELS[target.period]} · {target.start_date} → {target.end_date}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTarget(target.id)}
                    disabled={deletingId === target.id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {isRevenue ? fmt(current) : current.toLocaleString()} of{" "}
                      {isRevenue ? fmt(target.target_value) : target.target_value.toLocaleString()}
                    </span>
                    <span className={cn("font-bold", achieved ? "text-green-600" : "text-slate-700")}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", achieved ? "bg-green-500" : progress > 66 ? "bg-amber-500" : "bg-blue-500")}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {!achieved && (
                    <p className="text-xs text-slate-400">
                      {isRevenue
                        ? `${fmt(target.target_value - current)} remaining`
                        : `${(target.target_value - current).toLocaleString()} remaining`}
                    </p>
                  )}
                  {achieved && <p className="text-xs text-green-600 font-medium">Target achieved!</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">New Sales Target</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Target Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. August Revenue Goal"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Period</label>
                  <select
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value as SalesTarget["period"] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Target Type</label>
                  <select
                    value={form.target_type}
                    onChange={(e) => setForm({ ...form, target_type: e.target.value as SalesTarget["target_type"] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="revenue">Revenue</option>
                    <option value="transactions">Transactions</option>
                    <option value="units">Units Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Target Value {form.target_type === "revenue" ? `(${currency})` : "(count)"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.target_value}
                  onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={createTarget}
                disabled={saving || !form.name.trim() || !form.target_value}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Create Target"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
