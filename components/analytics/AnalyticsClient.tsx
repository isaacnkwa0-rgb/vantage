"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/utils/currency";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expense-categories";

interface Props {
  sales: Array<{ total_amount: number; created_at: string }>;
  saleItems: Array<{ product_name: string; quantity: number; line_total: number; cost_price: number }>;
  expenses: Array<{ category: string; amount: number }>;
  currency: string;
}

const COLORS = ["#16a34a", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#84CC16"];

export function AnalyticsClient({ sales, saleItems, expenses, currency }: Props) {
  const fmt = (n: number) => formatCurrency(n, currency);

  // Revenue trend — group by day
  const revenueByDay = sales.reduce<Record<string, number>>((acc, sale) => {
    const day = sale.created_at.split("T")[0];
    acc[day] = (acc[day] ?? 0) + sale.total_amount;
    return acc;
  }, {});
  const revenueData = Object.entries(revenueByDay)
    .sort()
    .slice(-14)
    .map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue,
    }));

  // Top products
  const productMap = saleItems.reduce<Record<string, { qty: number; revenue: number }>>((acc, item) => {
    const key = item.product_name;
    const existing = acc[key] ?? { qty: 0, revenue: 0 };
    acc[key] = { qty: existing.qty + item.quantity, revenue: existing.revenue + item.line_total };
    return acc;
  }, {});
  const topProducts = Object.entries(productMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 8)
    .map(([name, { qty, revenue }]) => ({ name: name.length > 16 ? name.slice(0, 15) + "…" : name, qty, revenue }));

  // Expense breakdown
  const expenseMap = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const expenseData = Object.entries(expenseMap).map(([cat, amount]) => {
    const found = EXPENSE_CATEGORIES.find((c) => c.value === cat);
    return { name: found?.label ?? cat, amount };
  }).sort((a, b) => b.amount - a.amount);

  // Profit margin trend
  const profitData = revenueData.map((d, i) => {
    const cogs = saleItems.slice(i * 3, i * 3 + 3).reduce((s, item) => s + item.cost_price * item.quantity, 0);
    return { ...d, profit: Math.max(0, d.revenue - cogs) };
  });

  const totalRevenue = sales.reduce((s, r) => s + r.total_amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="flex-1 p-5 space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="font-numeric text-xl font-bold text-emerald-600">{fmt(totalRevenue)}</p>
          <p className="text-xs text-slate-500">30-day Revenue</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="font-numeric text-xl font-bold text-red-500">{fmt(totalExpenses)}</p>
          <p className="text-xs text-slate-500">30-day Expenses</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className={`font-numeric text-xl font-bold ${totalRevenue - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}>
            {fmt(totalRevenue - totalExpenses)}
          </p>
          <p className="text-xs text-slate-500">Net Profit</p>
        </div>
      </div>

      {/* Revenue trend */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-[#0F172A] mb-4">Revenue Trend (Last 14 Days)</h3>
        {revenueData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v).replace(/\.00$/, "")} />
              <Tooltip formatter={(v: number) => [fmt(v), "Revenue"]} contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top products */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-[#0F172A] mb-4">Top Products by Revenue</h3>
          {topProducts.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v).replace(/\.00$/, "")} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip formatter={(v: number) => [fmt(v), "Revenue"]} contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-[#0F172A] mb-4">Expense Breakdown</h3>
          {expenseData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No expenses recorded</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={expenseData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="amount" nameKey="name" paddingAngle={2}>
                  {expenseData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [fmt(v), ""]} contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
