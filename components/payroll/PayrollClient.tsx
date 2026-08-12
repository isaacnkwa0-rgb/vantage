"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Plus, Users, Play, CheckCircle, FileText, X, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffMember {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  salary_type: "monthly" | "weekly" | "daily" | "hourly";
  salary_amount: number;
  bank_name: string | null;
  account_number: string | null;
  joined_at: string;
}

interface PayrollEntry {
  id: string;
  staff_id: string | null;
  staff_name: string;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  paid_at: string | null;
  notes: string | null;
}

interface PayrollRun {
  id: string;
  period_label: string;
  period_start: string;
  period_end: string;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  status: "draft" | "approved" | "paid";
  payroll_entries: PayrollEntry[];
}

interface Props {
  staff: StaffMember[];
  runs: PayrollRun[];
  currency: string;
  businessId: string;
  userId: string;
}

const SALARY_LABELS = { monthly: "Monthly", weekly: "Weekly", daily: "Daily", hourly: "Hourly" };
const STATUS_STYLES = { draft: "bg-slate-100 text-slate-500", approved: "bg-amber-100 text-amber-700", paid: "bg-green-100 text-green-700" };
interface StaffForm { name: string; role: string; email: string; phone: string; salary_type: StaffMember["salary_type"]; salary_amount: number; bank_name: string; account_number: string; joined_at: string; }
const EMPTY_STAFF: StaffForm = { name: "", role: "", email: "", phone: "", salary_type: "monthly", salary_amount: 0, bank_name: "", account_number: "", joined_at: new Date().toISOString().split("T")[0] };

