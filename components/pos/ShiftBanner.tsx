"use client";

import { useState, useEffect } from "react";
import { Clock, DollarSign, X, Loader2, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";

interface Shift {
  id: string;
  opened_at: string;
  opening_float: number;
}

interface Props {
  initialShift: Shift | null;
  businessId: string;
  userId: string;
  currency: string;
}

function elapsed(from: string) {
  const ms = Date.now() - new Date(from).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function ShiftBanner({ initialShift, businessId, userId, currency }: Props) {
  const [shift, setShift] = useState<Shift | null>(initialShift);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [openingFloat, setOpeningFloat] = useState("0");
  const [closingFloat, setClosingFloat] = useState("");
  const [cashSales, setCashSales] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!shift) return;
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [shift]);

  const fmt = (n: number) => formatCurrency(n, currency);
  const expectedCash = (shift?.opening_float ?? 0) + cashSales;
  const actualCash = parseFloat(closingFloat) || 0;
  const discrepancy = actualCash - expectedCash;

  async function loadCashSales(shiftId: string, openedAt: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("sales")
      .select("amount_paid")
      .eq("business_id", businessId)
      .eq("payment_method", "cash")
      .gte("created_at", openedAt);
    const total = (data ?? []).reduce((s, r) => s + (r.amount_paid ?? 0), 0);
    setCashSales(total);
  }

  async function startShift() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("cash_shifts")
      .insert({ business_id: businessId, opened_by: userId, opening_float: parseFloat(openingFloat) || 0 })
      .select()
      .single();
    if (data) setShift(data as Shift);
    setShowStart(false);
    setLoading(false);
  }

  async function openEndModal() {
    if (!shift) return;
    await loadCashSales(shift.id, shift.opened_at);
    setClosingFloat("");
    setNotes("");
    setShowEnd(true);
  }

  async function endShift() {
    if (!shift) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("cash_shifts").update({
      closed_by: userId,
      closing_float: actualCash,
      cash_sales: cashSales,
      expected_cash: expectedCash,
      discrepancy,
      notes: notes || null,
      closed_at: new Date().toISOString(),
      status: "closed",
    }).eq("id", shift.id);
    setShift(null);
    setShowEnd(false);
    setLoading(false);
    setDismissed(false);
  }

  // No shift — show nudge banner (dismissible)
  if (!shift) {
    if (dismissed) return null;
    return (
      <>
        <div className="flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 text-amber-700 text-sm px-4 py-2 flex-shrink-0">
          <span className="font-medium">No active shift — <button onClick={() => setShowStart(true)} className="underline font-semibold">Start shift</button> to track your cash drawer.</span>
          <button onClick={() => setDismissed(true)} className="p-0.5 hover:bg-amber-100 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {showStart && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-[#0F172A]">Start Shift</h2>
                <button onClick={() => setShowStart(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Opening float (cash in drawer)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-lg font-numeric font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                    autoFocus
                  />
                </div>
                <button
                  onClick={startShift}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Start Shift
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Shift is open — show info bar
  return (
    <>
      <div className="hidden lg:flex items-center justify-between bg-green-50 border-b border-green-200 text-green-700 text-sm px-4 py-1.5 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-medium">Shift open · {elapsed(shift.opened_at)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Float: {fmt(shift.opening_float)}</span>
          </div>
        </div>
        <button
          onClick={openEndModal}
          className="flex items-center gap-1.5 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition"
        >
          End Shift
        </button>
      </div>

      {showEnd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-[#0F172A]">End Shift</h2>
              <button onClick={() => setShowEnd(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Opening float</span>
                  <span className="font-numeric font-semibold">{fmt(shift.opening_float)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cash sales</span>
                  <span className="font-numeric font-semibold text-emerald-600">+{fmt(cashSales)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                  <span>Expected in drawer</span>
                  <span className="font-numeric">{fmt(expectedCash)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Actual cash counted</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={closingFloat}
                  onChange={(e) => setClosingFloat(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-lg font-numeric font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                  autoFocus
                />
              </div>

              {closingFloat && (
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold ${
                  discrepancy === 0 ? "bg-emerald-50 text-emerald-700" :
                  discrepancy > 0 ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600"
                }`}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>{discrepancy === 0 ? "Balanced" : discrepancy > 0 ? "Over" : "Short"}</span>
                  </div>
                  <span className="font-numeric">{discrepancy >= 0 ? "+" : ""}{fmt(discrepancy)}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Notes <span className="font-normal text-slate-400">(optional)</span></label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any discrepancy explanation..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowEnd(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button
                  onClick={endShift}
                  disabled={loading || !closingFloat}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Close Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
