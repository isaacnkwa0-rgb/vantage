"use client";

import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface Shift {
  id: string;
  opening_float: number;
  closing_float: number | null;
  cash_sales: number | null;
  expected_cash: number | null;
  discrepancy: number | null;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
  status: "open" | "closed";
}

interface Props {
  shifts: Shift[];
  currency: string;
}

function duration(from: string, to: string | null) {
  const end = to ? new Date(to) : new Date();
  const ms = end.getTime() - new Date(from).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function ShiftsClient({ shifts, currency }: Props) {
  const fmt = (n: number) => formatCurrency(n, currency);

  const totalCashSales = shifts.filter(s => s.status === "closed").reduce((s, r) => s + (r.cash_sales ?? 0), 0);
  const totalDiscrepancy = shifts.filter(s => s.status === "closed").reduce((s, r) => s + (r.discrepancy ?? 0), 0);

  return (
    <div className="flex-1 p-5 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="font-numeric text-xl font-bold text-[#0F172A]">{shifts.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Shifts</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="font-numeric text-xl font-bold text-emerald-600">{fmt(totalCashSales)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Cash Sales</p>
        </div>
        <div className={`bg-white rounded-xl border p-4 shadow-sm text-center ${
          totalDiscrepancy < 0 ? "border-red-100" : totalDiscrepancy > 0 ? "border-blue-100" : "border-slate-200"
        }`}>
          <p className={`font-numeric text-xl font-bold ${
            totalDiscrepancy < 0 ? "text-red-500" : totalDiscrepancy > 0 ? "text-blue-600" : "text-slate-400"
          }`}>
            {totalDiscrepancy >= 0 ? "+" : ""}{fmt(totalDiscrepancy)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Net Discrepancy</p>
        </div>
      </div>

      {shifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="w-14 h-14 text-slate-200 mb-4" />
          <p className="text-slate-600 font-medium">No shifts recorded yet</p>
          <p className="text-slate-400 text-sm mt-1">Start a shift from the POS to track your cash drawer</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Date & Time</th>
                <th className="text-right px-4 py-3">Opening</th>
                <th className="text-right px-4 py-3">Cash Sales</th>
                <th className="text-right px-4 py-3">Expected</th>
                <th className="text-right px-4 py-3">Actual</th>
                <th className="text-right px-4 py-3">Diff</th>
                <th className="text-left px-4 py-3">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">
                        {new Date(shift.opened_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(shift.opened_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {shift.status === "open" && (
                      <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">OPEN</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-numeric text-sm">{fmt(shift.opening_float)}</td>
                  <td className="px-4 py-3 text-right font-numeric text-sm text-emerald-600">{shift.cash_sales != null ? fmt(shift.cash_sales) : "—"}</td>
                  <td className="px-4 py-3 text-right font-numeric text-sm">{shift.expected_cash != null ? fmt(shift.expected_cash) : "—"}</td>
                  <td className="px-4 py-3 text-right font-numeric text-sm">{shift.closing_float != null ? fmt(shift.closing_float) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {shift.discrepancy != null ? (
                      <div className={`flex items-center justify-end gap-1 text-sm font-numeric font-semibold ${
                        shift.discrepancy < 0 ? "text-red-500" : shift.discrepancy > 0 ? "text-blue-600" : "text-slate-400"
                      }`}>
                        {shift.discrepancy < 0 ? <TrendingDown className="w-3.5 h-3.5" /> :
                         shift.discrepancy > 0 ? <TrendingUp className="w-3.5 h-3.5" /> :
                         <Minus className="w-3.5 h-3.5" />}
                        {shift.discrepancy >= 0 ? "+" : ""}{fmt(shift.discrepancy)}
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {duration(shift.opened_at, shift.closed_at)}
                    {shift.notes && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[120px]" title={shift.notes}>{shift.notes}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
