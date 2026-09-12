"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, CreditCard, Star, Trash2, X, Loader2, Copy, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string | null;
  account_type: "current" | "savings" | "merchant";
  currency: string;
  balance: number;
  is_primary: boolean;
}

interface Props {
  accounts: BankAccount[];
  transactions: BankTransaction[];
  currency: string;
  businessId: string;
  userId: string;
}

// kept in interface for prop compatibility
interface BankTransaction { id: string; }

const TYPE_LABELS = { current: "Current", savings: "Savings", merchant: "Merchant" };

const EMPTY_FORM = { account_name: "", bank_name: "", account_number: "", account_type: "current" as BankAccount["account_type"], currency: "NGN" };

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

export function BankAccountsClient({ accounts: initial, businessId }: Props) {
  const [accounts, setAccounts]           = useState<BankAccount[]>(initial);
  const [showForm, setShowForm]           = useState(false);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [copiedId, setCopiedId]           = useState<string | null>(null);
  const [confirmId, setConfirmId]         = useState<string | null>(null);

  async function addAccount() {
    if (!form.account_name.trim() || !form.bank_name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bank_accounts")
      .insert({ business_id: businessId, ...form, balance: 0, is_primary: accounts.length === 0 })
      .select().single();
    if (!error && data) {
      setAccounts((p) => [...p, data as BankAccount]);
      setShowForm(false);
      setForm(EMPTY_FORM);
    }
    setSaving(false);
  }

  async function makePrimary(id: string) {
    const supabase = createClient();
    await supabase.from("bank_accounts").update({ is_primary: false }).eq("business_id", businessId);
    await supabase.from("bank_accounts").update({ is_primary: true }).eq("id", id);
    setAccounts((p) => p.map((a) => ({ ...a, is_primary: a.id === id })));
  }

  async function deleteAccount() {
    if (!confirmId) return;
    setDeletingId(confirmId);
    const supabase = createClient();
    const { error } = await supabase.from("bank_accounts").update({ is_active: false }).eq("id", confirmId);
    setDeletingId(null);
    setConfirmId(null);
    if (error) { toast.error("Failed to remove account"); return; }
    setAccounts((p) => p.filter((a) => a.id !== confirmId));
  }

  function copyNumber(id: string, number: string) {
    navigator.clipboard.writeText(number);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <>
    <ConfirmDialog
      open={!!confirmId}
      title="Remove account?"
      message="This payment account will be removed from your checkout options."
      confirmLabel="Remove"
      loading={!!deletingId}
      onConfirm={deleteAccount}
      onCancel={() => setConfirmId(null)}
    />
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-6 space-y-4">

      {/* Info banner */}
      <p className="text-[13px] text-slate-500 leading-relaxed">
        These accounts are shown to customers at checkout when they choose bank transfer as their payment method.
      </p>

      {/* Add account dashed button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 h-11 border-2 border-dashed border-slate-200 rounded-[8px] text-[13px] font-semibold text-slate-400 hover:border-[#1a9c38] hover:text-[#1a9c38] transition"
        >
          <Plus className="w-4 h-4" /> Add Payment Account
        </button>
      )}

      {/* Inline form */}
      {showForm && (
        <div className="border border-slate-200 rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-[13px] font-semibold text-[#0F172A]">Add Payment Account</span>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="p-1 text-slate-400 hover:text-slate-600 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-4 pt-4 pb-3 space-y-4">
            <SectionDivider label="Account Details" />
            <div className="space-y-3">
              <Field label="Account name *">
                <input value={form.account_name} onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))} placeholder="e.g. Main Business Account" className={innerCls} />
              </Field>
              <Field label="Bank name *">
                <input value={form.bank_name} onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))} placeholder="e.g. Access Bank" className={innerCls} />
              </Field>
              <Field label="Account number">
                <input value={form.account_number} onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))} placeholder="0123456789" className={`${innerCls} font-mono tracking-widest`} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Account type">
                  <select value={form.account_type} onChange={(e) => setForm((f) => ({ ...f, account_type: e.target.value as BankAccount["account_type"] }))} className={`${innerCls} -ml-0.5`}>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Currency">
                  <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} className={`${innerCls} -ml-0.5`}>
                    {["NGN","USD","GBP","EUR","CAD","GHS","KES","ZAR"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 flex gap-3">
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="py-2.5 px-4 border border-slate-200 rounded-[8px] text-[14px] text-slate-600 hover:bg-slate-50 transition">Cancel</button>
            <button onClick={addAccount} disabled={saving || !form.account_name.trim() || !form.bank_name.trim()} className="flex-1 flex items-center justify-center gap-2 bg-[#1a9c38] hover:bg-green-700 text-white py-2.5 rounded-[8px] text-[14px] font-semibold transition disabled:opacity-50 shadow-sm shadow-green-900/20">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Account
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {accounts.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <CreditCard className="w-9 h-9 text-slate-300" />
          </div>
          <p className="text-[16px] font-bold text-slate-800">No payment accounts yet</p>
          <p className="text-[13px] text-slate-400 mt-1.5 max-w-xs">Add the bank accounts customers should transfer to at checkout</p>
        </div>
      )}

      {/* Account list */}
      {accounts.length > 0 && (
        <>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </p>
          <div className="bg-white rounded-[8px] border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {accounts.map((account) => (
              <div key={account.id} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center mt-0.5 text-blue-600 font-extrabold text-[15px]">
                    {account.bank_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[15px] text-slate-900 leading-tight truncate">{account.account_name}</p>
                      {account.is_primary && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Primary
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-slate-500 mt-0.5">
                      {account.bank_name} · {TYPE_LABELS[account.account_type]} · {account.currency}
                    </p>
                    {account.account_number && (
                      <p className="font-mono text-[15px] font-bold text-[#0F172A] mt-1.5 tracking-widest">{account.account_number}</p>
                    )}
                  </div>
                </div>

                {/* Action row */}
                <div className="flex items-center gap-2 mt-3 pl-[52px]">
                  {account.account_number && (
                    <button
                      onClick={() => copyNumber(account.id, account.account_number!)}
                      className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition active:scale-95"
                    >
                      {copiedId === account.id
                        ? <><CheckCheck className="w-3 h-3 text-[#1a9c38]" /> Copied</>
                        : <><Copy className="w-3 h-3" /> Copy Number</>}
                    </button>
                  )}
                  {!account.is_primary && (
                    <button
                      onClick={() => makePrimary(account.id)}
                      className="flex items-center gap-1.5 text-[13px] font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-100 px-3 py-1.5 rounded-lg transition active:scale-95"
                    >
                      <Star className="w-3 h-3" /> Set Primary
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmId(account.id)}
                    disabled={deletingId === account.id}
                    className="flex items-center gap-1.5 text-[13px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg transition active:scale-95 disabled:opacity-50"
                  >
                    {deletingId === account.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
    </>
  );
}
