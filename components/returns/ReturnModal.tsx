"use client";

import { useState, useMemo } from "react";
import {
  X, RotateCcw, AlertCircle, CheckCircle2,
  Loader2, Minus, Plus, Banknote, CreditCard,
  ArrowLeftRight, Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

const RETURN_REASONS = [
  "Damaged item",
  "Wrong item sold",
  "Customer changed mind",
  "Defective product",
  "Duplicate purchase",
  "Other",
] as const;

const REFUND_METHODS = [
  { value: "cash",         label: "Cash",         icon: Banknote },
  { value: "card",         label: "Card",         icon: CreditCard },
  { value: "transfer",     label: "Transfer",     icon: ArrowLeftRight },
  { value: "store_credit", label: "Store Credit", icon: Wallet },
] as const;

export interface ReturnSaleItem {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Props {
  sale: {
    id: string;
    sale_number: string;
    business_id: string;
    created_at: string;
    customers: { name: string } | null;
  };
  items: ReturnSaleItem[];
  business: { currency: string; name: string };
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReturnModal({ sale, items, business, userId, onClose, onSuccess }: Props) {
  const [selected, setSelected]         = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState<string>("cash");
  const [reason, setReason]             = useState<string>("");
  const [notes, setNotes]               = useState<string>("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [done, setDone]                 = useState(false);
  const [returnNumber, setReturnNumber] = useState<string>("");

  const fmt = (n: number) => formatCurrency(n, business.currency);

  const refundAmount = useMemo(() =>
    items.reduce((sum, item) => sum + (selected[item.id] ?? 0) * item.unit_price, 0),
    [selected, items]
  );

  const hasSelection = Object.values(selected).some(q => q > 0);

  function toggleItem(itemId: string, originalQty: number) {
    setSelected(prev => {
      if ((prev[itemId] ?? 0) > 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: 1 };
    });
  }

  function adjustQty(itemId: string, delta: number, max: number) {
    setSelected(prev => {
      const next = (prev[itemId] ?? 0) + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: Math.min(next, max) };
    });
  }

  async function handleSubmit() {
    if (!hasSelection) return;
    if (!reason) {
      setError("Please select a reason for the return.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Generate a unique return number
    const { data: returnNum, error: numErr } = await supabase
      .rpc("generate_return_number", { p_business_id: sale.business_id });

    if (numErr || !returnNum) {
      setError("Could not generate return number. Please try again.");
      setLoading(false);
      return;
    }

    // Insert the return record
    const { data: returnRecord, error: returnErr } = await supabase
      .from("returns")
      .insert({
        business_id:      sale.business_id,
        original_sale_id: sale.id,
        return_number:    returnNum,
        refund_method:    refundMethod,
        refund_amount:    refundAmount,
        reason,
        notes:            notes || null,
        processed_by:     userId,
      })
      .select("id")
      .single();

    if (returnErr || !returnRecord) {
      setError("Failed to record return. Please try again.");
      setLoading(false);
      return;
    }

    // Insert all selected return items (triggers restock + customer update)
    const returnItems = items
      .filter(item => (selected[item.id] ?? 0) > 0)
      .map(item => ({
        return_id:    returnRecord.id,
        business_id:  sale.business_id,
        product_id:   item.product_id,
        variant_id:   item.variant_id,
        product_name: item.product_name,
        variant_name: item.variant_name ?? null,
        quantity:     selected[item.id],
        unit_price:   item.unit_price,
        line_total:   selected[item.id] * item.unit_price,
      }));

    const { error: itemsErr } = await supabase
      .from("return_items")
      .insert(returnItems);

    if (itemsErr) {
      setError("Return saved but items failed to record. Please contact support.");
      setLoading(false);
      return;
    }

    setReturnNumber(returnNum);
    setDone(true);
    setLoading(false);
    onSuccess();
  }

  // ── Success screen ───────────────────────────────────────────
  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl">
          <div className="p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-orange-500" />
            </div>
            <div>
              <p className="font-bold text-[#0F172A] text-lg">Return Processed</p>
              <p className="text-slate-400 text-sm mt-0.5">{returnNumber}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 w-full text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Refund amount</span>
                <span className="font-bold text-orange-600 font-numeric">{fmt(refundAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method</span>
                <span className="font-medium capitalize">{refundMethod.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reason</span>
                <span className="font-medium">{reason}</span>
              </div>
              {refundMethod === "store_credit" && sale.customers && (
                <p className="text-xs text-emerald-600 pt-1 border-t border-slate-200">
                  {fmt(refundAmount)} added to {sale.customers.name}&apos;s store credit
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main modal ───────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-[#0F172A]">Process Return</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {sale.sale_number} &middot; {sale.customers?.name ?? "Walk-in customer"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Item selection */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Select items to return
            </p>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {items.map(item => {
                const qty = selected[item.id] ?? 0;
                const isSelected = qty > 0;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 flex items-center gap-3 transition-colors",
                      isSelected && "bg-orange-50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItem(item.id, item.quantity)}
                      className="w-4 h-4 rounded cursor-pointer accent-orange-500 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{item.product_name}</p>
                      {item.variant_name && (
                        <p className="text-xs text-slate-400">{item.variant_name}</p>
                      )}
                      <p className="text-xs text-slate-400">
                        {fmt(item.unit_price)} each &middot; {item.quantity} sold
                      </p>
                    </div>

                    {isSelected ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => adjustQty(item.id, -1, item.quantity)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold font-numeric">{qty}</span>
                        <button
                          onClick={() => adjustQty(item.id, 1, item.quantity)}
                          disabled={qty >= item.quantity}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 transition disabled:opacity-40"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold text-orange-600 font-numeric w-20 text-right">
                          {fmt(qty * item.unit_price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 font-numeric flex-shrink-0">
                        {fmt(item.line_total)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Refund total */}
          {hasSelection && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-orange-700">Refund Amount</span>
              <span className="text-xl font-bold text-orange-600 font-numeric">{fmt(refundAmount)}</span>
            </div>
          )}

          {/* Refund method */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Refund method</p>
            <div className="grid grid-cols-2 gap-2">
              {REFUND_METHODS.map(({ value, label, icon: Icon }) => {
                const disabledStoreCred = value === "store_credit" && !sale.customers;
                return (
                  <button
                    key={value}
                    disabled={disabledStoreCred}
                    onClick={() => setRefundMethod(value)}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-sm font-medium transition flex items-center gap-2",
                      refundMethod === value
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                      disabledStoreCred && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-left">
                      {label}
                      {disabledStoreCred && (
                        <span className="block text-xs text-slate-400 font-normal leading-tight">
                          Requires customer
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Reason <span className="text-red-400">*</span>
            </p>
            <select
              value={reason}
              onChange={e => { setReason(e.target.value); setError(null); }}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="">Select a reason...</option>
              {RETURN_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes (optional)</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional details about the return..."
              rows={2}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!hasSelection || loading}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            {loading
              ? "Processing..."
              : hasSelection
                ? `Process Return · ${fmt(refundAmount)}`
                : "Select items to return"}
          </button>
        </div>
      </div>
    </div>
  );
}
