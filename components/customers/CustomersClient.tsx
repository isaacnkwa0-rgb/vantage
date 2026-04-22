"use client";

import { useState } from "react";
import { Plus, Search, Users, AlertCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { CustomerForm } from "./CustomerForm";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  credit_balance: number;
  total_spent: number;
  last_purchase_at: string | null;
  created_at: string;
}

interface Props {
  customers: Customer[];
  businessId: string;
  currency: string;
  businessType?: "retail" | "service";
}

export function CustomersClient({ customers, businessId, currency, businessType = "retail" }: Props) {
  const isService = businessType === "service";
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debtorFilter, setDebtorFilter] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [recordingPaymentFor, setRecordingPaymentFor] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchDebt = !debtorFilter || c.credit_balance > 0;
    return matchSearch && matchDebt;
  });

  const fmt = (n: number) => formatCurrency(n, currency);
  const totalOutstanding = customers.reduce((s, c) => s + (c.credit_balance ?? 0), 0);

  async function recordPayment() {
    if (!recordingPaymentFor) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;
    setRecordingPayment(true);
    const supabase = createClient();
    const newBalance = Math.max(0, (recordingPaymentFor.credit_balance ?? 0) - amount);
    await supabase.from("customers").update({ credit_balance: newBalance }).eq("id", recordingPaymentFor.id);
    setRecordingPaymentFor(null);
    setPaymentAmount("");
    setPaymentNote("");
    setRecordingPayment(false);
    router.refresh();
  }

  return (
    <div className="flex-1 p-5 space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isService ? "Search clients..." : "Search customers..."}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          {isService ? "Add Client" : "Add Customer"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
          <p className="font-numeric text-xl font-bold text-[#0F172A]">{customers.length}</p>
          <p className="text-xs text-slate-500">{isService ? "Total Clients" : "Total Customers"}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
          <p className="font-numeric text-xl font-bold text-emerald-600">
            {fmt(customers.reduce((s, c) => s + c.total_spent, 0))}
          </p>
          <p className="text-xs text-slate-500">Total Revenue</p>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-3 text-center shadow-sm">
          <p className="font-numeric text-xl font-bold text-red-500">{fmt(totalOutstanding)}</p>
          <p className="text-xs text-slate-500">Outstanding</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
          <p className="font-numeric text-xl font-bold text-[#0F172A]">
            {customers.filter((c) => c.last_purchase_at).length}
          </p>
          <p className="text-xs text-slate-500">Returning</p>
        </div>
      </div>

      {/* Debt filter */}
      {totalOutstanding > 0 && (
        <button
          onClick={() => setDebtorFilter((v) => !v)}
          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border transition font-medium ${
            debtorFilter
              ? "bg-red-50 border-red-300 text-red-600"
              : "bg-white border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {debtorFilter ? "Showing debtors only" : "Show debtors only"} · {customers.filter((c) => c.credit_balance > 0).length}
        </button>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-14 h-14 text-slate-200 mb-4" />
          <p className="text-slate-600 font-medium">
            {search
              ? `No ${isService ? "clients" : "customers"} found`
              : `No ${isService ? "clients" : "customers"} yet`}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {search ? "Try a different search" : `Add your first ${isService ? "client" : "customer"}`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Contact</th>
                <th className="text-right px-4 py-3">Total Spent</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">{isService ? "Last Visit" : "Last Purchase"}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-slate-50 transition group"
                >
                  <td
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => { setEditing(customer); setShowForm(true); }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        customer.credit_balance > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                      }`}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#0F172A] text-sm">{customer.name}</p>
                        {customer.credit_balance > 0 && (
                          <span className="text-xs text-red-500 font-semibold">
                            Owes {fmt(customer.credit_balance)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-sm text-slate-600">{customer.phone ?? customer.email ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-numeric text-sm font-semibold text-emerald-600">
                      {fmt(customer.total_spent)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-slate-400">
                      {customer.last_purchase_at
                        ? new Date(customer.last_purchase_at).toLocaleDateString()
                        : "Never"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {customer.credit_balance > 0 && (
                      <button
                        onClick={() => { setRecordingPaymentFor(customer); setPaymentAmount(""); setPaymentNote(""); }}
                        className="opacity-0 group-hover:opacity-100 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                      >
                        Record Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CustomerForm
          businessId={businessId}
          editingCustomer={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {recordingPaymentFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-[#0F172A]">Record Payment</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  {recordingPaymentFor.name} owes {fmt(recordingPaymentFor.credit_balance)}
                </p>
              </div>
              <button onClick={() => setRecordingPaymentFor(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Amount received *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={recordingPaymentFor.credit_balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={recordingPaymentFor.credit_balance.toFixed(2)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-numeric text-lg"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Note <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Part payment"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setRecordingPaymentFor(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button
                  onClick={recordPayment}
                  disabled={recordingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
                >
                  {recordingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
