"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Truck, Search, Phone, Mail, MapPin, Trash2, Edit2, X, Loader2, User } from "lucide-react";

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

export function SuppliersClient({ suppliers: initialSuppliers, businessId }: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.phone ?? "").includes(search)
  );

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(s: Supplier) {
    setEditingId(s.id);
    setForm({
      name:         s.name,
      contact_name: s.contact_name ?? "",
      email:        s.email ?? "",
      phone:        s.phone ?? "",
      address:      s.address ?? "",
      notes:        s.notes ?? "",
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
    const supabase = createClient();
    const payload = {
      name:         form.name.trim(),
      contact_name: form.contact_name.trim() || null,
      email:        form.email.trim() || null,
      phone:        form.phone.trim() || null,
      address:      form.address.trim() || null,
      notes:        form.notes.trim() || null,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("suppliers").update(payload).eq("id", editingId).select().single();
      if (!error && data) {
        setSuppliers((prev) => prev.map((s) => (s.id === editingId ? (data as Supplier) : s)));
        closeForm();
      }
    } else {
      const { data, error } = await supabase
        .from("suppliers").insert({ ...payload, business_id: businessId }).select().single();
      if (!error && data) {
        setSuppliers((prev) => [data as Supplier, ...prev]);
        closeForm();
      }
    }
    setSaving(false);
  }

  async function deleteSupplier(id: string) {
    if (!confirm("Remove this supplier?")) return;
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("suppliers").update({ is_active: false }).eq("id", id);
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-6 space-y-4">

      {/* Search + New */}
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
        {!showForm && (
          <button
            onClick={openCreate}
            className="h-full flex items-center gap-1.5 px-3 bg-[#1a9c38] hover:bg-green-700 text-white rounded-[8px] text-[13px] font-semibold transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="border border-slate-200 rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-[13px] font-semibold text-[#0F172A]">
              {editingId ? "Edit Supplier" : "New Supplier"}
            </span>
            <button onClick={closeForm} className="p-1 text-slate-400 hover:text-slate-600 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 pt-4 pb-3 space-y-4">
            <SectionDivider label="Details" />
            <div className="space-y-3">
              <Field label="Supplier name *">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. ABC Distributors"
                  className={innerCls}
                />
              </Field>
              <Field label="Contact person">
                <input
                  value={form.contact_name}
                  onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className={innerCls}
                />
              </Field>
            </div>

            <SectionDivider label="Contact" />
            <div className="space-y-3">
              <Field label="Phone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+234..."
                  className={innerCls}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="supplier@example.com"
                  className={innerCls}
                />
              </Field>
              <Field label="Address">
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Street, City"
                  className={innerCls}
                />
              </Field>
            </div>

            <SectionDivider label="Notes" />
            <fieldset className="border border-slate-200 rounded-[8px] px-3 pt-0 pb-2 focus-within:border-[#1a9c38] transition">
              <legend className="text-[11px] font-medium text-slate-600 px-1 ml-0.5 leading-none">Notes</legend>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional notes..."
                rows={2}
                className={`${innerCls} resize-none`}
              />
            </fieldset>
          </div>

          <div className="px-4 pb-4 flex gap-3">
            <button
              onClick={closeForm}
              className="py-2.5 px-4 border border-slate-200 rounded-[8px] text-[14px] text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !form.name.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1a9c38] hover:bg-green-700 text-white py-2.5 rounded-[8px] text-[14px] font-semibold transition disabled:opacity-50 shadow-sm shadow-green-900/20"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Update Supplier" : "Add Supplier"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Truck className="w-9 h-9 text-slate-300" />
          </div>
          <p className="text-[16px] font-bold text-slate-800">
            {search ? "No suppliers found" : "No suppliers yet"}
          </p>
          <p className="text-[13px] text-slate-400 mt-1.5 max-w-xs">
            {search ? "Try a different search" : "Add your first supplier to get started"}
          </p>
        </div>
      ) : filtered.length > 0 && (
        <>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            {filtered.length} supplier{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="bg-white rounded-[8px] border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {filtered.map((s) => (
              <div key={s.id} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center mt-0.5 text-blue-600 font-extrabold text-[15px]">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] text-slate-900 leading-tight truncate">{s.name}</p>
                    {s.contact_name && (
                      <p className="flex items-center gap-1 text-[13px] text-slate-500 mt-0.5">
                        <User className="w-3 h-3 flex-shrink-0" />
                        {s.contact_name}
                      </p>
                    )}
                    <div className="flex flex-col gap-0.5 mt-1">
                      {s.phone && (
                        <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-[#1a9c38] transition">
                          <Phone className="w-3 h-3 flex-shrink-0" />{s.phone}
                        </a>
                      )}
                      {s.email && (
                        <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-[#1a9c38] transition truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />{s.email}
                        </a>
                      )}
                      {s.address && (
                        <p className="flex items-center gap-1.5 text-[12px] text-slate-400">
                          <MapPin className="w-3 h-3 flex-shrink-0" />{s.address}
                        </p>
                      )}
                    </div>
                    {s.notes && (
                      <p className="text-[12px] text-slate-400 mt-1.5 italic line-clamp-2">{s.notes}</p>
                    )}
                  </div>
                </div>

                {/* Action row */}
                <div className="flex items-center gap-2 mt-3 pl-[52px]">
                  <button
                    onClick={() => openEdit(s)}
                    className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition active:scale-95"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => deleteSupplier(s.id)}
                    disabled={deletingId === s.id}
                    className="flex items-center gap-1.5 text-[13px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg transition active:scale-95 disabled:opacity-50"
                  >
                    {deletingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
