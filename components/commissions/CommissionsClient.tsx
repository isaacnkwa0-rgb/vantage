"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Percent, TrendingUp, Users, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface Member {
  user_id: string;
  role: string;
  profiles: { id: string; full_name: string; email: string } | null;
}

interface Rule {
  user_id: string;
  type: "percentage" | "flat";
  value: number;
}

interface Sale {
  served_by: string | null;
  total_amount: number;
  created_at: string;
}

interface Props {
  members: Member[];
  rules: Rule[];
  sales: Sale[];
  currency: string;
  fromDate: string;
  toDate: string;
  businessSlug: string;
}

export function CommissionsClient({ members, rules, sales, currency, fromDate, toDate, businessSlug }: Props) {
  const router = useRouter();
  const fmt = (n: number) => formatCurrency(n, currency);

  const [from, setFrom] = useState(fromDate);
  const [to, setTo] = useState(toDate);

  function applyRange() {
    router.push(`/${businessSlug}/commissions?from=${from}&to=${to}`);
  }

  // Build commission summary per member
  const ruleMap = Object.fromEntries(rules.map((r) => [r.user_id, r]));

  const rows = members.map((m) => {
    const userId = m.user_id;
    const rule = ruleMap[userId];
    const memberSales = sales.filter((s) => s.served_by === userId);
    const salesTotal = memberSales.reduce((s, r) => s + r.total_amount, 0);
    const saleCount = memberSales.length;

    let commission = 0;
    if (rule) {
      commission = rule.type === "percentage"
        ? (salesTotal * rule.value) / 100
        : rule.value * saleCount;
    }

    return {
      userId,
      name: m.profiles?.full_name ?? "Unknown",
      email: m.profiles?.email ?? "",
      role: m.role,
      salesTotal,
      saleCount,
      commission,
      hasRule: !!rule,
      rule,
    };
  }).sort((a, b) => b.commission - a.commission);

  const totalCommissions = rows.reduce((s, r) => s + r.commission, 0);
  const totalSales = rows.reduce((s, r) => s + r.salesTotal, 0);

  return (
    <div className="flex-1 p-5 space-y-4">
      {/* Date range */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <button onClick={applyRange} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition">Apply</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-emerald-600">{fmt(totalCommissions)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Commissions Due</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-[#0F172A]">{fmt(totalSales)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Sales (period)</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-[#0F172A]">{rows.filter((r) => r.hasRule).length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Staff with Commission Rates</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            {new Date(fromDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })} —{" "}
            {new Date(toDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="text-left px-5 py-3">Staff Member</th>
              <th className="text-right px-5 py-3">Sales</th>
              <th className="text-right px-5 py-3">Total Sales</th>
              <th className="text-right px-5 py-3">Rate</th>
              <th className="text-right px-5 py-3">Commission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => (
              <tr key={row.userId} className="hover:bg-slate-50 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">
                      {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{row.name}</p>
                      <p className="text-xs text-slate-400 capitalize">{row.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-right text-sm text-slate-600">{row.saleCount}</td>
                <td className="px-5 py-3 text-right text-sm font-semibold text-[#0F172A]">{fmt(row.salesTotal)}</td>
                <td className="px-5 py-3 text-right text-xs text-slate-400">
                  {row.hasRule
                    ? row.rule.type === "percentage"
                      ? `${row.rule.value}%`
                      : `${fmt(row.rule.value)}/sale`
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3 text-right">
                  {row.commission > 0
                    ? <span className="font-bold text-emerald-600">{fmt(row.commission)}</span>
                    : <span className="text-slate-300 text-sm">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
          {totalCommissions > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="px-5 py-3 text-sm font-bold text-[#0F172A]" colSpan={4}>Total</td>
                <td className="px-5 py-3 text-right font-bold text-emerald-600">{fmt(totalCommissions)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-xs text-slate-400 text-center">
        Commission rates are configured in Settings → Staff & Roles
      </p>
    </div>
  );
}
