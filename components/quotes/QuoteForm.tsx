"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
  onClose: () => void;
}

export function QuoteForm({ business, customers, editingQuote, userId, onClose }: Props) {
  const router = useRouter();
  const isEdit = !!editingQuote;

  const [clientMode, setClientMode] = useState<"existing" | "manual">(
    editingQuote?.customers ? "existing" : "manual"
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [clientName, setClientName] = useState(editingQuote?.client_name ?? "");
  const [clientEmail, setClientEmail] = useState(editingQuote?.client_email ?? "");
  const [clientAddress, setClientAddress] = useState(editingQuote?.client_address ?? "");
  const [issueDate, setIssueDate] = useState(
    editingQuote?.issue_date ?? new Date().toISOString().split("T")[0]
  );
  const [validUntil, setValidUntil] = useState(editingQuote?.valid_until ?? "");
  const [notes, setNotes] = useState(editingQuote?.notes ?? "");
  const [terms, setTerms] = useState(editingQuote?.terms ?? "");
  const [items, setItems] = useState<QuoteItem[]>([{ description: "", quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (!editingQuote?.id) return;
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
      client_name: clientName || null,
      client_email: clientEmail || null,
      client_address: clientAddress || null,
      customer_id: clientMode === "existing" && selectedCustomerId ? selectedCustomerId : null,
      issue_date: issueDate,
      valid_until: validUntil || null,
      status: saveStatus,
      subtotal,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: subtotal,
      notes: notes || null,
      terms: terms || null,
    };

    let quoteId = editingQuote?.id;

    if (isEdit && quoteId) {
      await supabase.from("quotes").update(payload).eq("id", quoteId);
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
    await supabase.from("quote_items").insert(
      validItems.map((i) => ({
        quote_id: quoteId,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: i.quantity * i.unit_price,
      }))
    );

    setSaving(false);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="font-bold text-[#0F172A]">
            {isEdit ? `Edit ${editingQuote.quote_number}` : "New Quotation"}
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Client */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setClientMode("existing")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${clientMode === "existing" ? "bg-green-600 text-white border-green-600" : "border-slate-200 text-slate-500"}`}
              >
                Existing customer
              </button>
              <button
                onClick={() => setClientMode("manual")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${clientMode === "manual" ? "bg-green-600 text-white border-green-600" : "border-slate-200 text-slate-500"}`}
              >
                Manual entry
              </button>
            </div>

            {clientMode === "existing" && (
              <select
                value={selectedCustomerId}
                onChange={(e) => autofillCustomer(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">— Select customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Client Name</label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Client Address</label>
              <input
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Client address"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Issue Date</label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Valid Until</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-[#0F172A]">Line Items</label>
              {!loadingItems && (
                <button onClick={addItem} className="flex items-center gap-1 text-xs text-green-600 hover:underline font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add item
                </button>
              )}
            </div>

            {loadingItems ? (
              <div className="flex items-center justify-center py-6 bg-slate-50 rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-3 text-right">Unit Price</div>
                  <div className="col-span-1" />
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-slate-100 last:border-0 items-center">
                    <input
                      className="col-span-6 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                    />
                    <input
                      className="col-span-2 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-center font-numeric"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 1)}
                    />
                    <input
                      className="col-span-3 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-right font-numeric"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={item.unit_price || ""}
                      onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)}
                    />
                    <button
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="col-span-1 flex justify-center p-1 text-slate-300 hover:text-red-400 disabled:opacity-30 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-between items-center px-3 py-2 text-sm font-bold text-[#0F172A] bg-slate-100">
                  <span>Quote Total</span>
                  <span className="font-numeric">{subtotal.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes + Terms */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes for the client..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Terms &amp; Conditions</label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="e.g. Quote valid for 14 days. 50% deposit required..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleSave("draft")}
              disabled={saving || loadingItems}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSave("sent")}
              disabled={saving || loadingItems}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 shadow-sm shadow-green-300/40"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Update Quote" : "Create & Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
