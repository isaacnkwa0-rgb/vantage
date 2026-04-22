"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Loader2 } from "lucide-react";

interface Props {
  businessId: string;
  currency: string;
}

interface ReportData {
  grossRevenue: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  marginPercent: number;
  salesCount: number;
  sales: Array<{
    id: string;
    sale_number: string;
    total_amount: number;
    payment_method: string;
    created_at: string;
    customers: { name: string } | null;
  }>;
}

export function ReportsClient({ businessId, currency }: Props) {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(firstOfMonth.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fmt = (n: number) => formatCurrency(n, currency);

  async function fetchReport() {
    setLoading(true);
    const supabase = createClient();

    const startISO = `${startDate}T00:00:00.000Z`;
    const endISO = `${endDate}T23:59:59.999Z`;

    const [salesRes, itemsRes, expensesRes] = await Promise.all([
      supabase
        .from("sales")
        .select("id, sale_number, total_amount, payment_method, created_at, customers(name)")
        .eq("business_id", businessId)
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .order("created_at", { ascending: false }),
      supabase
        .from("sale_items")
        .select("quantity, cost_price, line_total, sale_id")
        .eq("business_id", businessId),
      supabase
        .from("expenses")
        .select("amount")
        .eq("business_id", businessId)
        .gte("expense_date", startDate)
        .lte("expense_date", endDate),
    ]);

    const sales = salesRes.data ?? [];
    const saleIds = new Set(sales.map((s) => s.id));
    const items = (itemsRes.data ?? []).filter((i) => saleIds.has(i.sale_id));
    const expenses = expensesRes.data ?? [];

    const grossRevenue = sales.reduce((s, r) => s + r.total_amount, 0);
    const cogs = items.reduce((s, i) => s + i.cost_price * i.quantity, 0);
    const grossProfit = grossRevenue - cogs;
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    const marginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    setData({
      grossRevenue,
      cogs,
      grossProfit,
      totalExpenses,
      netProfit,
      marginPercent,
      salesCount: sales.length,
      sales: sales as any,
    });
    setLoading(false);
  }

  useEffect(() => { fetchReport(); }, []);

  function setPreset(preset: string) {
    const now = new Date();
    let start: Date;
    let end = new Date(now);
    switch (preset) {
      case "today": start = new Date(now.setHours(0, 0, 0, 0)); end = new Date(); break;
      case "week": start = new Date(now); start.setDate(start.getDate() - 7); break;
      case "month": start = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case "year": start = new Date(now.getFullYear(), 0, 1); break;
      default: return;
    }
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }

  return (
    <div className="flex-1 p-5 space-y-5">
      {/* Date filter */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {["today", "week", "month", "year"].map((p) => (
              <button key={p} onClick={() => setPreset(p)} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 capitalize transition">
                {p === "week" ? "7 days" : p === "year" ? "This year" : p === "month" ? "This month" : "Today"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <span className="text-slate-400 text-sm">to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <button onClick={fetchReport} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 disabled:opacity-60 shadow-sm shadow-green-300/40">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Apply
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : data ? (
        <>
          {/* P&L Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Gross Revenue", value: fmt(data.grossRevenue), color: "text-emerald-600", bg: "bg-emerald-50", icon: TrendingUp },
              { label: "Cost of Goods", value: fmt(data.cogs), color: "text-slate-600", bg: "bg-slate-50", icon: ShoppingBag },
              { label: "Gross Profit", value: fmt(data.grossProfit), color: "text-green-600", bg: "bg-green-50", icon: DollarSign },
              { label: "Total Expenses", value: fmt(data.totalExpenses), color: "text-red-500", bg: "bg-red-50", icon: TrendingDown },
              { label: "Net Profit", value: fmt(data.netProfit), color: data.netProfit >= 0 ? "text-emerald-700" : "text-red-600", bg: data.netProfit >= 0 ? "bg-emerald-50" : "bg-red-50", icon: DollarSign },
              { label: "Profit Margin", value: `${data.marginPercent.toFixed(1)}%`, color: data.marginPercent >= 0 ? "text-emerald-700" : "text-red-600", bg: data.marginPercent >= 0 ? "bg-emerald-50" : "bg-red-50", icon: TrendingUp },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className={`font-numeric text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-[#0F172A]">Sales ({data.salesCount})</h3>
            </div>
            {data.sales.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No sales in this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                      <th className="text-left px-4 py-3">Receipt</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Customer</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Method</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Date</th>
                      <th className="text-right px-4 py-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50 transition text-sm">
                        <td className="px-4 py-3 font-medium text-[#0F172A]">{sale.sale_number}</td>
                        <td className="px-4 py-3 hidden sm:table-cell text-slate-600">{(sale.customers as any)?.name ?? "Walk-in"}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{sale.payment_method}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-400 text-xs">
                          {new Date(sale.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right font-numeric font-semibold text-emerald-600">
                          {fmt(sale.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
