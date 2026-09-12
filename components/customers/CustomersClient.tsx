"use client";

import { useState } from "react";
import { Plus, Search, Users, AlertCircle, Loader2, Tag, Phone, Mail, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/currency";
import { CustomerForm } from "./CustomerForm";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface CustomerTag {
  id: string;
  name: string;
  color: string;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  credit_balance: number;
  total_spent: number;
  last_purchase_at: string | null;
  created_at: string;
  customer_tag_assignments?: Array<{
    tag_id: string;
    customer_tags: CustomerTag | null;
  }>;
}

interface Props {
  customers: Customer[];
  tags: CustomerTag[];
  businessId: string;
  userId: string;
  currency: string;
  businessName: string;
  businessPhone?: string | null;
  businessAddress?: string | null;
  businessType?: "retail" | "service";
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const AVATAR_PALETTES = [
  "bg-violet-100 text-violet-600",
  "bg-blue-100 text-blue-600",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-600",
  "bg-teal-100 text-teal-600",
  "bg-indigo-100 text-indigo-600",
];

function avatarColor(name: string, hasDebt: boolean) {
  if (hasDebt) return "bg-red-100 text-red-600";
  return AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length];
}

export function CustomersClient({
  customers,
  tags: initialTags,
  businessId,
  userId,
  currency,
  businessName,
  businessPhone,
  businessAddress,
  businessType = "retail",
}: Props) {
  const isService = businessType === "service";
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debtorFilter, setDebtorFilter] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [tags, setTags] = useState<CustomerTag[]>(initialTags);
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
    const matchTag = !tagFilter || c.customer_tag_assignments?.some((a) => a.tag_id === tagFilter);
    return matchSearch && matchDebt && matchTag;
  });

  const fmt = (n: number) => formatCurrency(n, currency);
  const totalOutstanding = customers.reduce((s, c) => s + (c.credit_balance ?? 0), 0);
  const totalRevenue = customers.reduce((s, c) => s + c.total_spent, 0);
  const debtorCount = customers.filter((c) => c.credit_balance > 0).length;

  function getCustomerTags(customer: Customer): CustomerTag[] {
    return (customer.customer_tag_assignments ?? [])
      .map((a) => a.customer_tags)
      .filter(Boolean) as CustomerTag[];
  }

  async function recordPayment() {
    if (!recordingPaymentFor) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;
    setRecordingPayment(true);
    const supabase = createClient();
    const newBalance = Math.max(0, (recordingPaymentFor.credit_balance ?? 0) - amount);
    const { error } = await supabase.from("customers").update({ credit_balance: newBalance }).eq("id", recordingPaymentFor.id);
    setRecordingPayment(false);
    if (error) { toast.error("Failed to record payment"); return; }
    setRecordingPaymentFor(null);
    setPaymentAmount("");
    setPaymentNote("");
    router.refresh();
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setShowForm(true);
  }

  function handleFormClose(newTags?: CustomerTag[]) {
    setShowForm(false);
    setEditing(null);
    if (newTags) setTags(newTags);
    router.refresh();
  }

  const hasFilters = search || debtorFilter || tagFilter;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">

      {/* Search + New */}
      <div className="bg-white border-b border-slate-100 px-4 pt-3 pb-3 space-y-3">
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
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="h-full flex items-center gap-1.5 px-3 bg-[#1a9c38] hover:bg-green-700 text-white rounded-[8px] text-[13px] font-semibold transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {/* Filter pills */}
        {(totalOutstanding > 0 || tags.length > 0) && (
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            {totalOutstanding > 0 && (
              <button
                onClick={() => setDebtorFilter((v) => !v)}
                className={`flex-shrink-0 flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-1.5 rounded-full border transition ${
                  debtorFilter
                    ? "bg-red-500 border-red-500 text-white"
                    : "bg-white border-slate-200 text-slate-600 active:bg-slate-50"
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                Debtors · {debtorCount}
              </button>
            )}
            {tags.length > 0 && (
              <>
                <div className="h-5 w-px bg-slate-200 flex-shrink-0" />
                {tags.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTagFilter(tagFilter === t.id ? null : t.id)}
                    className="flex-shrink-0 flex items-center gap-1 text-[13px] font-semibold px-3 py-1.5 rounded-full border transition"
                    style={
                      tagFilter === t.id
                        ? { backgroundColor: t.color, borderColor: t.color, color: "#fff" }
                        : { borderColor: t.color + "60", color: t.color, backgroundColor: t.color + "15" }
                    }
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {t.name}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto px-4 py-4 space-y-4">

        {/* Stats — compact inline chips */}
        {customers.length > 0 && (
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-[8px] px-3 py-2.5">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#1a9c38] to-emerald-500 flex items-center justify-center flex-shrink-0">
                <Users className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-none">{customers.length}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{isService ? "Clients" : "Customers"}</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-[8px] px-3 py-2.5">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-emerald-600 leading-none truncate">{fmt(totalRevenue)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Revenue</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Users className="w-9 h-9 text-slate-300" />
            </div>
            <p className="text-[16px] font-bold text-slate-800">
              {hasFilters
                ? `No ${isService ? "clients" : "customers"} found`
                : `No ${isService ? "clients" : "customers"} yet`}
            </p>
            <p className="text-[13px] text-slate-400 mt-1.5 max-w-xs">
              {hasFilters
                ? "Try adjusting your search or filters"
                : `Add your first ${isService ? "client" : "customer"} to start tracking`}
            </p>
            {!hasFilters && (
              <button
                onClick={() => { setEditing(null); setShowForm(true); }}
                className="mt-6 flex items-center gap-2 bg-[#1a9c38] hover:bg-green-700 text-white px-5 py-3 rounded-[8px] text-sm font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                {isService ? "Add Client" : "Add Customer"}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              {filtered.length} {isService ? "client" : "customer"}{filtered.length !== 1 ? "s" : ""}
            </p>

            <div className="bg-white rounded-[8px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
              {filtered.map((customer) => {
                const customerTags = getCustomerTags(customer);
                const hasDebt = customer.credit_balance > 0;
                const contact = customer.phone ?? customer.email;
                const lastDate = customer.last_purchase_at ? shortDate(customer.last_purchase_at) : null;

                return (
                  <div key={customer.id} className="px-4 py-4">
                    {/* Main row */}
                    <div
                      className="flex items-start gap-3 cursor-pointer active:opacity-70 transition"
                      onClick={() => openEdit(customer)}
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[15px] mt-0.5 ${avatarColor(customer.name, hasDebt)}`}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Left — name + contact */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[15px] text-slate-900 leading-none">{customer.name}</span>
                          {hasDebt && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100 flex-shrink-0">
                              OWES {fmt(customer.credit_balance)}
                            </span>
                          )}
                        </div>
                        {contact && (
                          <div className="flex items-center gap-1">
                            {customer.phone
                              ? <Phone className="w-2.5 h-2.5 text-slate-600 flex-shrink-0" />
                              : <Mail className="w-2.5 h-2.5 text-slate-600 flex-shrink-0" />}
                            <span className="text-[13px] text-slate-400 truncate">{contact}</span>
                          </div>
                        )}
                      </div>

                      {/* Right — amount + label */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-[15px] font-bold text-slate-800 leading-none">{fmt(customer.total_spent)}</span>
                        <span className="text-[11px] text-slate-400">total purchases</span>
                      </div>
                    </div>

                    {/* Action row */}
                    {hasDebt && (
                      <div className="flex items-center gap-2 mt-3 pl-[52px]">
                        <button
                          onClick={() => { setRecordingPaymentFor(customer); setPaymentAmount(""); setPaymentNote(""); }}
                          className="flex items-center gap-1.5 text-[13px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition active:scale-95"
                        >
                          Record Payment
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom padding for FAB */}
        <div className="h-6" />
      </div>


      {/* Add / Edit form */}
      {showForm && (
        <CustomerForm
          businessId={businessId}
          userId={userId}
          editingCustomer={editing}
          tags={tags}
          onClose={handleFormClose}
        />
      )}

      {/* Record payment sheet */}
      {recordingPaymentFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">Record Payment</h2>
                <p className="text-[13px] text-slate-400 mt-0.5">
                  {recordingPaymentFor.name} owes {fmt(recordingPaymentFor.credit_balance)}
                </p>
              </div>
              <button
                onClick={() => setRecordingPaymentFor(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-[8px] transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Amount received</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={recordingPaymentFor.credit_balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={recordingPaymentFor.credit_balance.toFixed(2)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-[8px] text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a9c38]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Note <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Part payment"
                  className="w-full px-4 py-3 border border-slate-200 rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1a9c38]"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setRecordingPaymentFor(null)}
                  className="flex-1 py-3 border border-slate-200 rounded-[8px] text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={recordPayment}
                  disabled={recordingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1a9c38] hover:bg-green-700 text-white py-3 rounded-[8px] text-[13px] font-semibold disabled:opacity-50 transition"
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
