"use client";

import { useState } from "react";
import { Plus, Package, Trash2, Pencil, Loader2, ToggleLeft, ToggleRight, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  image_url: string | null;
}

interface BundleItem {
  id?: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  bundle_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    products: { name: string; selling_price: number; cost_price: number } | null;
  }>;
}

interface Props {
  bundles: Bundle[];
  products: Product[];
  businessId: string;
  currency: string;
}

const EMPTY_FORM = { name: "", description: "", price: "", items: [{ product_id: "", quantity: 1 }] as BundleItem[] };

export function BundlesClient({ bundles: initialBundles, products, businessId, currency }: Props) {
  const router = useRouter();
  const fmt = (n: number) => formatCurrency(n, currency);

  const [bundles, setBundles] = useState(initialBundles);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const componentTotal = (items: BundleItem[]) =>
    items.reduce((s, bi) => {
      const p = products.find((p) => p.id === bi.product_id);
      return s + (p?.selling_price ?? 0) * bi.quantity;
    }, 0);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(b: Bundle) {
    setEditingId(b.id);
    setForm({
      name: b.name,
      description: b.description ?? "",
      price: b.price.toString(),
      items: b.bundle_items.map((bi) => ({ product_id: bi.product_id, quantity: bi.quantity })),
    });
    setError(null);
    setShowForm(true);
  }

  function addFormItem() {
    setForm((f) => ({ ...f, items: [...f.items, { product_id: "", quantity: 1 }] }));
  }

  function removeFormItem(idx: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  function updateFormItem(idx: number, field: "product_id" | "quantity", value: string | number) {
    setForm((f) => ({
      ...f,
      items: f.items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Bundle name is required"); return; }
    const price = parseFloat(form.price);
    if (!price || price <= 0) { setError("Price must be greater than 0"); return; }
    const validItems = form.items.filter((i) => i.product_id);
    if (validItems.length === 0) { setError("Add at least one product to the bundle"); return; }

    setError(null);
    setSaving(true);
    const supabase = createClient();

    if (editingId) {
      await supabase.from("product_bundles").update({
        name: form.name.trim(),
        description: form.description || null,
        price,
      }).eq("id", editingId);
      // Replace items
      await supabase.from("bundle_items").delete().eq("bundle_id", editingId);
      await supabase.from("bundle_items").insert(
        validItems.map((i) => ({ bundle_id: editingId, product_id: i.product_id, quantity: i.quantity }))
      );
    } else {
      const { data: bundle, error: bErr } = await supabase
        .from("product_bundles")
        .insert({ business_id: businessId, name: form.name.trim(), description: form.description || null, price })
        .select("id")
        .single();
      if (bErr || !bundle) { setError(bErr?.message ?? "Failed to create bundle"); setSaving(false); return; }
      await supabase.from("bundle_items").insert(
        validItems.map((i) => ({ bundle_id: bundle.id, product_id: i.product_id, quantity: i.quantity }))
      );
    }

    setSaving(false);
    setShowForm(false);
    router.refresh();
  }

  async function toggleActive(b: Bundle) {
    setTogglingId(b.id);
    const supabase = createClient();
    await supabase.from("product_bundles").update({ is_active: !b.is_active }).eq("id", b.id);
    setBundles((prev) => prev.map((x) => (x.id === b.id ? { ...x, is_active: !x.is_active } : x)));
    setTogglingId(null);
  }

  async function deleteBundle(id: string) {
    if (!confirm("Delete this bundle? This cannot be undone.")) return;
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("product_bundles").delete().eq("id", id);
    setBundles((prev) => prev.filter((b) => b.id !== id));
    setDeletingId(null);
  }

  const activeBundles = bundles.filter((b) => b.is_active).length;

  return (
    <div className="flex-1 p-3 sm:p-5 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Total Bundles</p>
          <p className="text-xl font-bold text-[#0F172A]">{bundles.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Active</p>
          <p className="text-xl font-bold text-emerald-600">{activeBundles}</p>
        </div>
      </div>

      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[#0F172A]">Product Bundles</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm shadow-green-300/40"
        >
          <Plus className="w-4 h-4" />
          New Bundle
        </button>
      </div>

      {/* Bundle list */}
      {bundles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-14 h-14 text-slate-200 mb-4" />
          <p className="text-slate-600 font-medium">No bundles yet</p>
          <p className="text-slate-400 text-sm mt-1">Group products into bundles to sell together at a special price</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bundles.map((b) => {
            const componentSum = b.bundle_items.reduce(
              (s, bi) => s + (bi.products?.selling_price ?? 0) * bi.quantity, 0
            );
            const savings = componentSum - b.price;

            return (
              <div key={b.id} className={`bg-white rounded-xl border shadow-sm p-4 ${b.is_active ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 border border-violet-200 overflow-hidden">
                    {b.image_url ? (
                      <Image src={b.image_url} alt={b.name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <Package className="w-6 h-6 text-violet-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#0F172A]">{b.name}</p>
                      {!b.is_active && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">Inactive</span>
                      )}
                    </div>
                    {b.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{b.description}</p>}

                    {/* Components */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {b.bundle_items.map((bi, i) => (
                        <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                          {bi.products?.name ?? "Unknown"} ×{bi.quantity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="font-bold text-violet-700">{fmt(b.price)}</p>
                    {savings > 0 && (
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Save {fmt(savings)}</p>
                    )}
                    {componentSum > 0 && savings <= 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">vs {fmt(componentSum)}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openEdit(b)}
                    className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-green-600 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition border border-slate-200"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(b)}
                    disabled={togglingId === b.id}
                    className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition border border-slate-200"
                  >
                    {b.is_active
                      ? <ToggleRight className="w-3.5 h-3.5 text-emerald-500" />
                      : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                    {b.is_active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => deleteBundle(b.id)}
                    disabled={deletingId === b.id}
                    className="ml-auto flex items-center gap-1 text-xs font-medium text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition"
                  >
                    {deletingId === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bundle form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="font-bold text-[#0F172A]">{editingId ? "Edit Bundle" : "New Bundle"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Bundle Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Starter Kit, Office Set"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional short description"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Bundle Price *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {form.items.some((i) => i.product_id) && (() => {
                  const sum = componentTotal(form.items);
                  const p = parseFloat(form.price) || 0;
                  const savings = sum - p;
                  return sum > 0 ? (
                    <p className={`text-xs mt-1 ${savings > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                      Individual total: {fmt(sum)}{savings > 0 ? ` · Save ${fmt(savings)}` : ""}
                    </p>
                  ) : null;
                })()}
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-[#0F172A]">Products in Bundle</label>
                  <button onClick={addFormItem} className="text-xs text-green-600 hover:underline font-medium flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add product
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateFormItem(idx, "product_id", e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">— Select product —</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({fmt(p.selling_price)})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateFormItem(idx, "quantity", parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-2 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={() => removeFormItem(idx)}
                        disabled={form.items.length === 1}
                        className="p-1.5 text-slate-300 hover:text-red-400 disabled:opacity-30 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? "Update Bundle" : "Create Bundle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
