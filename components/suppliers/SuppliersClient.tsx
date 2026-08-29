"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Truck, Search, Phone, Mail, MapPin, Trash2, Edit2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
}

interface Props {
  suppliers: Supplier[];
  businessId: string;
}

const EMPTY_FORM = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
};

export function SuppliersClient({ suppliers: initialSuppliers, businessId }: Props) {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(s: Supplier) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      contact_name: s.contact_name ?? "",
      email: s.email ?? "",
      phone: s.phone ?? "",
      address: s.address ?? "",
      notes: s.notes ?? "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      contact_name: form.contact_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("suppliers")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();
      if (!error && data) {
        setSuppliers((prev) => prev.map((s) => (s.id === editingId ? (data as Supplier) : s)));
        closeForm();
      }
    } else {
      const { data, error } = await supabase
        .from("suppliers")
        .insert({ ...payload, business_id: businessId })
        .select()
        .single();
      if (!error && data) {
        setSuppliers((prev) => [data as Supplier, ...prev]);
        closeForm();
      }
    }
    setSaving(false);
  }

  async function deleteSupplier(id: string) {
    setDeletingId(id);
    await supabase.from("suppliers").update({ is_active: false }).eq("id", id);
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    setDeletingId(null);
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
            placeholder="Search suppliers..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <Truck className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#0F172A]">{suppliers.length}</p>
          <p className="text-xs text-slate-400">Total Suppliers</p>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <Truck className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">No suppliers yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Add your first supplier to get started</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                <th className="text-left px-5 py-3">Supplier</th>
                <th className="text-left px-5 py-3">Contact</th>
                <th className="text-left px-5 py-3">Phone</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">{s.name}</p>
                        {s.address && (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{s.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{s.contact_name ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {s.phone
                      ? <a href={`tel:${s.phone}`} className="hover:text-green-600 flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</a>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {s.email
                      ? <a href={`mailto:${s.email}`} className="hover:text-green-600 flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</a>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition justify-end">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteSupplier(s.id)} disabled={deletingId === s.id} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">{editingId ? "Edit Supplier" : "Add Supplier"}</h3>
              <button onClick={closeForm} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: "Supplier Name *", key: "name", placeholder: "e.g. ABC Distributors" },
                { label: "Contact Person", key: "contact_name", placeholder: "e.g. John Doe" },
                { label: "Phone", key: "phone", placeholder: "+234..." },
                { label: "Email", key: "email", placeholder: "supplier@example.com" },
                { label: "Address", key: "address", placeholder: "Street, City" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={closeForm} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !form.name.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Add Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
