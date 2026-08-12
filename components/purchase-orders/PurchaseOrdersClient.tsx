"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Plus, ShoppingBag, Search, Trash2, Eye, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface POItem {
  id?: string;
  description: string;
  quantity: number;
  unit_cost: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  status: "draft" | "sent" | "received" | "cancelled";
  supplier_id: string | null;
  suppliers: { name: string } | null;
  total_amount: number;
  expected_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Props {
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  currency: string;
  businessId: string;
  userId: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  received: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

function nextPONumber(orders: PurchaseOrder[]): string {
  const nums = orders
    .map((o) => parseInt(o.po_number.replace(/\D/g, ""), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `PO-${String(max + 1).padStart(4, "0")}`;
}

export function PurchaseOrdersClient({ orders: initialOrders, suppliers, currency, businessId, userId }: Props) {
  const supabase = createClient();
  const fmt = (n: number) => formatCurrency(n, currency);

  const [orders, setOrders] = useState<PurchaseOrder[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    supplier_id: "",
    expected_date: "",
    notes: "",
  });
  const [items, setItems] = useState<POItem[]>([{ description: "", quantity: 1, unit_cost: 0 }]);

  const filtered = orders.filter(
    (o) =>
      o.po_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.suppliers?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const itemsTotal = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unit_cost: 0 }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof POItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function closeCreate() {
    setShowCreate(false);
    setForm({ supplier_id: "", expected_date: "", notes: "" });
    setItems([{ description: "", quantity: 1, unit_cost: 0 }]);
  }

  async function createPO() {
    if (items.every((i) => !i.description.trim())) return;
    setSaving(true);
    const po_number = nextPONumber(orders);

    const { data: po, error } = await supabase
      .from("purchase_orders")
      .insert({
        business_id: businessId,
        supplier_id: form.supplier_id || null,
        po_number,
        status: "draft",
        notes: form.notes.trim() || null,
        total_amount: itemsTotal,
        expected_date: form.expected_date || null,
        created_by: userId,
      })
      .select("*, suppliers(name)")
      .single();

    if (!error && po) {
      const validItems = items.filter((i) => i.description.trim());
      if (validItems.length > 0) {
        await supabase.from("purchase_order_items").insert(
          validItems.map((i) => ({ po_id: po.id, description: i.description, quantity: i.quantity, unit_cost: i.unit_cost }))
        );
      }
      setOrders((prev) => [po as PurchaseOrder, ...prev]);
      closeCreate();
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: PurchaseOrder["status"]) {
    const patch: Record<string, string> = { status };
    if (status === "received") patch.received_date = new Date().toISOString().split("T")[0];
    await supabase.from("purchase_orders").update(patch).eq("id", id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    if (viewOrder?.id === id) setViewOrder((v) => (v ? { ...v, ...patch } : v));
  }

  async function deletePO(id: string) {
    await supabase.from("purchase_orders").delete().eq("id", id);
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (viewOrder?.id === id) setViewOrder(null);
  }

  return (
    <div className="flex-1 p-5 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search POs..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New PO
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-[#0F172A]">No purchase orders yet</p>
          <p className="text-xs text-slate-400">Create a PO to track orders from your suppliers</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                <th className="text-left px-5 py-3">PO Number</th>
                <th className="text-left px-5 py-3">Supplier</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Total</th>
                <th className="text-left px-5 py-3">Expected</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 transition group">
                  <td className="px-5 py-3 text-sm font-mono font-semibold text-[#0F172A]">{o.po_number}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{o.suppliers?.name ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", STATUS_STYLES[o.status])}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-numeric text-sm font-semibold text-[#0F172A]">{fmt(o.total_amount)}</td>
                  <td className="px-5 py-3 text-sm text-slate-500">{o.expected_date ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition justify-end">
                      <button onClick={() => setViewOrder(o)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {o.status === "draft" && (
                        <button onClick={() => deletePO(o.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create PO modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">New Purchase Order</h3>
              <button onClick={closeCreate} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Supplier</label>
                <select
                  value={form.supplier_id}
                  onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">— None —</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Expected Date</label>
                <input
                  type="date"
                  value={form.expected_date}
                  onChange={(e) => setForm({ ...form, expected_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Line Items</p>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      placeholder="Item description"
                      className="col-span-6 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                      className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      min="0"
                      value={item.unit_cost}
                      onChange={(e) => updateItem(idx, "unit_cost", parseFloat(e.target.value) || 0)}
                      placeholder="Cost"
                      className="col-span-3 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button onClick={() => removeItem(idx)} className="col-span-1 flex justify-center text-slate-300 hover:text-red-500 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addItem} className="mt-2 flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-semibold">
                <Plus className="w-3.5 h-3.5" /> Add item
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <p className="text-sm font-semibold text-[#0F172A]">Total</p>
              <p className="font-numeric text-lg font-bold text-[#0F172A]">{fmt(itemsTotal)}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Optional notes..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={closeCreate} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">
                Cancel
              </button>
              <button
                onClick={createPO}
                disabled={saving || items.every((i) => !i.description.trim())}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create PO"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View PO modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">{viewOrder.po_number}</h3>
                <p className="text-xs text-slate-400">{viewOrder.suppliers?.name ?? "No supplier"}</p>
              </div>
              <button onClick={() => setViewOrder(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", STATUS_STYLES[viewOrder.status])}>
                {viewOrder.status}
              </span>
              <p className="text-xs text-slate-400">Total: <span className="font-bold text-[#0F172A]">{fmt(viewOrder.total_amount)}</span></p>
            </div>

            {viewOrder.notes && <p className="text-sm text-slate-500">{viewOrder.notes}</p>}

            <div className="flex gap-2 border-t border-slate-100 pt-3 flex-wrap">
              {viewOrder.status === "draft" && (
                <button onClick={() => updateStatus(viewOrder.id, "sent")} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition">
                  Mark as Sent
                </button>
              )}
              {viewOrder.status === "sent" && (
                <button onClick={() => updateStatus(viewOrder.id, "received")} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition">
                  Mark as Received
                </button>
              )}
              {(viewOrder.status === "draft" || viewOrder.status === "sent") && (
                <button onClick={() => updateStatus(viewOrder.id, "cancelled")} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition">
                  Cancel PO
                </button>
              )}
              <button onClick={() => setViewOrder(null)} className="ml-auto px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
