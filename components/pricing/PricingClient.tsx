"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Plus, Tag, Users, Trash2, Edit2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceTier {
  id: string;
  name: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number | null;
  customer_price_tiers: { customer_id: string }[];
}

interface Customer {
  id: string;
  name: string;
}

interface Props {
  tiers: PriceTier[];
  customers: Customer[];
  currency: string;
  businessId: string;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  discount_type: "percentage" as "percentage" | "fixed",
  discount_value: "",
  min_order_amount: "",
};

export function PricingClient({ tiers: initialTiers, customers, currency, businessId }: Props) {
  const supabase = createClient();
  const fmt = (n: number) => formatCurrency(n, currency);

  const [tiers, setTiers] = useState<PriceTier[]>(initialTiers);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // For assigning customers to a tier
  const [assignTierId, setAssignTierId] = useState<string | null>(null);
  const [assigningCustomer, setAssigningCustomer] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const assignTier = tiers.find((t) => t.id === assignTierId) ?? null;

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowCreate(true);
  }

  function openEdit(t: PriceTier) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      description: t.description ?? "",
      discount_type: t.discount_type,
      discount_value: String(t.discount_value),
      min_order_amount: t.min_order_amount ? String(t.min_order_amount) : "",
    });
    setShowCreate(true);
  }

  function closeCreate() {
    setShowCreate(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function save() {
    if (!form.name.trim() || !form.discount_value) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
    };

    if (editingId) {
      const { data, error } = await supabase.from("price_tiers").update(payload).eq("id", editingId).select("*, customer_price_tiers(customer_id)").single();
      if (!error && data) {
        setTiers((prev) => prev.map((t) => (t.id === editingId ? (data as PriceTier) : t)));
        closeCreate();
      }
    } else {
      const { data, error } = await supabase.from("price_tiers").insert({ ...payload, business_id: businessId }).select("*, customer_price_tiers(customer_id)").single();
      if (!error && data) {
        setTiers((prev) => [...prev, data as PriceTier]);
        closeCreate();
      }
    }
    setSaving(false);
  }

  async function deleteTier(id: string) {
    await supabase.from("price_tiers").update({ is_active: false }).eq("id", id);
    setTiers((prev) => prev.filter((t) => t.id !== id));
  }

  async function assignCustomer() {
    if (!assignTierId || !assigningCustomer) return;
    setAssigning(true);
    await supabase.from("customer_price_tiers").upsert({ customer_id: assigningCustomer, tier_id: assignTierId });
    setTiers((prev) =>
      prev.map((t) =>
        t.id === assignTierId
          ? { ...t, customer_price_tiers: [...t.customer_price_tiers.filter((c) => c.customer_id !== assigningCustomer), { customer_id: assigningCustomer }] }
          : t
      )
    );
    setAssigningCustomer("");
    setAssigning(false);
  }

  async function removeCustomerFromTier(tierId: string, customerId: string) {
    await supabase.from("customer_price_tiers").delete().eq("customer_id", customerId).eq("tier_id", tierId);
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? { ...t, customer_price_tiers: t.customer_price_tiers.filter((c) => c.customer_id !== customerId) }
          : t
      )
    );
  }

  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c.name]));

  return (
    <div className="flex-1 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Pricing Tiers</h2>
          <p className="text-xs text-slate-400 mt-0.5">Offer wholesale or group discounts to specific customers</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm">
          <Plus className="w-4 h-4" />
          New Tier
        </button>
      </div>

      {/* Tiers grid */}
      {tiers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <Tag className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-[#0F172A]">No pricing tiers yet</p>
          <p className="text-xs text-slate-400">Create tiers to offer wholesale pricing to select customers</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <div key={tier.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 group relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Tag className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-sm font-bold text-[#0F172A]">{tier.name}</p>
                  </div>
                  {tier.description && <p className="text-xs text-slate-400 mt-1">{tier.description}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(tier)} className="p-1.5 text-slate-300 hover:text-blue-600 rounded-lg transition">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteTier(tier.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                  {tier.discount_type === "percentage"
                    ? `${tier.discount_value}% off`
                    : `${fmt(tier.discount_value)} off`}
                </span>
                {tier.min_order_amount && (
                  <span className="text-xs text-slate-400">min {fmt(tier.min_order_amount)}</span>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {tier.customer_price_tiers.length} customers
                  </p>
                  <button onClick={() => setAssignTierId(tier.id)} className="text-xs text-green-600 hover:text-green-700 font-semibold">
                    + Assign
                  </button>
                </div>
                {tier.customer_price_tiers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tier.customer_price_tiers.slice(0, 4).map((c) => (
                      <span key={c.customer_id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-600">
                        {customerMap[c.customer_id] ?? "Unknown"}
                        <button onClick={() => removeCustomerFromTier(tier.id, c.customer_id)} className="text-slate-400 hover:text-red-500 transition">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {tier.customer_price_tiers.length > 4 && (
                      <span className="text-xs text-slate-400">+{tier.customer_price_tiers.length - 4} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">{editingId ? "Edit Tier" : "New Pricing Tier"}</h3>
              <button onClick={closeCreate} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tier Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wholesale, VIP, Bulk" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Discount Type</label>
                  <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percentage" | "fixed" })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Discount Value *</label>
                  <input type="number" min="0" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Minimum Order Amount (optional)</label>
                <input type="number" min="0" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} placeholder="Leave blank for no minimum" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={closeCreate} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={save} disabled={saving || !form.name.trim() || !form.discount_value} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Update" : "Create Tier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign customer modal */}
      {assignTierId && assignTier && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">Assign Customer to {assignTier.name}</h3>
              <button onClick={() => { setAssignTierId(null); setAssigningCustomer(""); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <select value={assigningCustomer} onChange={(e) => setAssigningCustomer(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">— Select customer —</option>
              {customers
                .filter((c) => !assignTier.customer_price_tiers.some((x) => x.customer_id === c.id))
                .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => { setAssignTierId(null); setAssigningCustomer(""); }} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={assignCustomer} disabled={assigning || !assigningCustomer} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                {assigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
