"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface DailySale { date: string; amount: number; }
interface Props { sales: DailySale[]; currency: string; }

type Period = "7D" | "30D" | "90D";

const PERIODS: Period[] = ["7D", "30D", "90D"];

function buildDailyMap(sales: DailySale[], days: number) {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    map.set(key, 0);
  }
  sales.forEach(({ date, amount }) => {
    if (map.has(date)) map.set(date, (map.get(date) ?? 0) + amount);
  });
  return Array.from(map.entries()).map(([date, revenue]) => ({
    date,
    revenue,
    label: new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short", day: "numeric",
    }),
  }));
}

function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2.5 text-xs">
      <p className="text-slate-500 mb-1">{label}</p>
      <p className="font-numeric font-bold text-slate-900">
        {formatCurrency(payload[0]?.value ?? 0, currency)}
      </p>
    </div>
  );
}

export function RevenueChart({ sales, currency }: Props) {
  const [period, setPeriod] = useState<Period>("30D");
  const days = period === "7D" ? 7 : period === "30D" ? 30 : 90;

  const data = useMemo(() => buildDailyMap(sales, days), [sales, days]);
  const total = data.reduce((s, d) => s + d.revenue, 0);
  const hasData = total > 0;

  const tickInterval = days === 7 ? 0 : days === 30 ? 6 : 14;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-slate-500 tracking-wide">Revenue Overview</p>
          <p className="font-numeric text-2xl font-bold text-slate-900 mt-0.5">
            {hasData ? formatCurrency(total, currency) : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {period === "7D" ? "Last 7 days" : period === "30D" ? "Last 30 days" : "Last 90 days"}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg flex-shrink-0">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="text-slate-400 text-lg">📊</span>
          </div>
          <p className="text-sm font-medium text-slate-500">No revenue data yet</p>
          <p className="text-xs text-slate-400">Sales will appear here once recorded</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16a34a" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
                : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K`
                : String(v)
              }
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#16a34a"
              strokeWidth={2}
              fill="url(#revenueGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#16a34a", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
