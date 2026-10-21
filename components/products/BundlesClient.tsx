"use client";

import { useState } from "react";
import { Plus, Package, Trash2, Pencil, Loader2, ToggleLeft, ToggleRight, X, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  image_url: string | null;
}

interface BundleItem {
  product_id: string;
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

const innerCls = "w-full text-sm bg-transparent focus:outline-none text-[#0F172A] placeholder:text-slate-400 pt-0.5 pb-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-slate-200 rounded-[8px] px-3 pt-0 pb-2 focus-within:border-primary transition">
      <legend className="text-[11px] font-medium text-slate-600 px-1 ml-0.5 leading-none">{label}</legend>
      {children}
    </fieldset>
  );
}

function SectionDivider({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0">{label}</span>
      {action && <>{action}</>}
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

export function BundlesClient({ bundles: initialBundles, products, businessId, currency }: Props) {
  const router = useRouter();
  const fmt = (n: number) => formatCurrency(n, currency);

  const [bundles, setBundles] = useState(initialBundles);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId]   = useState<string | null>(null);

  const filtered = bundles.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

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

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
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
    closeForm();
    router.refresh();
  }

  async function toggleActive(b: Bundle) {
    setTogglingId(b.id);
    const supabase = createClient();
    await supabase.from("product_bundles").update({ is_active: !b.is_active }).eq("id", b.id);
    setBundles((prev) => prev.map((x) => (x.id === b.id ? { ...x, is_active: !x.is_active } : x)));
    setTogglingId(null);
  }

  async function deleteBundle() {
    if (!confirmId) return;
    setDeletingId(confirmId);
    const supabase = createClient();
    const { error } = await supabase.from("product_bundles").delete().eq("id", confirmId);
    setDeletingId(null);
    setConfirmId(null);
    if (error) { toast.error("Failed to delete bundle"); return; }
    setBundles((prev) => prev.filter((b) => b.id !== confirmId));
  }

  return (
    <>
    <ConfirmDialog
      open={!!confirmId}
      title="Delete bundle?"
      message="This bundle will be permanently deleted. This cannot be undone."
      confirmLabel="Delete"
      loading={!!deletingId}
      onConfirm={deleteBundle}
      onCancel={() => setConfirmId(null)}
    />
    <div className="flex-1 flex flex-col min-h-0 bg-white overflow-x-hidden">

      {/* Search + New */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-2 items-stretch h-11">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full h-full pl-9 pr-4 border border-slate-200 rounded-[8px] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>
          {!showForm && (
            <button
              onClick={openCreate}
              className="h-full flex items-center gap-1.5 px-3 bg-primary hover:bg-ember-deep text-on-primary rounded-[8px] text-[13px] font-semibold transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          )}
        </div>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="mx-4 mb-3 border border-slate-200 rounded-[12px] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-[13px] font-semibold text-[#0F172A]">
              {editingId ? "Edit Bundle" : "New Bundle"}
            </span>
            <button onClick={closeForm} className="p-1 text-slate-400 hover:text-slate-600 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 pt-4 pb-3 space-y-4">
            <SectionDivider label="Details" />
            <div className="space-y-3">
              <Field label="Bundle name *">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Starter Kit, Office Set"
                  className={innerCls}
                />
              </Field>
              <Field label="Description (optional)">
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description"
                  className={innerCls}
                />
              </Field>
              <Field label="Bundle price *">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  className={innerCls}
                />
              </Field>
              {form.items.some((i) => i.product_id) && (() => {
                const sum = componentTotal(form.items);
                const p = parseFloat(form.price) || 0;
                const savings = sum - p;
                return sum > 0 ? (
                  <p className={`text-[12px] px-0.5 ${savings > 0 ? "text-success" : "text-slate-400"}`}>
                    Individual total: {fmt(sum)}{savings > 0 ? ` · Save ${fmt(savings)}` : ""}
                  </p>
                ) : null;
              })()}
            </div>

            <SectionDivider
              label="Products"
              action={
                <button
                  onClick={addFormItem}
                  className="flex items-center gap-1 text-[12px] text-primary font-semibold flex-shrink-0"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              }
            />
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Field label="Product">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateFormItem(idx, "product_id", e.target.value)}
                        className={`${innerCls} -ml-0.5`}
                      >
                        <option value="">— Select —</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({fmt(p.selling_price)})</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="w-20 flex-shrink-0">
                    <Field label="Qty">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateFormItem(idx, "quantity", parseInt(e.target.value) || 1)}
                        className={innerCls}
                      />
                    </Field>
                  </div>
                  <button
                    onClick={() => removeFormItem(idx)}
                    disabled={form.items.length === 1}
                    className="p-2 text-slate-300 hover:text-red-400 disabled:opacity-30 transition flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {error && <p className="text-[13px] text-red-500 bg-red-50 px-3 py-2 rounded-[8px]">{error}</p>}
          </div>

          <div className="px-4 pb-4 flex gap-3">
            <button
              onClick={closeForm}
              className="py-2.5 px-4 border border-slate-200 rounded-[8px] text-[14px] text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-ember-deep text-on-primary py-2.5 rounded-[8px] text-[14px] font-semibold transition disabled:opacity-50 shadow-sm shadow-ember/20"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Save Changes" : "Create Bundle"}
            </button>
          </div>
        </div>
      )}

      {/* Bundle list */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Package className="w-14 h-14 text-slate-200 mb-4" />
            <p className="text-slate-600 font-medium">
              {search ? "No bundles match your search" : "No bundles yet"}
            </p>
            {!search && (
              <p className="text-slate-400 text-sm mt-1">Group products into bundles to sell together at a special price</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((b) => {
              const componentSum = b.bundle_items.reduce(
                (s, bi) => s + (bi.products?.selling_price ?? 0) * bi.quantity, 0
              );
              const savings = componentSum - b.price;

              return (
                <div key={b.id} className={`px-4 py-4 ${!b.is_active ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-violet-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[14px] text-[#0F172A] truncate">{b.name}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          b.is_active
                            ? "bg-primary-soft text-primary"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {b.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {b.description && (
                        <p className="text-[12px] text-slate-400 mt-0.5 truncate">{b.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {b.bundle_items.map((bi, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                            {bi.products?.name ?? "Unknown"} ×{bi.quantity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="font-bold text-[14px] text-violet-700">{fmt(b.price)}</p>
                      {savings > 0 && (
                        <p className="text-[10px] text-success font-semibold mt-0.5">Save {fmt(savings)}</p>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openEdit(b)}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-[8px] transition active:bg-slate-50"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(b)}
                      disabled={togglingId === b.id}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-[8px] transition active:bg-slate-50 disabled:opacity-50"
                    >
                      {togglingId === b.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : b.is_active ? (
                        <ToggleRight className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      {b.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => setConfirmId(b.id)}
                      disabled={deletingId === b.id}
                      className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-red-500 px-3 py-1.5 rounded-[8px] transition active:bg-red-50 disabled:opacity-50"
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
      </div>

    </div>
    </>
  );
}
