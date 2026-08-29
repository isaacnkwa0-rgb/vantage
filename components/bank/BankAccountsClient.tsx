"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Plus, CreditCard, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Star, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface BankTransaction {
  id: string;
  account_id: string;
  type: "deposit" | "withdrawal" | "transfer";
  amount: number;
  description: string | null;
  reference: string | null;
  date: string;
}

interface Props {
  accounts: BankAccount[];
  transactions: BankTransaction[];
  currency: string;
  businessId: string;
  userId: string;
}

const EMPTY_ACCOUNT: { account_name: string; bank_name: string; account_number: string; account_type: BankAccount["account_type"]; currency: string } = { account_name: "", bank_name: "", account_number: "", account_type: "current", currency: "NGN" };
const EMPTY_TX: { account_id: string; type: BankTransaction["type"]; amount: string; description: string; reference: string; date: string } = { account_id: "", type: "deposit", amount: "", description: "", reference: "", date: new Date().toISOString().split("T")[0] };

const TYPE_LABELS = { current: "Current", savings: "Savings", merchant: "Merchant" };
const TX_ICONS = {
  deposit:    <ArrowUpCircle className="w-4 h-4 text-green-500" />,
  withdrawal: <ArrowDownCircle className="w-4 h-4 text-red-500" />,
  transfer:   <ArrowLeftRight className="w-4 h-4 text-blue-500" />,
};

