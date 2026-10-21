"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import {
  Target, Plus, Trash2,
  CheckCircle2, X, Loader2, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  REVENUE_MILESTONES, SALES_MILESTONES, TOTAL_MILESTONES,
  computeMilestones, type ComputedMilestone,
} from "@/lib/milestones";

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
  userId: string;
  revenueThisMonth: number;
  transactionsThisMonth: number;
  monthStart: string;
  monthEnd: string;
  allTimeRevenue: number;
  allTimeSalesCount: number;
}

const PERIOD_LABELS: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", monthly: "Monthly", custom: "Custom",
};

const innerCls = "w-full text-sm bg-transparent focus:outline-none text-[#0F172A] placeholder:text-slate-400 pt-0.5 pb-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-slate-200 rounded-[8px] px-3 pt-0 pb-2 focus-within:border-primary transition">
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

function MilestoneRow({ m, fmt, isRevenue }: { m: ComputedMilestone; fmt: (n: number) => string; isRevenue: boolean }) {
  return (
    <div className={cn("px-4 py-3", m.status === "future" && "opacity-40")}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          m.status === "achieved" ? "bg-primary-soft" :
          m.status === "next"     ? "bg-amber-50"   : "bg-slate-50"
        )}>
          {m.status === "future"
            ? <Lock className="w-4 h-4 text-slate-300" />
            : <span className="text-xl leading-none">{m.emoji}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-[#0F172A] truncate">{m.label}</span>
            {m.status === "achieved" && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded-full flex-shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            )}
            {m.status === "next" && (
              <span className="text-[12px] font-extrabold text-amber-500 flex-shrink-0">
                {Math.round(m.progress)}%
              </span>
            )}
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5">
            {isRevenue ? fmt(m.value) : `${m.value.toLocaleString()} sales`}
          </p>
          {m.status === "next" && (
            <>
              <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${m.progress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isRevenue ? fmt(m.current) : m.current.toLocaleString()} of{" "}
                {isRevenue ? fmt(m.value) : m.value.toLocaleString()}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
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
  allTimeRevenue,
  allTimeSalesCount,
}: Props) {
  const supabase = createClient();
  const fmt = (n: number) => formatCurrency(n, currency);

  const [targets, setTargets] = useState<SalesTarget[]>(initialTargets);
  const [showForm, setShowForm] = useState(false);
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
      setShowForm(false);
      resetForm();
    }
  }

  async function deleteTarget(id: string) {
    setDeletingId(id);
    await supabase.from("sales_targets").update({ is_active: false }).eq("id", id);
    setTargets((prev) => prev.filter((t) => t.id !== id));
    setDeletingId(null);
  }

  const revenueMilestones = computeMilestones(REVENUE_MILESTONES, allTimeRevenue);
  const salesMilestones   = computeMilestones(SALES_MILESTONES, allTimeSalesCount);
  const revAchieved   = revenueMilestones.filter((m) => m.status === "achieved").length;
  const salesAchieved = salesMilestones.filter((m) => m.status === "achieved").length;
  const totalAchieved = revAchieved + salesAchieved;

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 pt-4 pb-6 space-y-5">

      {/* This month snapshot */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-slate-200 rounded-[8px] px-4 py-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Revenue</p>
          <p className="text-[17px] font-extrabold text-primary leading-tight mt-0.5">{fmt(revenueThisMonth)}</p>
          <p className="text-[11px] text-slate-400">This month</p>
        </div>
        <div className="border border-slate-200 rounded-[8px] px-4 py-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sales</p>
          <p className="text-[28px] font-extrabold text-[#0F172A] leading-tight mt-0.5">{transactionsThisMonth}</p>
          <p className="text-[11px] text-slate-400">This month</p>
        </div>
      </div>

      {/* Growth milestones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Growth Milestones</p>
          <span className="text-[12px] font-semibold text-slate-400">{totalAchieved}/{TOTAL_MILESTONES} achieved</span>
        </div>

        {/* Revenue milestones */}
        <div className="border border-slate-200 rounded-[12px] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#0F172A]">Revenue</span>
            <span className="text-[12px] font-bold text-primary">{revAchieved}/{REVENUE_MILESTONES.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {revenueMilestones.map((m) => (
              <MilestoneRow key={m.key} m={m} fmt={fmt} isRevenue={true} />
            ))}
          </div>
        </div>

        {/* Sales milestones */}
        <div className="border border-slate-200 rounded-[12px] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#0F172A]">Sales Count</span>
            <span className="text-[12px] font-bold text-primary">{salesAchieved}/{SALES_MILESTONES.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {salesMilestones.map((m) => (
              <MilestoneRow key={m.key} m={m} fmt={fmt} isRevenue={false} />
            ))}
          </div>
        </div>
      </div>

      {/* My Targets */}
      <div className="space-y-3">
        <p className="text-xs font-extrabold text-slate-900 uppercase tracking-wider px-1">My Targets</p>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 h-11 border-2 border-dashed border-slate-200 rounded-[8px] text-[13px] font-semibold text-slate-400 hover:border-primary hover:text-primary transition"
          >
            <Plus className="w-4 h-4" /> Add Target
          </button>
        )}

        {showForm && (
          <div className="border border-slate-200 rounded-[12px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-[13px] font-semibold text-[#0F172A]">New Target</span>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 text-slate-400 hover:text-slate-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 pt-4 pb-3 space-y-4">
              <SectionDivider label="Target Details" />
              <div className="space-y-3">
                <Field label="Target name *">
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. September Revenue Goal"
                    className={innerCls}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Type">
                    <select
                      value={form.target_type}
                      onChange={(e) => setForm({ ...form, target_type: e.target.value as SalesTarget["target_type"] })}
                      className={`${innerCls} -ml-0.5`}
                    >
                      <option value="revenue">Revenue</option>
                      <option value="transactions">Transactions</option>
                      <option value="units">Units Sold</option>
                    </select>
                  </Field>
                  <Field label="Period">
                    <select
                      value={form.period}
                      onChange={(e) => setForm({ ...form, period: e.target.value as SalesTarget["period"] })}
                      className={`${innerCls} -ml-0.5`}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </Field>
                </div>
                <Field label={`Target value ${form.target_type === "revenue" ? `(${currency})` : "(count)"}`}>
                  <input
                    type="number"
                    min="0"
                    value={form.target_value}
                    onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                    placeholder="0"
                    className={innerCls}
                  />
                </Field>
              </div>
              <SectionDivider label="Date Range" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start date">
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={innerCls} />
                </Field>
                <Field label="End date">
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={innerCls} />
                </Field>
              </div>
            </div>
            <div className="px-4 pb-4 flex gap-3">
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="py-2.5 px-4 border border-slate-200 rounded-[8px] text-[14px] text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={createTarget}
                disabled={saving || !form.name.trim() || !form.target_value}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-ember-deep text-on-primary py-2.5 rounded-[8px] text-[14px] font-semibold transition disabled:opacity-50 shadow-sm shadow-ember/20"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Target
              </button>
            </div>
          </div>
        )}

        {targets.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Target className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-[15px] font-bold text-slate-800">No targets yet</p>
            <p className="text-[13px] text-slate-400 mt-1">Add a target to track your sales goals</p>
          </div>
        )}

        {targets.length > 0 && (
          <div className="bg-white rounded-[8px] border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {targets.map((target) => {
              const current = target.target_type === "revenue" ? revenueThisMonth : transactionsThisMonth;
              const progress = Math.min(100, (current / target.target_value) * 100);
              const achieved = progress >= 100;
              const isRevenue = target.target_type === "revenue";

              return (
                <div key={target.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-[#0F172A] truncate">{target.name}</p>
                        {achieved && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                      </div>
                      <p className="text-[12px] text-slate-400 mt-0.5">
                        {PERIOD_LABELS[target.period]} · {target.start_date} → {target.end_date}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteTarget(target.id)}
                      disabled={deletingId === target.id}
                      className="text-red-400 bg-red-50 hover:bg-red-100 border border-red-100 p-1.5 rounded-lg transition active:scale-95 disabled:opacity-50 flex-shrink-0 mt-0.5"
                    >
                      {deletingId === target.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Trash2 className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-500">
                        {isRevenue ? fmt(current) : current.toLocaleString()} of{" "}
                        {isRevenue ? fmt(target.target_value) : target.target_value.toLocaleString()}
                      </span>
                      <span className={cn("text-[13px] font-extrabold",
                        achieved ? "text-primary" : progress > 66 ? "text-amber-500" : "text-blue-500"
                      )}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500",
                          achieved ? "bg-primary" : progress > 66 ? "bg-amber-400" : "bg-blue-400"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {achieved
                      ? <p className="text-[12px] text-primary font-semibold">Target achieved!</p>
                      : <p className="text-[12px] text-slate-400">
                          {isRevenue
                            ? `${fmt(target.target_value - current)} remaining`
                            : `${(target.target_value - current).toLocaleString()} remaining`}
                        </p>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
