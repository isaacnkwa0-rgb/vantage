"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Gift, Plus, Search, Copy, CheckCheck, X, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; iconBg: string; iconColor: string }> = {
  active:   { label: "Active",   bg: "bg-emerald-50",  text: "text-emerald-700", iconBg: "bg-emerald-50",  iconColor: "text-emerald-500" },
  redeemed: { label: "Redeemed", bg: "bg-slate-100",   text: "text-slate-500",   iconBg: "bg-slate-100",   iconColor: "text-slate-400" },
  expired:  { label: "Expired",  bg: "bg-amber-50",    text: "text-amber-700",   iconBg: "bg-amber-50",    iconColor: "text-amber-500" },
  voided:   { label: "Voided",   bg: "bg-red-50",      text: "text-red-600",     iconBg: "bg-red-50",      iconColor: "text-red-400" },
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 16 }, (_, i) =>
    (i > 0 && i % 4 === 0 ? "-" : chars[Math.floor(Math.random() * chars.length)])
  ).join("");
}

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

export function GiftCardsClient({ cards: initialCards, customers, currency, businessId, userId }: Props) {
  const fmt = (n: number) => formatCurrency(n, currency);

  const [cards, setCards]         = useState<GiftCard[]>(initialCards);
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [copiedId, setCopiedId]   = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [form, setForm] = useState({
    code:           generateCode(),
    initial_value:  "",
    customer_id:    "",
    customer_email: "",
    expires_at:     "",
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

  function openForm() {
    setForm({ code: generateCode(), initial_value: "", customer_id: "", customer_email: "", expires_at: "" });
    setShowForm(true);
  }

  async function create() {
    if (!form.initial_value) return;
    setSaving(true);
    const supabase = createClient();
    const val = parseFloat(form.initial_value);
    const selectedCustomer = customers.find((c) => c.id === form.customer_id);
    const { data, error } = await supabase
      .from("gift_cards")
      .insert({
        business_id:    businessId,
        code:           form.code,
        initial_value:  val,
        balance:        val,
        customer_id:    form.customer_id || null,
        customer_email: (selectedCustomer?.email ?? form.customer_email) || null,
        status:         "active",
        expires_at:     form.expires_at || null,
        created_by:     userId,
      })
      .select("*, customers(name)")
      .single();
    if (!error && data) {
      setCards((prev) => [data as GiftCard, ...prev]);
      setShowForm(false);
    }
    setSaving(false);
  }

  async function voidCard() {
    if (!confirmId) return;
    setVoidingId(confirmId);
    const supabase = createClient();
    const { error } = await supabase.from("gift_cards").update({ status: "voided" }).eq("id", confirmId);
    setVoidingId(null);
    setConfirmId(null);
    if (error) { toast.error("Failed to void gift card"); return; }
    setCards((prev) => prev.map((c) => (c.id === confirmId ? { ...c, status: "voided" as const } : c)));
  }

  const activeCards   = cards.filter((c) => c.status === "active");
  const activeTotal   = activeCards.reduce((s, c) => s + c.balance, 0);
  const redeemedCount = cards.filter((c) => c.status === "redeemed").length;

  return (
    <>
    <ConfirmDialog
      open={!!confirmId}
      title="Void gift card?"
      message="This gift card will be voided and can no longer be used by the recipient."
      confirmLabel="Void Card"
      loading={!!voidingId}
      onConfirm={voidCard}
      onCancel={() => setConfirmId(null)}
    />
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
            onClick={openForm}
            className="h-full flex items-center gap-1.5 px-3 bg-[#1a9c38] hover:bg-green-700 text-white rounded-[8px] text-[13px] font-semibold transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-slate-200 rounded-[8px] p-3 text-center">
          <p className="text-[20px] font-extrabold text-[#0F172A]">{activeCards.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active</p>
        </div>
        <div className="border border-slate-200 rounded-[8px] p-3 text-center">
          <p className="text-[15px] font-extrabold text-[#1a9c38] leading-tight mt-0.5">{fmt(activeTotal)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Outstanding</p>
        </div>
        <div className="border border-slate-200 rounded-[8px] p-3 text-center">
          <p className="text-[20px] font-extrabold text-slate-500">{redeemedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Redeemed</p>
        </div>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="border border-slate-200 rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-[13px] font-semibold text-[#0F172A]">Issue Gift Card</span>
            <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-600 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 pt-4 pb-3 space-y-4">
            <SectionDivider label="Card" />
            <div className="space-y-3">
              {/* Code field with regenerate */}
              <fieldset className="border border-slate-200 rounded-[8px] px-3 pt-0 pb-2 focus-within:border-[#1a9c38] transition">
                <legend className="text-[11px] font-medium text-slate-600 px-1 ml-0.5 leading-none">Card code</legend>
                <div className="flex items-center gap-2">
                  <input
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className={`${innerCls} font-mono tracking-widest flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, code: generateCode() }))}
                    className="flex-shrink-0 p-1 text-slate-400 hover:text-[#1a9c38] transition"
                    title="Regenerate code"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </fieldset>

              <Field label={`Value (${currency}) *`}>
                <input
                  type="number"
                  min="0"
                  value={form.initial_value}
                  onChange={(e) => setForm((f) => ({ ...f, initial_value: e.target.value }))}
                  placeholder="0.00"
                  className={innerCls}
                />
              </Field>

              <Field label="Expiry date (optional)">
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                  className={innerCls}
                />
              </Field>
            </div>

            <SectionDivider label="Recipient" />
            <div className="space-y-3">
              <Field label="Customer (optional)">
                <select
                  value={form.customer_id}
                  onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}
                  className={`${innerCls} -ml-0.5`}
                >
                  <option value="">— None —</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              {!form.customer_id && (
                <Field label="Recipient email">
                  <input
                    type="email"
                    value={form.customer_email}
                    onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
                    placeholder="recipient@example.com"
                    className={innerCls}
                  />
                </Field>
              )}
            </div>
          </div>

          <div className="px-4 pb-4 flex gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="py-2.5 px-4 border border-slate-200 rounded-[8px] text-[14px] text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={create}
              disabled={saving || !form.initial_value}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1a9c38] hover:bg-green-700 text-white py-2.5 rounded-[8px] text-[14px] font-semibold transition disabled:opacity-50 shadow-sm shadow-green-900/20"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Issue Card
            </button>
          </div>
        </div>
      )}

      {/* Cards list */}
      {filtered.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Gift className="w-9 h-9 text-slate-300" />
          </div>
          <p className="text-[16px] font-bold text-slate-800">
            {search ? "No gift cards found" : "No gift cards yet"}
          </p>
          <p className="text-[13px] text-slate-400 mt-1.5 max-w-xs">
            {search ? "Try a different search" : "Issue a gift card to get started"}
          </p>
        </div>
      ) : filtered.length > 0 && (
        <>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            {filtered.length} card{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="bg-white rounded-[8px] border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {filtered.map((card) => {
              const sc = STATUS_CONFIG[card.status] ?? STATUS_CONFIG.active;
              const isVoiding = voidingId === card.id;
              const pctUsed = card.initial_value > 0
                ? Math.round(((card.initial_value - card.balance) / card.initial_value) * 100)
                : 0;

              return (
                <div key={card.id} className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5", sc.iconBg)}>
                      <Gift className={cn("w-4 h-4", sc.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-[13px] text-[#0F172A] tracking-wider">{card.code}</span>
                        <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0", sc.bg, sc.text)}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-500 mt-0.5">
                        {card.customers?.name ?? card.customer_email ?? <span className="text-slate-300">No recipient</span>}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[13px] font-semibold text-[#1a9c38]">{fmt(card.balance)}</span>
                        <span className="text-[12px] text-slate-400">of {fmt(card.initial_value)}</span>
                        {card.expires_at && (
                          <span className="text-[12px] text-slate-400">
                            · expires {shortDate(card.expires_at)}
                          </span>
                        )}
                      </div>

                      {/* Balance bar */}
                      {card.initial_value > 0 && (
                        <div className="mt-2 h-1 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", card.status === "active" ? "bg-[#1a9c38]" : "bg-slate-300")}
                            style={{ width: `${100 - pctUsed}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-2 mt-3 pl-[52px]">
                    <button
                      onClick={() => copyCode(card.id, card.code)}
                      className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition active:scale-95"
                    >
                      {copiedId === card.id
                        ? <><CheckCheck className="w-3 h-3 text-[#1a9c38]" /> Copied</>
                        : <><Copy className="w-3 h-3" /> Copy Code</>}
                    </button>
                    {card.status === "active" && (
                      <button
                        onClick={() => setConfirmId(card.id)}
                        disabled={isVoiding}
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg transition active:scale-95 disabled:opacity-50"
                      >
                        {isVoiding ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Void
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
    </>
  );
}
