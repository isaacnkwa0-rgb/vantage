"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Gift, Plus, Search, Copy, CheckCheck, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GiftCard {
  id: string;
  code: string;
  initial_value: number;
  balance: number;
  customer_id: string | null;
  customer_email: string | null;
  status: "active" | "redeemed" | "expired" | "voided";
  expires_at: string | null;
  created_at: string;
  customers: { name: string } | null;
}

interface Customer { id: string; name: string; email: string | null; }

interface Props {
  cards: GiftCard[];
  customers: Customer[];
  currency: string;
  businessId: string;
  userId: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  redeemed: "bg-slate-100 text-slate-500",
  expired: "bg-amber-100 text-amber-600",
  voided: "bg-red-100 text-red-500",
};

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 16 }, (_, i) => (i > 0 && i % 4 === 0 ? "-" : chars[Math.floor(Math.random() * chars.length)])).join("");
}

export function GiftCardsClient({ cards: initialCards, customers, currency, businessId, userId }: Props) {
  const supabase = createClient();
  const fmt = (n: number) => formatCurrency(n, currency);

  const [cards, setCards] = useState<GiftCard[]>(initialCards);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: generateCode(),
    initial_value: "",
    customer_id: "",
    customer_email: "",
    expires_at: "",
  });

  const filtered = cards.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.customers?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.customer_email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function create() {
    if (!form.initial_value) return;
    setSaving(true);
    const val = parseFloat(form.initial_value);
    const selectedCustomer = customers.find((c) => c.id === form.customer_id);
    const { data, error } = await supabase
      .from("gift_cards")
      .insert({
        business_id: businessId,
        code: form.code,
        initial_value: val,
        balance: val,
        customer_id: form.customer_id || null,
        customer_email: (selectedCustomer?.email ?? form.customer_email) || null,
        status: "active",
        expires_at: form.expires_at || null,
        created_by: userId,
      })
      .select("*, customers(name)")
      .single();
    if (!error && data) {
      setCards((prev) => [data as GiftCard, ...prev]);
      setShowCreate(false);
      setForm({ code: generateCode(), initial_value: "", customer_id: "", customer_email: "", expires_at: "" });
    }
    setSaving(false);
  }

  async function voidCard(id: string) {
    await supabase.from("gift_cards").update({ status: "voided" }).eq("id", id);
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: "voided" as const } : c)));
  }

  const activeTotal = cards.filter((c) => c.status === "active").reduce((s, c) => s + c.balance, 0);

  return (
    <div className="flex-1 p-5 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search gift cards..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm">
          <Plus className="w-4 h-4" /> Issue Gift Card
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-[#0F172A]">{cards.filter((c) => c.status === "active").length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active Cards</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-green-600">{fmt(activeTotal)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Outstanding Balance</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-[#0F172A]">{cards.filter((c) => c.status === "redeemed").length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Redeemed</p>
        </div>
      </div>

      {/* Cards list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <Gift className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-[#0F172A]">No gift cards yet</p>
          <p className="text-xs text-slate-400">Issue a gift card to a customer</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Balance</th>
                <th className="text-right px-5 py-3">Initial</th>
                <th className="text-left px-5 py-3">Expires</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((card) => (
                <tr key={card.id} className="hover:bg-slate-50 transition group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#0F172A] tracking-widest">{card.code}</span>
                      <button onClick={() => copyCode(card.id, card.code)} className="text-slate-300 hover:text-green-600 transition">
                        {copiedId === card.id ? <CheckCheck className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{card.customers?.name ?? card.customer_email ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", STATUS_STYLES[card.status])}>
                      {card.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-green-600">{fmt(card.balance)}</td>
                  <td className="px-5 py-3 text-right text-sm text-slate-400">{fmt(card.initial_value)}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">{card.expires_at ?? <span className="text-slate-200">—</span>}</td>
                  <td className="px-5 py-3">
                    {card.status === "active" && (
                      <button onClick={() => voidCard(card.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">Issue Gift Card</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Card Code</label>
                <div className="flex gap-2">
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500" />
                  <button onClick={() => setForm({ ...form, code: generateCode() })} className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-500 hover:bg-slate-50 transition">Regenerate</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Value ({currency}) *</label>
                <input type="number" min="0" value={form.initial_value} onChange={(e) => setForm({ ...form, initial_value: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Customer (optional)</label>
                <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">— None —</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {!form.customer_id && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Recipient Email</label>
                  <input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} placeholder="recipient@example.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Expiry Date (optional)</label>
                <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={create} disabled={saving || !form.initial_value} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                {saving ? "Issuing..." : "Issue Card"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