export function PayrollClient({ staff: initial, runs: initialRuns, currency, businessId, userId }: Props) {
  const supabase = createClient();
  const fmt = (n: number) => formatCurrency(n, currency);
  const [staff, setStaff] = useState<StaffMember[]>(initial);
  const [runs, setRuns] = useState<PayrollRun[]>(initialRuns);
  const [tab, setTab] = useState<"staff" | "runs">("staff");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>({ ...EMPTY_STAFF });
  const [saving, setSaving] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [runForm, setRunForm] = useState({
    period_label: "",
    period_start: new Date().toISOString().split("T")[0],
    period_end: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [runEntries, setRunEntries] = useState<{ staffId: string; name: string; gross: string; deductions: string }[]>([]);

  async function saveStaff() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editingId) {
      await supabase.from("staff").update({ ...form, salary_amount: Number(form.salary_amount) }).eq("id", editingId);
      setStaff((p) => p.map((s) => s.id === editingId ? { ...s, ...form, salary_amount: Number(form.salary_amount) } : s));
    } else {
      const { data } = await supabase.from("staff").insert({ business_id: businessId, ...form, salary_amount: Number(form.salary_amount) }).select().single();
      if (data) setStaff((p) => [...p, data as StaffMember]);
    }
    setShowAddStaff(false);
    setEditingId(null);
    setForm({ ...EMPTY_STAFF });
    setSaving(false);
  }

  function openEdit(s: StaffMember) {
    setForm({ name: s.name, role: s.role ?? "", email: s.email ?? "", phone: s.phone ?? "", salary_type: s.salary_type, salary_amount: s.salary_amount, bank_name: s.bank_name ?? "", account_number: s.account_number ?? "", joined_at: s.joined_at });
    setEditingId(s.id);
    setShowAddStaff(true);
  }

  async function removeStaff(id: string) {
    await supabase.from("staff").update({ is_active: false }).eq("id", id);
    setStaff((p) => p.filter((s) => s.id !== id));
  }

  function openRunModal() {
    setRunEntries(staff.map((s) => ({ staffId: s.id, name: s.name, gross: String(s.salary_amount), deductions: "0" })));
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    setRunForm({ period_label: `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`, period_start: start, period_end: end, notes: "" });
    setShowRunModal(true);
  }

  async function createRun() {
    if (!runForm.period_label.trim() || runEntries.length === 0) return;
    setSaving(true);
    const entries = runEntries.map((e) => ({ gross: parseFloat(e.gross) || 0, deductions: parseFloat(e.deductions) || 0, net: (parseFloat(e.gross) || 0) - (parseFloat(e.deductions) || 0), staffId: e.staffId, name: e.name }));
    const totalGross = entries.reduce((sum, e) => sum + e.gross, 0);
    const totalDed = entries.reduce((sum, e) => sum + e.deductions, 0);
    const totalNet = totalGross - totalDed;

    const { data: run } = await supabase.from("payroll_runs").insert({ business_id: businessId, period_label: runForm.period_label, period_start: runForm.period_start, period_end: runForm.period_end, total_gross: totalGross, total_deductions: totalDed, total_net: totalNet, notes: runForm.notes || null, created_by: userId }).select().single();
    if (!run) { setSaving(false); return; }

    const entryRows = entries.map((e) => ({ run_id: run.id, business_id: businessId, staff_id: e.staffId || null, staff_name: e.name, gross_pay: e.gross, deductions: e.deductions, net_pay: e.net }));
    const { data: insertedEntries } = await supabase.from("payroll_entries").insert(entryRows).select();
    setRuns((p) => [{ ...run, payroll_entries: (insertedEntries ?? []) as PayrollEntry[] } as PayrollRun, ...p]);
    setShowRunModal(false);
    setTab("runs");
    setSaving(false);
  }

  async function updateRunStatus(id: string, status: PayrollRun["status"]) {
    await supabase.from("payroll_runs").update({ status }).eq("id", id);
    setRuns((p) => p.map((r) => r.id === id ? { ...r, status } : r));
  }

  const totalMonthlyPayroll = staff.filter((s) => s.salary_type === "monthly").reduce((sum, s) => sum + s.salary_amount, 0);

  return (
    <div className="flex-1 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Staff Payroll</h2>
          {totalMonthlyPayroll > 0 && <p className="text-xs text-slate-400 mt-0.5">Monthly payroll: {fmt(totalMonthlyPayroll)}</p>}
        </div>
        <div className="flex items-center gap-2">
          {tab === "staff" && (
            <button onClick={() => { setForm({ ...EMPTY_STAFF }); setEditingId(null); setShowAddStaff(true); }} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">
              <Plus className="w-4 h-4" /> Add Staff
            </button>
          )}
          {staff.length > 0 && (
            <button onClick={openRunModal} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm">
              <Play className="w-4 h-4" /> Run Payroll
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([["staff", "Staff Members"], ["runs", "Payroll Runs"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition", tab === key ? "bg-white text-[#0F172A] shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            {label}
            {key === "runs" && runs.length > 0 && <span className="ml-1.5 text-xs text-slate-400">({runs.length})</span>}
          </button>
        ))}
      </div>

      {/* Staff tab */}
      {tab === "staff" && (
        staff.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-3 text-center">
            <Users className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-semibold text-[#0F172A]">No staff members yet</p>
            <p className="text-xs text-slate-400">Add staff to start running payroll</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                  <th className="text-left px-5 py-3">Name / Role</th>
                  <th className="text-left px-5 py-3">Salary</th>
                  <th className="text-left px-5 py-3">Bank</th>
                  <th className="text-left px-5 py-3">Joined</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition group">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-[#0F172A]">{s.name}</p>
                      {s.role && <p className="text-xs text-slate-400">{s.role}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-bold text-[#0F172A] font-numeric">{fmt(s.salary_amount)}</p>
                      <p className="text-xs text-slate-400">{SALARY_LABELS[s.salary_type]}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {s.bank_name ? <><p>{s.bank_name}</p>{s.account_number && <p className="font-mono">{s.account_number}</p>}</> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{s.joined_at}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition justify-end">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => removeStaff(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Runs tab */}
      {tab === "runs" && (
        runs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-3 text-center">
            <FileText className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-semibold text-[#0F172A]">No payroll runs yet</p>
            <p className="text-xs text-slate-400">Click "Run Payroll" to create your first payroll period</p>
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => (
              <div key={run.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-slate-50 transition" onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}>
                  <div className="flex items-center gap-3">
                    {expandedRun === run.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">{run.period_label}</p>
                      <p className="text-xs text-slate-400">{run.period_start} → {run.period_end} · {run.payroll_entries.length} staff</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", STATUS_STYLES[run.status])}>{run.status}</span>
                    <div className="text-right">
                      <p className="font-numeric text-sm font-bold text-[#0F172A]">{fmt(run.total_net)}</p>
                      <p className="text-xs text-slate-400">Net · Gross {fmt(run.total_gross)}</p>
                    </div>
                    {run.status === "draft" && (
                      <button onClick={(e) => { e.stopPropagation(); updateRunStatus(run.id, "approved"); }} className="flex items-center gap-1 px-2.5 py-1 text-xs text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-50 transition">
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                    )}
                    {run.status === "approved" && (
                      <button onClick={(e) => { e.stopPropagation(); updateRunStatus(run.id, "paid"); }} className="flex items-center gap-1 px-2.5 py-1 text-xs text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition">
                        <CheckCircle className="w-3 h-3" /> Mark Paid
                      </button>
                    )}
                  </div>
                </div>
                {expandedRun === run.id && (
                  <div className="border-t border-slate-100">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          <th className="text-left px-5 py-2">Staff</th>
                          <th className="text-right px-5 py-2">Gross</th>
                          <th className="text-right px-5 py-2">Deductions</th>
                          <th className="text-right px-5 py-2">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {run.payroll_entries.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50">
                            <td className="px-5 py-2 text-sm text-[#0F172A]">{e.staff_name}</td>
                            <td className="px-5 py-2 text-right text-sm font-numeric text-slate-600">{fmt(e.gross_pay)}</td>
                            <td className="px-5 py-2 text-right text-sm font-numeric text-red-500">{e.deductions > 0 ? `−${fmt(e.deductions)}` : "—"}</td>
                            <td className="px-5 py-2 text-right text-sm font-bold font-numeric text-[#0F172A]">{fmt(e.net_pay)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Add/Edit Staff modal */}
      {showAddStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">{editingId ? "Edit Staff Member" : "Add Staff Member"}</h3>
              <button onClick={() => setShowAddStaff(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Role / Position</label>
                  <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Cashier" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@email.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234 800 000 0000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Salary Amount</label>
                  <input type="number" min="0" value={form.salary_amount} onChange={(e) => setForm({ ...form, salary_amount: parseFloat(e.target.value) || 0 })} placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Salary Type</label>
                  <select value={form.salary_type} onChange={(e) => setForm({ ...form, salary_type: e.target.value as StaffMember["salary_type"] })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    {Object.entries(SALARY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bank Name</label>
                  <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="e.g. Zenith Bank" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Account Number</label>
                  <input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} placeholder="0123456789" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date Joined</label>
                <input type="date" value={form.joined_at} onChange={(e) => setForm({ ...form, joined_at: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAddStaff(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={saveStaff} disabled={saving || !form.name.trim()} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Update" : "Add Staff"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Payroll modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">Run Payroll</h3>
              <button onClick={() => setShowRunModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Period Label *</label>
                <input value={runForm.period_label} onChange={(e) => setRunForm({ ...runForm, period_label: e.target.value })} placeholder="e.g. August 2026" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Period Start</label>
                  <input type="date" value={runForm.period_start} onChange={(e) => setRunForm({ ...runForm, period_start: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Period End</label>
                  <input type="date" value={runForm.period_end} onChange={(e) => setRunForm({ ...runForm, period_end: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-2">Staff</th>
                      <th className="text-right px-4 py-2">Gross Pay</th>
                      <th className="text-right px-4 py-2">Deductions</th>
                      <th className="text-right px-4 py-2">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {runEntries.map((e, i) => {
                      const net = (parseFloat(e.gross) || 0) - (parseFloat(e.deductions) || 0);
                      return (
                        <tr key={e.staffId}>
                          <td className="px-4 py-2 text-sm text-[#0F172A]">{e.name}</td>
                          <td className="px-2 py-1">
                            <input type="number" min="0" value={e.gross} onChange={(ev) => setRunEntries((p) => p.map((r, ri) => ri === i ? { ...r, gross: ev.target.value } : r))} className="w-24 px-2 py-1 border border-slate-200 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500" />
                          </td>
                          <td className="px-2 py-1">
                            <input type="number" min="0" value={e.deductions} onChange={(ev) => setRunEntries((p) => p.map((r, ri) => ri === i ? { ...r, deductions: ev.target.value } : r))} className="w-20 px-2 py-1 border border-slate-200 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500" />
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-bold font-numeric text-[#0F172A]">{fmt(net)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold text-sm">
                      <td className="px-4 py-2 text-slate-600">Total</td>
                      <td className="px-4 py-2 text-right font-numeric">{fmt(runEntries.reduce((s, e) => s + (parseFloat(e.gross) || 0), 0))}</td>
                      <td className="px-4 py-2 text-right font-numeric text-red-500">{fmt(runEntries.reduce((s, e) => s + (parseFloat(e.deductions) || 0), 0))}</td>
                      <td className="px-4 py-2 text-right font-numeric text-green-600">{fmt(runEntries.reduce((s, e) => s + ((parseFloat(e.gross) || 0) - (parseFloat(e.deductions) || 0)), 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea value={runForm.notes} onChange={(e) => setRunForm({ ...runForm, notes: e.target.value })} rows={2} placeholder="Optional notes..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowRunModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={createRun} disabled={saving || !runForm.period_label.trim()} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                {saving ? "Creating..." : "Create Payroll Run"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
