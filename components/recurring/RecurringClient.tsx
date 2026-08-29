"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Plus, RefreshCw, Pause, Play, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Schedule {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  next_issue_date: string;
  last_issued_at: string | null;
  status: "active" | "paused" | "cancelled";
  auto_send: boolean;
  customers: { name: string } | null;
}

interface Customer { id: string; name: string; }

interface Props {
  schedules: Schedule[];
  customers: Customer[];
  currency: string;
  businessId: string;
  userId: string;
}

const FREQ_LABELS: Record<string, string> = { weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" };

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const EMPTY_FORM = {
  name: "",
  description: "",
  customer_id: "",
  amount: "",
  frequency: "monthly" as Schedule["frequency"],
  next_issue_date: new Date().toISOString().split("T")[0],
  auto_send: false,
};

export function RecurringClient({ schedules: initial, customers, currency, businessId, userId }: Props) {
  const supabase = createClient();
  const fmt = (n: number) => formatCurrency(n, currency);
  const [schedules, setSchedules] = useState<Schedule[]>(initial);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!form.name.trim() || !form.amount) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("recurring_invoices")
      .insert({
        business_id: businessId,
        customer_id: form.customer_id || null,
        name: form.name.trim(),
        description: form.description.trim() || null,
        amount: parseFloat(form.amount),
        frequency: form.frequency,
        next_issue_date: form.next_issue_date,
        status: "active",
        auto_send: form.auto_send,
        created_by: userId,
      })
      .select("*, customers(name)")
      .single();
    if (!error && data) {
      setSchedules((p) => [...p, data as Schedule]);
      setShowCreate(false);
      setForm(EMPTY_FORM);
    }
    setSaving(false);
  }

  async function toggleStatus(id: string, current: string) {
    const status = current === "active" ? "paused" : "active";
    await supabase.from("recurring_invoices").update({ status }).eq("id", id);
    setSchedules((p) => p.map((s) => (s.id === id ? { ...s, status: status as Schedule["status"] } : s)));
  }

  async function cancel(id: string) {
    await supabase.from("recurring_invoices").update({ status: "cancelled" }).eq("id", id);
    setSchedules((p) => p.map((s) => (s.id === id ? { ...s, status: "cancelled" } : s)));
  }

  async function issueNow(schedule: Schedule) {
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("recurring_invoices").update({ last_issued_at: new Date().toISOString(), next_issue_date: advanceDate(schedule.next_issue_date, schedule.frequency) }).eq("id", schedule.id);
    setSchedules((p) => p.map((s) => s.id === schedule.id ? { ...s, last_issued_at: new Date().toISOString() } : s));
  }

  function advanceDate(date: string, freq: string): string {
    const d = new Date(date + "T00:00:00");
    if (freq === "weekly") d.setDate(d.getDate() + 7);
    else if (freq === "monthly") d.setMonth(d.getMonth() + 1);
    else if (freq === "quarterly") d.setMonth(d.getMonth() + 3);
    else d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  }

  const active = schedules.filter((s) => s.status === "active");
  const totalMonthly = active.filter((s) => s.frequency === "monthly").reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="flex-1 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Recurring Billing Schedules</h2>
          {totalMonthly > 0 && <p className="text-xs text-slate-400 mt-0.5">{fmt(totalMonthly)}/month from monthly schedules</p>}
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm">
          <Plus className="w-4 h-4" /> New Schedule
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center gap-3">
          <RefreshCw className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-semibold text-[#0F172A]">No recurring schedules yet</p>
          <p className="text-xs text-slate-400">Automate recurring billing for retainers, subscriptions, or memberships</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-5 py-3">Frequency</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Next Issue</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {schedules.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition group">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-[#0F172A]">{s.name}</p>
                    {s.description && <p className="text-xs text-slate-400">{s.description}</p>}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{s.customers?.name ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{FREQ_LABELS[s.frequency]}</td>
                  <td className="px-5 py-3 text-right font-bold text-[#0F172A]">{fmt(s.amount)}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{s.next_issue_date}</td>
                  <td className="px-5 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", STATUS_STYLES[s.status])}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition justify-end">
                      {s.status !== "cancelled" && (
                        <>
                          <button onClick={() => issueNow(s)} title="Issue now" className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => toggleStatus(s.id, s.status)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition">
                            {s.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => cancel(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                            <Trash2 className="w-3.5 h-3.5" />
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

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">New Recurring Schedule</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Monthly Retainer" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Customer</label>
                <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">— None —</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Amount *</label>
                  <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Frequency</label>
                  <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as Schedule["frequency"] })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">First Issue Date</label>
                <input type="date" value={form.next_issue_date} onChange={(e) => setForm({ ...form, next_issue_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={create} disabled={saving || !form.name.trim() || !form.amount} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                {saving ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
