"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Plus, Users, Play, CheckCircle, FileText, X, Pencil, Trash2, ChevronDown, ChevronRight, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const SALARY_LABELS = { monthly: "/ month", weekly: "/ week", daily: "/ day", hourly: "/ hour" };

const STATUS_CONFIG: Record<string, { label: string; pill: string }> = {
  draft:    { label: "Draft",    pill: "bg-slate-100 text-slate-500" },
  approved: { label: "Approved", pill: "bg-amber-100 text-amber-700" },
  paid:     { label: "Paid",     pill: "bg-primary-soft text-primary" },
};

const AVATAR_PALETTES = [
  "bg-violet-100 text-violet-600",
  "bg-blue-100 text-blue-600",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-600",
  "bg-teal-100 text-teal-600",
  "bg-indigo-100 text-indigo-600",
];
function avatarColor(name: string) {
  return AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length];
}

interface StaffForm { name: string; role: string; email: string; phone: string; salary_type: StaffMember["salary_type"]; salary_amount: number; bank_name: string; account_number: string; joined_at: string; }
const EMPTY_STAFF: StaffForm = { name: "", role: "", email: "", phone: "", salary_type: "monthly", salary_amount: 0, bank_name: "", account_number: "", joined_at: new Date().toISOString().split("T")[0] };