export function BankAccountsClient({ accounts: initial, transactions: initialTx, currency, businessId, userId }: Props) {
  const supabase = createClient();
  const fmt = (n: number, cur?: string) => formatCurrency(n, cur ?? currency);
  const [accounts, setAccounts] = useState<BankAccount[]>(initial);
  const [transactions, setTransactions] = useState<BankTransaction[]>(initialTx);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(initial[0]?.id ?? null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [form, setForm] = useState(EMPTY_ACCOUNT);
  const [txForm, setTxForm] = useState({ ...EMPTY_TX, account_id: initial[0]?.id ?? "" });
  const [saving, setSaving] = useState(false);

  async function addAccount() {
    if (!form.account_name.trim() || !form.bank_name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("bank_accounts")
      .insert({ business_id: businessId, ...form, is_primary: accounts.length === 0 })
      .select()
      .single();
    if (!error && data) {
      setAccounts((p) => [...p, data as BankAccount]);
      if (accounts.length === 0) setSelectedAccount(data.id);
      setShowAddAccount(false);
      setForm(EMPTY_ACCOUNT);
    }
    setSaving(false);
  }

  async function makePrimary(id: string) {
    await supabase.from("bank_accounts").update({ is_primary: false }).eq("business_id", businessId);
    await supabase.from("bank_accounts").update({ is_primary: true }).eq("id", id);
    setAccounts((p) => p.map((a) => ({ ...a, is_primary: a.id === id })));
  }

  async function deleteAccount(id: string) {
    await supabase.from("bank_accounts").update({ is_active: false }).eq("id", id);
    setAccounts((p) => p.filter((a) => a.id !== id));
    if (selectedAccount === id) setSelectedAccount(accounts.find((a) => a.id !== id)?.id ?? null);
  }

  async function addTransaction() {
    if (!txForm.account_id || !txForm.amount) return;
    setSaving(true);
    const amount = parseFloat(txForm.amount);
    const { data, error } = await supabase
      .from("bank_transactions")
      .insert({
        business_id: businessId,
        account_id: txForm.account_id,
        type: txForm.type,
        amount,
        description: txForm.description.trim() || null,
        reference: txForm.reference.trim() || null,
        date: txForm.date,
        created_by: userId,
      })
      .select()
      .single();

    if (!error && data) {
      setTransactions((p) => [data as BankTransaction, ...p]);
      const delta = txForm.type === "deposit" ? amount : -amount;
      const { data: updated } = await supabase
        .from("bank_accounts")
        .update({ balance: (accounts.find((a) => a.id === txForm.account_id)?.balance ?? 0) + delta })
        .eq("id", txForm.account_id)
        .select()
        .single();
      if (updated) setAccounts((p) => p.map((a) => a.id === txForm.account_id ? { ...a, balance: (updated as BankAccount).balance } : a));
      setShowAddTx(false);
      setTxForm({ ...EMPTY_TX, account_id: txForm.account_id });
    }
    setSaving(false);
  }

  const account = accounts.find((a) => a.id === selectedAccount);
  const accountTx = transactions.filter((t) => t.account_id === selectedAccount);
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="flex-1 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Bank Accounts</h2>
          <p className="text-xs text-slate-400 mt-0.5">Total across all accounts: {fmt(totalBalance)}</p>
        </div>
        <div className="flex items-center gap-2">
          {accounts.length > 0 && (
            <button onClick={() => setShowAddTx(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">
              <ArrowUpCircle className="w-4 h-4" /> Add Transaction
            </button>
          )}
          <button onClick={() => setShowAddAccount(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm">
            <Plus className="w-4 h-4" /> Add Account
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-3 text-center">
          <CreditCard className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-semibold text-[#0F172A]">No bank accounts yet</p>
          <p className="text-xs text-slate-400">Add your business bank accounts to track balances and movements</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Account list */}
          <div className="space-y-2">
            {accounts.map((a) => (
              <div
                key={a.id}
                onClick={() => setSelectedAccount(a.id)}
                className={cn(
                  "bg-white rounded-xl border shadow-sm p-4 cursor-pointer transition group",
                  selectedAccount === a.id ? "border-green-500 ring-1 ring-green-500" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-[#0F172A]">{a.account_name}</p>
                      {a.is_primary && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{a.bank_name} · {TYPE_LABELS[a.account_type]}</p>
                    {a.account_number && <p className="text-xs text-slate-400 font-mono mt-0.5">{a.account_number}</p>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {!a.is_primary && (
                      <button onClick={(e) => { e.stopPropagation(); makePrimary(a.id); }} title="Set primary" className="p-1 text-slate-400 hover:text-amber-500 transition">
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); deleteAccount(a.id); }} className="p-1 text-slate-400 hover:text-red-500 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-lg font-bold text-[#0F172A] mt-2">{fmt(a.balance, a.currency)}</p>
              </div>
            ))}
          </div>

          {/* Transaction list */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-[#0F172A]">
                {account ? `${account.account_name} — Transactions` : "Transactions"}
              </h3>
            </div>
            {accountTx.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-slate-400">No transactions yet for this account</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {accountTx.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      {TX_ICONS[t.type]}
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">{t.description ?? t.type.charAt(0).toUpperCase() + t.type.slice(1)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-400">{t.date}</p>
                          {t.reference && <p className="text-xs text-slate-400">· Ref: {t.reference}</p>}
                        </div>
                      </div>
                    </div>
                    <p className={cn("text-sm font-bold", t.type === "deposit" ? "text-green-600" : "text-red-500")}>
                      {t.type === "deposit" ? "+" : "−"}{fmt(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Account modal */}
      {showAddAccount && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">Add Bank Account</h3>
              <button onClick={() => setShowAddAccount(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Account Name *</label>
                  <input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="e.g. Main Business" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bank Name *</label>
                  <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="e.g. Access Bank" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Account Number</label>
                <input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} placeholder="0123456789" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Account Type</label>
                  <select value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value as BankAccount["account_type"] })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    {["NGN","USD","GBP","EUR","CAD","GHS","KES","ZAR"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAddAccount(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={addAccount} disabled={saving || !form.account_name.trim() || !form.bank_name.trim()} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                {saving ? "Saving..." : "Add Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction modal */}
      {showAddTx && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">Add Transaction</h3>
              <button onClick={() => setShowAddTx(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Account *</label>
                <select value={txForm.account_id} onChange={(e) => setTxForm({ ...txForm, account_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.account_name} ({a.bank_name})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
                  <select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value as BankTransaction["type"] })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Amount *</label>
                  <input type="number" min="0" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <input value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} placeholder="e.g. Cash deposit from sales" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Reference</label>
                  <input value={txForm.reference} onChange={(e) => setTxForm({ ...txForm, reference: e.target.value })} placeholder="TXN123..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                  <input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAddTx(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={addTransaction} disabled={saving || !txForm.account_id || !txForm.amount} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                {saving ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
