"use client";

import { useState } from "react";
import {
  Ticket, Plus, Trash2, ToggleLeft, ToggleRight, Copy,
  CheckCircle2, XCircle, Clock, Loader2, X, AlertCircle,
  Search, RefreshCw,
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

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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

const innerCls = "w-full text-sm bg-transparent focus:outline-none text-[#0F172A] placeholder:text-slate-400 pt-0.5 pb-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-slate-200 rounded-[8px] px-3 pt-0 pb-2 focus-within:border-primary transition">
      <legend className="text-[11px] font-medium text-slate-600 px-1 ml-0.5 leading-none">{label}</legend>
      {children}
    </fieldset>
  );
}

const STATUS_CONFIG = {
  active:   { label: "Active",    bg: "bg-primary-soft",  text: "text-primary", icon: CheckCircle2 },
  inactive: { label: "Inactive",  bg: "bg-slate-100",   text: "text-slate-500",   icon: XCircle },
  expired:  { label: "Expired",   bg: "bg-orange-50",   text: "text-orange-600",  icon: Clock },
  maxed:    { label: "Limit hit", bg: "bg-red-50",      text: "text-red-600",     icon: XCircle },
};

export function DiscountsClient({ codes: initial, businessId, currency, userId }: Props) {
  const [codes, setCodes]         = useState<DiscountCode[]>(initial);
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [toggling, setToggling]   = useState<string | null>(null);
  const [copied, setCopied]       = useState<string | null>(null);

  const fmt = (n: number) => formatCurrency(n, currency);

  const filtered = codes.filter((c) => {
    const q = search.toLowerCase();
    return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  });

  function resetForm() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(false);
  }

  function codeStatus(c: DiscountCode): "active" | "inactive" | "expired" | "maxed" {
    if (!c.is_active) return "inactive";
    if (c.expires_at && new Date(c.expires_at) < new Date()) return "expired";
    if (c.max_uses !== null && c.uses_count >= c.max_uses) return "maxed";
    return "active";
  }

  async function handleSave() {
    if (!form.code.trim()) return setFormError("Code is required.");
    if (!form.name.trim()) return setFormError("Label is required.");
    const val = parseFloat(form.discount_value);
    if (!val || val <= 0) return setFormError("Enter a valid discount value.");
    if (form.discount_type === "percent" && val > 100) return setFormError("Percent discount cannot exceed 100.");

    setSaving(true);
    setFormError(null);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("discount_codes")
      .insert({
        business_id:      businessId,
        code:             form.code.trim().toUpperCase(),
        name:             form.name.trim(),
        discount_type:    form.discount_type,
        discount_value:   val,
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        max_uses:         form.max_uses ? parseInt(form.max_uses) : null,
        expires_at:       form.expires_at ? new Date(form.expires_at).toISOString() : null,
        created_by:       userId,
      })
      .select()
      .single();

    if (error) {
      setFormError(error.message.includes("unique") ? "This code already exists." : error.message);
      setSaving(false);
      return;
    }

    setCodes((prev) => [data as DiscountCode, ...prev]);
    resetForm();
    setSaving(false);
  }

  async function handleToggle(c: DiscountCode) {
    setToggling(c.id);
    const supabase = createClient();
    await supabase
      .from("discount_codes")
      .update({ is_active: !c.is_active, updated_at: new Date().toISOString() })
      .eq("id", c.id);
    setCodes((prev) => prev.map((d) => d.id === c.id ? { ...d, is_active: !d.is_active } : d));
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

  return (
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
              onClick={() => { setShowForm(true); setForm({ ...EMPTY_FORM, code: generateCode() }); }}
              className="h-full flex items-center gap-1.5 px-3 bg-primary hover:bg-ember-deep text-on-primary rounded-[8px] text-[13px] font-semibold transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 pb-4 pt-2 space-y-3">

        {/* Inline create form */}
        {showForm && (
          <div className="border border-slate-200 rounded-[8px] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-bold text-[#0F172A]">New Discount Code</p>
              <button onClick={resetForm} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Code + generate */}
            <fieldset className="border border-slate-200 rounded-[8px] px-3 pt-0 pb-2 focus-within:border-primary transition">
              <legend className="text-[11px] font-medium text-slate-600 px-1 ml-0.5 leading-none">Code</legend>
              <div className="flex items-center gap-2">
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SAVE20"
                  className={`${innerCls} font-mono tracking-wider flex-1`}
                />
                <button
                  onClick={() => setForm((f) => ({ ...f, code: generateCode() }))}
                  className="p-1 text-slate-400 hover:text-primary transition flex-shrink-0"
                  title="Generate random code"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </fieldset>

            <Field label="Label">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Summer Sale, First Order"
                className={innerCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as "percent" | "fixed" }))}
                  className={`${innerCls} -ml-0.5`}
                >
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </Field>
              <Field label="Value">
                <input
                  type="number" min="0"
                  value={form.discount_value}
                  onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                  placeholder={form.discount_type === "percent" ? "e.g. 10" : "e.g. 500"}
                  className={innerCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Min. order (optional)">
                <input
                  type="number" min="0"
                  value={form.min_order_amount}
                  onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
                  placeholder="0 = none"
                  className={innerCls}
                />
              </Field>
              <Field label="Max uses (optional)">
                <input
                  type="number" min="1"
                  value={form.max_uses}
                  onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                  placeholder="Unlimited"
                  className={innerCls}
                />
              </Field>
            </div>

            <Field label="Expiry date (optional)">
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                className={innerCls}
              />
            </Field>

            {formError && (
              <div className="flex items-center gap-2 text-[13px] text-red-500 bg-red-50 px-3 py-2 rounded-[8px]">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {formError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={resetForm}
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
                {saving ? "Saving..." : "Create Code"}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {codes.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Ticket className="w-9 h-9 text-slate-300" />
            </div>
            <p className="text-[16px] font-bold text-slate-800">No discount codes yet</p>
            <p className="text-[13px] text-slate-400 mt-1.5 max-w-xs">Create a code and share it with customers to apply at checkout</p>
            <button
              onClick={() => { setShowForm(true); setForm({ ...EMPTY_FORM, code: generateCode() }); }}
              className="mt-6 flex items-center gap-2 bg-primary hover:bg-ember-deep text-on-primary px-5 py-3 rounded-xl text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              New Code
            </button>
          </div>
        )}

        {/* Code cards */}
        {filtered.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              {filtered.length} code{filtered.length !== 1 ? "s" : ""}
            </p>

            <div className="bg-white rounded-[8px] border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {filtered.map((c) => {
                const status = codeStatus(c);
                const { label, bg, text, icon: StatusIcon } = STATUS_CONFIG[status];

                return (
                  <div key={c.id} className="px-4 py-4">
                    {/* Main row */}
                    <div className="flex items-start gap-3">
                      <div className={cn("w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5", bg)}>
                        <StatusIcon className={cn("w-4 h-4", text)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[15px] text-slate-900 leading-none truncate max-w-[140px]">{c.name}</span>
                          <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0", bg, text)}>
                            {label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-mono text-[13px] text-slate-500 tracking-wider">{c.code}</span>
                          <button
                            onClick={() => copyCode(c.code)}
                            className="text-slate-400 hover:text-primary transition"
                          >
                            {copied === c.code
                              ? <CheckCircle2 className="w-3 h-3 text-primary" />
                              : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        {c.expires_at && (
                          <p className="text-[12px] text-slate-400 mt-0.5">
                            Expires <span suppressHydrationWarning>{shortDate(c.expires_at)}</span>
                          </p>
                        )}
                        {c.min_order_amount > 0 && (
                          <p className="text-[12px] text-slate-400">Min. {fmt(c.min_order_amount)}</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[15px] font-bold text-[#0F172A] leading-none">
                          {c.discount_type === "percent" ? `${c.discount_value}%` : fmt(c.discount_value)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {c.uses_count}/{c.max_uses ?? "∞"} used
                        </span>
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="flex items-center gap-2 mt-3 pl-[52px]">
                      <button
                        onClick={() => handleToggle(c)}
                        disabled={toggling === c.id}
                        className={cn(
                          "flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg border transition active:scale-95 disabled:opacity-50",
                          c.is_active
                            ? "text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100"
                            : "text-primary bg-primary-soft border-primary hover:bg-primary-soft"
                        )}
                      >
                        {toggling === c.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : c.is_active
                            ? <ToggleRight className="w-3 h-3 text-primary" />
                            : <ToggleLeft className="w-3 h-3" />}
                        {c.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting === c.id}
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition active:scale-95 disabled:opacity-50"
                      >
                        {deleting === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No results from search */}
        {codes.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[16px] font-bold text-slate-800">No codes found</p>
            <p className="text-[13px] text-slate-400 mt-1.5">Try a different search</p>
          </div>
        )}

        <div className="h-6" />
      </div>

    </div>
  );
}