const INPUT = "w-full px-3 py-3 border border-slate-200 rounded-xl text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-primary";
const LABEL = "block text-[12px] font-semibold text-slate-500 mb-1.5";

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
  const [runForm, setRunForm] = useState({ period_label: "", period_start: new Date().toISOString().split("T")[0], period_end: new Date().toISOString().split("T")[0], notes: "" });
  const [runEntries, setRunEntries] = useState<{ staffId: string; name: string; gross: string; deductions: string }[]>([]);

  const totalMonthlyPayroll = staff.filter((s) => s.salary_type === "monthly").reduce((sum, s) => sum + s.salary_amount, 0);

  async function saveStaff() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from("staff").update({ ...form, salary_amount: Number(form.salary_amount) }).eq("id", editingId);
      if (!error) setStaff((p) => p.map((s) => s.id === editingId ? { ...s, ...form, salary_amount: Number(form.salary_amount) } : s));
      else { toast.error("Failed to update staff member"); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("staff").insert({ business_id: businessId, ...form, salary_amount: Number(form.salary_amount) }).select().single();
      if (error) { toast.error("Failed to add staff member"); setSaving(false); return; }
      if (data) setStaff((p) => [...p, data as StaffMember]);
    }
    setShowAddStaff(false); setEditingId(null); setForm({ ...EMPTY_STAFF }); setSaving(false);
  }

  function openEdit(s: StaffMember) {
    setForm({ name: s.name, role: s.role ?? "", email: s.email ?? "", phone: s.phone ?? "", salary_type: s.salary_type, salary_amount: s.salary_amount, bank_name: s.bank_name ?? "", account_number: s.account_number ?? "", joined_at: s.joined_at });
    setEditingId(s.id); setShowAddStaff(true);
  }

  async function removeStaff(id: string) {
    const { error } = await supabase.from("staff").update({ is_active: false }).eq("id", id);
    if (error) { toast.error("Failed to remove staff member"); return; }
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
    const { data: run, error: runErr } = await supabase.from("payroll_runs").insert({ business_id: businessId, period_label: runForm.period_label, period_start: runForm.period_start, period_end: runForm.period_end, total_gross: totalGross, total_deductions: totalDed, total_net: totalGross - totalDed, notes: runForm.notes || null, created_by: userId }).select().single();
    if (runErr || !run) { toast.error("Failed to create payroll run"); setSaving(false); return; }
    const { data: insertedEntries } = await supabase.from("payroll_entries").insert(entries.map((e) => ({ run_id: run.id, business_id: businessId, staff_id: e.staffId || null, staff_name: e.name, gross_pay: e.gross, deductions: e.deductions, net_pay: e.net }))).select();
    setRuns((p) => [{ ...run, payroll_entries: (insertedEntries ?? []) as PayrollEntry[] } as PayrollRun, ...p]);
    setShowRunModal(false); setTab("runs"); setSaving(false);
  }

  async function updateRunStatus(id: string, status: PayrollRun["status"]) {
    const { error } = await supabase.from("payroll_runs").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update payroll status"); return; }
    setRuns((p) => p.map((r) => r.id === id ? { ...r, status } : r));
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f8faf9] overflow-hidden">

      {/* Monthly summary card */}
      {totalMonthlyPayroll > 0 && (
        <div className="px-4 pt-3 pb-1 bg-surface flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-primary-soft flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[12px] text-slate-400 font-medium">Monthly Payroll</p>
              <p className="text-[22px] font-extrabold text-slate-900 leading-tight">{fmt(totalMonthlyPayroll)}</p>
            </div>
            <p className="text-[12px] text-slate-400">{staff.length} staff</p>
          </div>
        </div>
      )}

      {/* Tabs + actions bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {([["staff", "Staff"], ["runs", "Runs"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn("px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors", tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
            >
              {label}
              {key === "runs" && runs.length > 0 && (
                <span className="ml-1.5 text-[11px] text-slate-400">({runs.length})</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {tab === "staff" && (
            <button
              onClick={() => { setForm({ ...EMPTY_STAFF }); setEditingId(null); setShowAddStaff(true); }}
              className="h-11 flex items-center gap-1.5 px-3 bg-primary hover:bg-ember-deep text-on-primary rounded-[8px] text-[13px] font-semibold transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> New
            </button>
          )}
          {staff.length > 0 && (
            <button
              onClick={openRunModal}
              className="h-11 flex items-center gap-1.5 px-3 bg-primary hover:bg-ember-deep text-on-primary rounded-[8px] text-[13px] font-semibold transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5" /> Run
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* Staff tab */}
        {tab === "staff" && (
          staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 pt-16 text-center">
              <div className="w-14 h-14 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm">
                <Users className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-[14px] font-semibold text-slate-700">No staff members yet</p>
              <p className="text-[13px] text-slate-400">Add staff to start running payroll</p>
              <button
                onClick={() => { setForm({ ...EMPTY_STAFF }); setShowAddStaff(true); }}
                className="mt-1 px-5 py-2.5 bg-primary hover:bg-ember-deep text-on-primary rounded-[8px] text-[13px] font-semibold transition active:scale-95"
              >
                Add Staff Member
              </button>
            </div>
          ) : (
            staff.map((s) => {
              const initials = s.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex items-start gap-3 px-4 py-4">
                    <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0", avatarColor(s.name))}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-slate-900">{s.name}</p>
                      {s.role && <p className="text-[12px] text-slate-500 mt-0.5">{s.role}</p>}
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-[16px] font-extrabold text-slate-900">{fmt(s.salary_amount)}</span>
                        <span className="text-[12px] text-slate-400">{SALARY_LABELS[s.salary_type]}</span>
                      </div>
                      {(s.bank_name || s.account_number) && (
                        <p className="text-[12px] text-slate-400 mt-1">
                          {s.bank_name}{s.bank_name && s.account_number ? " · " : ""}{s.account_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex border-t border-slate-100">
                    <button
                      onClick={() => openEdit(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold text-slate-600 active:bg-slate-50 transition-colors border-r border-slate-100"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => removeStaff(s.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold text-red-500 active:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* Runs tab */}
        {tab === "runs" && (
          runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 pt-16 text-center">
              <div className="w-14 h-14 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm">
                <FileText className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-[14px] font-semibold text-slate-700">No payroll runs yet</p>
              <p className="text-[13px] text-slate-400">Run payroll to create your first period</p>
              {staff.length > 0 && (
                <button
                  onClick={openRunModal}
                  className="mt-1 px-5 py-2.5 bg-primary hover:bg-ember-deep text-on-primary rounded-[8px] text-[13px] font-semibold transition active:scale-95"
                >
                  Run Payroll
                </button>
              )}
            </div>
          ) : (
            runs.map((run) => {
              const cfg = STATUS_CONFIG[run.status];
              const isOpen = expandedRun === run.id;
              return (
                <div key={run.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Header row */}
                  <button
                    className="w-full flex items-center gap-3 px-4 py-4 active:bg-slate-50 transition-colors text-left"
                    onClick={() => setExpandedRun(isOpen ? null : run.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-bold text-slate-900">{run.period_label}</p>
                        <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", cfg.pill)}>{cfg.label}</span>
                      </div>
                      <p className="text-[12px] text-slate-400 mt-0.5">{run.payroll_entries.length} staff · {run.period_start} → {run.period_end}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[15px] font-extrabold text-slate-900">{fmt(run.total_net)}</p>
                      <p className="text-[11px] text-slate-400">net pay</p>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 flex-shrink-0 transition-transform", isOpen && "rotate-180")} />
                  </button>

                  {/* Expanded entries */}
                  {isOpen && (
                    <>
                      <div className="border-t border-slate-100 divide-y divide-slate-50">
                        {run.payroll_entries.map((e) => (
                          <div key={e.id} className="flex items-center px-4 py-3 gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0", avatarColor(e.staff_name))}>
                              {e.staff_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <p className="flex-1 text-[13px] font-medium text-slate-800 truncate">{e.staff_name}</p>
                            <div className="text-right">
                              <p className="text-[13px] font-bold text-slate-900">{fmt(e.net_pay)}</p>
                              {e.deductions > 0 && <p className="text-[11px] text-red-400">−{fmt(e.deductions)}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Status actions */}
                      {run.status !== "paid" && (
                        <div className="flex border-t border-slate-100">
                          {run.status === "draft" && (
                            <button
                              onClick={() => updateRunStatus(run.id, "approved")}
                              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold text-amber-700 active:bg-amber-50 transition-colors border-r border-slate-100"
                            >
                              <CheckCircle className="w-4 h-4" /> Approve
                            </button>
                          )}
                          {run.status === "approved" && (
                            <button
                              onClick={() => updateRunStatus(run.id, "paid")}
                              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold text-primary active:bg-primary-soft transition-colors border-r border-slate-100"
                            >
                              <CheckCircle className="w-4 h-4" /> Mark as Paid
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )
        )}
      </div>

      {/* Add/Edit Staff bottom sheet */}
      {showAddStaff && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setShowAddStaff(false)}>
          <div className="w-full bg-white rounded-t-2xl px-5 pt-5 pb-10 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-slate-900">{editingId ? "Edit Staff" : "Add Staff Member"}</h3>
              <button onClick={() => setShowAddStaff(false)} className="p-1.5 rounded-xl text-slate-400 active:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Role</label>
                  <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Cashier" className={INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234..." className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@email.com" className={INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Salary Amount</label>
                  <input type="number" min="0" value={form.salary_amount} onChange={(e) => setForm({ ...form, salary_amount: parseFloat(e.target.value) || 0 })} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Salary Type</label>
                  <select value={form.salary_type} onChange={(e) => setForm({ ...form, salary_type: e.target.value as StaffMember["salary_type"] })} className={INPUT}>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Bank Name</label>
                  <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="e.g. Zenith Bank" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Account Number</label>
                  <input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} placeholder="0123456789" className={INPUT} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Date Joined</label>
                <input type="date" value={form.joined_at} onChange={(e) => setForm({ ...form, joined_at: e.target.value })} className={INPUT} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddStaff(false)} className="flex-1 py-3.5 border border-slate-200 text-slate-600 rounded-xl text-[14px] font-semibold active:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={saveStaff} disabled={saving || !form.name.trim()} className="flex-1 py-3.5 bg-primary hover:bg-ember-deep text-on-primary rounded-[8px] text-[14px] font-semibold transition active:scale-95 disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Update" : "Add Staff"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Payroll bottom sheet */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setShowRunModal(false)}>
          <div className="w-full bg-white rounded-t-2xl px-5 pt-5 pb-10 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-slate-900">Run Payroll</h3>
              <button onClick={() => setShowRunModal(false)} className="p-1.5 rounded-xl text-slate-400 active:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Period Label *</label>
                <input value={runForm.period_label} onChange={(e) => setRunForm({ ...runForm, period_label: e.target.value })} placeholder="e.g. September 2026" className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Start Date</label>
                  <input type="date" value={runForm.period_start} onChange={(e) => setRunForm({ ...runForm, period_start: e.target.value })} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>End Date</label>
                  <input type="date" value={runForm.period_end} onChange={(e) => setRunForm({ ...runForm, period_end: e.target.value })} className={INPUT} />
                </div>
              </div>

              {/* Staff entries */}
              <div>
                <label className={LABEL}>Staff Pay</label>
                <div className="space-y-3">
                  {runEntries.map((e, i) => {
                    const net = (parseFloat(e.gross) || 0) - (parseFloat(e.deductions) || 0);
                    return (
                      <div key={e.staffId} className="bg-slate-50 rounded-xl px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[13px] font-semibold text-slate-800">{e.name}</p>
                          <p className="text-[13px] font-bold text-primary">{fmt(net)} net</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[11px] text-slate-400 mb-1">Gross Pay</p>
                            <input type="number" min="0" value={e.gross} onChange={(ev) => setRunEntries((p) => p.map((r, ri) => ri === i ? { ...r, gross: ev.target.value } : r))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400 mb-1">Deductions</p>
                            <input type="number" min="0" value={e.deductions} onChange={(ev) => setRunEntries((p) => p.map((r, ri) => ri === i ? { ...r, deductions: ev.target.value } : r))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals summary */}
              <div className="bg-primary-soft rounded-xl px-4 py-3 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-primary">Total Net Pay</p>
                <p className="text-[16px] font-extrabold text-primary">
                  {fmt(runEntries.reduce((s, e) => s + ((parseFloat(e.gross) || 0) - (parseFloat(e.deductions) || 0)), 0))}
                </p>
              </div>

              <div>
                <label className={LABEL}>Notes</label>
                <textarea value={runForm.notes} onChange={(e) => setRunForm({ ...runForm, notes: e.target.value })} rows={2} placeholder="Optional notes..." className={cn(INPUT, "resize-none")} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRunModal(false)} className="flex-1 py-3.5 border border-slate-200 text-slate-600 rounded-xl text-[14px] font-semibold active:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={createRun} disabled={saving || !runForm.period_label.trim()} className="flex-1 py-3.5 bg-primary hover:bg-ember-deep text-on-primary rounded-[8px] text-[14px] font-semibold transition active:scale-95 disabled:opacity-50">
                {saving ? "Creating..." : "Create Run"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
