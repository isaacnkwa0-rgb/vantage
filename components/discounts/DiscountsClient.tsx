"use client";

import { useState, useCallback } from "react";
import {
  Ticket, Plus, Trash2, ToggleLeft, ToggleRight, Copy,
  CheckCircle2, XCircle, Clock, Infinity, Loader2, X, AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface DiscountCode {
  id: string;
  code: string;
  name: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface Props {
  codes: DiscountCode[];
  businessId: string;
  currency: string;
  userId: string;
}

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const EMPTY_FORM = {
  code: "",
  name: "",
  discount_type: "percent" as "percent" | "fixed",
  discount_value: "",
  min_order_amount: "",
  max_uses: "",
  expires_at: "",
};

export function DiscountsClient({ codes: initial, businessId, currency, userId }: Props) {
  const [codes, setCodes]         = useState<DiscountCode[]>(initial);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [toggling, setToggling]   = useState<string | null>(null);
  const [copied, setCopied]       = useState<string | null>(null);

  const fmt = (n: number) => formatCurrency(n, currency);

  function resetForm() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(false);
  }

  async function handleSave() {
    if (!form.code.trim()) return setFormError("Code is required.");
    if (!form.name.trim()) return setFormError("Name is required.");
    const val = parseFloat(form.discount_value);
    if (!val || val <= 0) return setFormError("Enter a valid discount value.");
    if (form.discount_type === "percent" && val > 100) return setFormError("Percent discount cannot exceed 100.");

    setSaving(true);
    setFormError(null);
    const supabase = createClient();

    const payload = {
      business_id:      businessId,
      code:             form.code.trim().toUpperCase(),
      name:             form.name.trim(),
      discount_type:    form.discount_type,
      discount_value:   val,
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      max_uses:         form.max_uses ? parseInt(form.max_uses) : null,
      expires_at:       form.expires_at ? new Date(form.expires_at).toISOString() : null,
      created_by:       userId,
    };

    const { data, error } = await supabase
      .from("discount_codes")
      .insert(payload)
      .select()
      .single();

    if (error) {
      setFormError(error.message.includes("unique") ? "Code already exists for this business." : error.message);
      setSaving(false);
      return;
    }

    setCodes((prev) => [data as DiscountCode, ...prev]);
    resetForm();
    setSaving(false);
  }

  async function handleToggle(code: DiscountCode) {
    setToggling(code.id);
    const supabase = createClient();
    await supabase
      .from("discount_codes")
      .update({ is_active: !code.is_active, updated_at: new Date().toISOString() })
      .eq("id", code.id);
    setCodes((prev) => prev.map((c) => c.id === code.id ? { ...c, is_active: !c.is_active } : c));
    setToggling(null);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const supabase = createClient();
    await supabase.from("discount_codes").delete().eq("id", id);
    setCodes((prev) => prev.filter((c) => c.id !== id));
    setDeleting(null);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  function codeStatus(c: DiscountCode): "active" | "inactive" | "expired" | "maxed" {
    if (!c.is_active) return "inactive";
    if (c.expires_at && new Date(c.expires_at) < new Date()) return "expired";
    if (c.max_uses !== null && c.uses_count >= c.max_uses) return "maxed";
    return "active";
  }

  const STATUS_CONFIG = {
    active:   { label: "Active",    icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    inactive: { label: "Inactive",  icon: XCircle,      cls: "bg-slate-50 text-slate-500 border-slate-200" },
    expired:  { label: "Expired",   icon: Clock,        cls: "bg-orange-50 text-orange-600 border-orange-200" },
    maxed:    { label: "Limit hit", icon: XCircle,      cls: "bg-red-50 text-red-600 border-red-200" },
  };

  return (
    <div className="flex-1 p-5 space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{codes.length} code{codes.length !== 1 ? "s" : ""} created</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm({ ...EMPTY_FORM, code: generateCode() }); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-green-200 transition"
        >
          <Plus className="w-4 h-4" />
          New Code
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#0F172A]">Create Discount Code</h3>
            <button onClick={resetForm} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Code */}
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Code *</label>
              <div className="flex gap-2">
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SAVE20"
                  className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={() => setForm((f) => ({ ...f, code: generateCode() }))}
                  className="px-3 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-500 hover:bg-slate-50 transition whitespace-nowrap"
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Label *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Summer Sale, First Order"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Discount type + value */}
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Discount *</label>
              <div className="flex gap-2">
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as "percent" | "fixed" }))}
                  className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none"
                >
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed amount</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={form.discount_value}
                  onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                  placeholder={form.discount_type === "percent" ? "e.g. 10" : "e.g. 500"}
                  className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Min order */}
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Min. Order Amount <span className="font-normal text-slate-400">(optional)</span></label>
              <input
                type="number"
                min="0"
                value={form.min_order_amount}
                onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
                placeholder="0 = no minimum"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Max uses */}
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Max Uses <span className="font-normal text-slate-400">(optional)</span></label>
              <input
                type="number"
                min="1"
                value={form.max_uses}
                onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                placeholder="Leave blank for unlimited"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Expiry */}
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Expiry Date <span className="font-normal text-slate-400">(optional)</span></label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={resetForm} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving..." : "Create Code"}
            </button>
          </div>
        </div>
      )}

      {/* Codes list */}
      {codes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Ticket className="w-14 h-14 text-slate-200 mb-4" />
          <p className="text-slate-600 font-medium">No discount codes yet</p>
          <p className="text-slate-400 text-sm mt-1">Create a code and share it with customers to apply at checkout</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div className="w-36 flex-shrink-0">Code</div>
            <div className="flex-1">Label</div>
            <div className="w-28 flex-shrink-0 hidden sm:block">Discount</div>
            <div className="w-24 flex-shrink-0 hidden md:block">Usage</div>
            <div className="w-24 flex-shrink-0 hidden lg:block">Expiry</div>
            <div className="w-24 flex-shrink-0">Status</div>
            <div className="w-20 flex-shrink-0" />
          </div>

          <div className="divide-y divide-slate-50">
            {codes.map((c) => {
              const status = codeStatus(c);
              const { label, icon: StatusIcon, cls } = STATUS_CONFIG[status];
              const isToggling = toggling === c.id;
              const isDeleting = deleting === c.id;

              return (
                <div key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition group">
                  {/* Code */}
                  <div className="w-36 flex-shrink-0 flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#0F172A] tracking-wider">{c.code}</span>
                    <button
                      onClick={() => copyCode(c.code)}
                      className="opacity-0 group-hover:opacity-100 transition p-0.5 text-slate-400 hover:text-slate-600"
                      title="Copy code"
                    >
                      {copied === c.code ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{c.name}</p>
                    {c.min_order_amount > 0 && (
                      <p className="text-xs text-slate-400">Min. order: {fmt(c.min_order_amount)}</p>
                    )}
                  </div>

                  {/* Discount */}
                  <div className="w-28 flex-shrink-0 hidden sm:block">
                    <span className="text-sm font-semibold text-emerald-600">
                      {c.discount_type === "percent" ? `${c.discount_value}% off` : `-${fmt(c.discount_value)}`}
                    </span>
                  </div>

                  {/* Usage */}
                  <div className="w-24 flex-shrink-0 hidden md:flex items-center gap-1">
                    <span className="text-sm text-slate-600">{c.uses_count}</span>
                    <span className="text-slate-400 text-xs">
                      / {c.max_uses === null ? <Infinity className="w-3 h-3 inline" /> : c.max_uses}
                    </span>
                  </div>

                  {/* Expiry */}
                  <div className="w-24 flex-shrink-0 hidden lg:block">
                    <span className="text-xs text-slate-500">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Never"}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="w-24 flex-shrink-0">
                    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border", cls)}>
                      <StatusIcon className="w-3 h-3" />
                      {label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="w-20 flex-shrink-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleToggle(c)}
                      disabled={isToggling}
                      title={c.is_active ? "Deactivate" : "Activate"}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
                    >
                      {isToggling
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : c.is_active
                          ? <ToggleRight className="w-4 h-4 text-green-500" />
                          : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={isDeleting}
                      title="Delete code"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            {codes.length} discount code{codes.length !== 1 ? "s" : ""} · Codes are validated at POS and online checkout
          </div>
        </div>
      )}
    </div>
  );
}
