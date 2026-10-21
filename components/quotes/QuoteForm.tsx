"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface Business {
  id: string;
  currency: string;
}

interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface ExistingQuote {
  id: string;
  quote_number: string;
  status: string;
  issue_date: string;
  valid_until: string | null;
  client_name: string | null;
  client_email: string | null;
  client_address: string | null;
  notes: string | null;
  terms: string | null;
  customers: { name: string; phone: string | null } | null;
}

interface Props {
  business: Business;
  customers: Customer[];
  editingQuote: ExistingQuote | null;
  userId: string;
  backHref: string;
  initialItems?: QuoteItem[];
}

export function QuoteForm({ business, customers, editingQuote, userId, backHref, initialItems }: Props) {
  const router = useRouter();
  const isEdit = !!editingQuote;

  const [clientMode, setClientMode] = useState<"existing" | "manual">(
    editingQuote?.customers ? "existing" : "manual"
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [clientName, setClientName]     = useState(editingQuote?.client_name ?? "");
  const [clientPhone, setClientPhone]   = useState("");
  const [clientEmail, setClientEmail]   = useState(editingQuote?.client_email ?? "");
  const [clientAddress, setClientAddress] = useState(editingQuote?.client_address ?? "");
  const [issueDate, setIssueDate]       = useState(
    editingQuote?.issue_date ?? new Date().toISOString().split("T")[0]
  );
  const [validUntil, setValidUntil]     = useState(editingQuote?.valid_until ?? "");
  const [status, setStatus]             = useState(editingQuote?.status ?? "sent");
  const [notes, setNotes]               = useState(editingQuote?.notes ?? "");
  const [terms, setTerms]               = useState(editingQuote?.terms ?? "");
  const [items, setItems]               = useState<QuoteItem[]>(
    initialItems && initialItems.length > 0
      ? initialItems
      : [{ description: "", quantity: 1, unit_price: 0 }]
  );
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (!editingQuote?.id || (initialItems && initialItems.length > 0)) return;
    setLoadingItems(true);
    const supabase = createClient();
    supabase
      .from("quote_items")
      .select("description, quantity, unit_price")
      .eq("quote_id", editingQuote.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setItems(data.map((i) => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price })));
        }
        setLoadingItems(false);
      });
  }, [editingQuote?.id]);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unit_price: 0 }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof QuoteItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function autofillCustomer(id: string) {
    setSelectedCustomerId(id);
    const c = customers.find((c) => c.id === id);
    if (c) {
      setClientName(c.name);
      setClientPhone(c.phone ?? "");
      setClientEmail(c.email ?? "");
      setClientAddress(c.address ?? "");
    }
  }

  async function handleSave(saveStatus: string) {
    if (items.every((i) => !i.description.trim())) {
      setError("Add at least one line item with a description");
      return;
    }
    setError(null);
    setSaving(true);
    const supabase = createClient();

    const payload = {
      client_name:    clientName || null,
      client_phone:   clientPhone || null,
      client_email:   clientEmail || null,
      client_address: clientAddress || null,
      customer_id:    clientMode === "existing" && selectedCustomerId ? selectedCustomerId : null,
      issue_date:     issueDate,
      valid_until:    validUntil || null,
      status:         saveStatus,
      subtotal,
      discount_amount: 0,
      tax_amount:      0,
      total_amount:    subtotal,
      notes:  notes || null,
      terms:  terms || null,
    };

    let quoteId = editingQuote?.id;

    if (isEdit && quoteId) {
      const { error: updErr } = await supabase.from("quotes").update(payload).eq("id", quoteId);
      if (updErr) { setError(updErr.message); setSaving(false); return; }
      await supabase.from("quote_items").delete().eq("quote_id", quoteId);
    } else {
      const { data: numData } = await supabase
        .rpc("generate_quote_number", { p_business_id: business.id })
        .single<string>();
      const quoteNumber = numData ?? `QTE-${Date.now()}`;

      const { data: q, error: qErr } = await supabase
        .from("quotes")
        .insert({ ...payload, business_id: business.id, quote_number: quoteNumber, created_by: userId })
        .select("id")
        .single();

      if (qErr || !q) {
        setError(qErr?.message ?? "Failed to create quote");
        setSaving(false);
        return;
      }
      quoteId = q.id;
    }

    const validItems = items.filter((i) => i.description.trim());
    if (validItems.length > 0) {
      const { error: itemErr } = await supabase.from("quote_items").insert(
        validItems.map((i) => ({
          quote_id:    quoteId,
          description: i.description,
          quantity:    i.quantity,
          unit_price:  i.unit_price,
          line_total:  i.quantity * i.unit_price,
        }))
      );
      if (itemErr) toast.error("Quote saved but line items may not have saved");
    }

    setSaving(false);
    router.push(backHref);
    router.refresh();
  }

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

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-5 pb-32 space-y-4">

        {/* Client */}
        <SectionDivider label="Client" />
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setClientMode("existing")}
              className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-semibold border transition ${clientMode === "existing" ? "bg-primary text-on-primary border-primary" : "border-slate-200 text-slate-500 bg-white"}`}
            >
              Existing customer
            </button>
            <button
              onClick={() => setClientMode("manual")}
              className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-semibold border transition ${clientMode === "manual" ? "bg-primary text-on-primary border-primary" : "border-slate-200 text-slate-500 bg-white"}`}
            >
              Manual entry
            </button>
          </div>

          {clientMode === "existing" && (
            <Field label="Select customer">
              <select value={selectedCustomerId} onChange={(e) => autofillCustomer(e.target.value)} className={`${innerCls} -ml-0.5`}>
                <option value="">— Choose —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}

          <Field label="Client name">
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Precious Okafor" className={innerCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+234..." className={innerCls} />
            </Field>
            <Field label="Email (optional)">
              <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="email@..." className={innerCls} />
            </Field>
          </div>
          <Field label="Address (optional)">
            <input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Client address" className={innerCls} />
          </Field>
        </div>

        {/* Quote Details */}
        <SectionDivider label="Quote Details" />
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Issue date">
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={innerCls} />
            </Field>
            <Field label="Valid until">
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={innerCls} />
            </Field>
          </div>
          {isEdit && (
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${innerCls} -ml-0.5`}>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
                <option value="converted">Converted</option>
              </select>
            </Field>
          )}
        </div>

        {/* Line Items */}
        <SectionDivider
          label="Line Items"
          action={
            !loadingItems && (
              <button onClick={addItem} className="flex items-center gap-1 text-[12px] text-primary font-semibold flex-shrink-0">
                <Plus className="w-3 h-3" /> Add
              </button>
            )
          }
        />

        {loadingItems ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="rounded-[8px] space-y-2">
                <Field label="Description">
                  <input
                    placeholder="Item name or service"
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    className={innerCls}
                  />
                </Field>
                <div className="flex items-center gap-2">
                  <div className="w-20 flex-shrink-0">
                    <Field label="Qty">
                      <input
                        type="number" min="1" placeholder="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 1)}
                        className={innerCls}
                      />
                    </Field>
                  </div>
                  <div className="flex-1">
                    <Field label="Unit price">
                      <input
                        type="number" min="0" step="0.01" placeholder="0.00"
                        value={item.unit_price || ""}
                        onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)}
                        className={innerCls}
                      />
                    </Field>
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="p-2 text-slate-300 hover:text-red-400 disabled:opacity-30 transition flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between text-[13px] text-slate-500 px-0.5">
                  <span>Line total</span>
                  <span className="font-semibold text-slate-700">{(item.quantity * item.unit_price).toLocaleString("en", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center px-3 py-3 bg-slate-100 rounded-[8px] text-[15px] font-bold text-[#0F172A]">
              <span>Total</span>
              <span>{subtotal.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <SectionDivider label="Additional Info" />
        <div className="space-y-3">
          <Field label="Notes (optional)">
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for the client..." className={`${innerCls} resize-none`} />
          </Field>
          <Field label="Terms & Conditions (optional)">
            <textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="e.g. Quote valid for 14 days. 50% deposit required..." className={`${innerCls} resize-none`} />
          </Field>
        </div>

        {error && <p className="text-[13px] text-red-500 bg-red-50 px-3 py-2 rounded-[8px]">{error}</p>}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.push(backHref)}
          className="py-2.5 px-4 border border-slate-200 rounded-[8px] text-[14px] text-slate-600 hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={() => handleSave("draft")}
          disabled={saving || loadingItems}
          className="py-2.5 px-4 border border-slate-200 rounded-[8px] text-[14px] text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
        >
          Save Draft
        </button>
        <button
          onClick={() => handleSave(isEdit ? status : "sent")}
          disabled={saving || loadingItems}
          className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-ember-deep text-on-primary py-2.5 rounded-[8px] text-[14px] font-semibold transition disabled:opacity-50 shadow-sm shadow-ember/20"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create & Send"}
        </button>
      </div>
    </div>
  );
}
