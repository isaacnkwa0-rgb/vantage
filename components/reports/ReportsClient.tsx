"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { createClient } from "@/lib/supabase/client";
import { Loader2, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

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

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const PRESETS = [
  { key: "today",  label: "Today"      },
  { key: "week",   label: "7 Days"     },
  { key: "month",  label: "This Month" },
  { key: "year",   label: "This Year"  },
] as const;

const METHOD_COLORS: Record<string, string> = {
  cash:     "text-emerald-600",
  card:     "text-blue-600",
  transfer: "text-violet-600",
  pos:      "text-orange-500",
};

const innerCls = "w-full text-sm bg-transparent focus:outline-none text-[#0F172A] placeholder:text-slate-400 pt-0.5 pb-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-slate-200 rounded-[8px] px-3 pt-0 pb-2 focus-within:border-[#1a9c38] transition">
      <legend className="text-[11px] font-medium text-slate-600 px-1 ml-0.5 leading-none">{label}</legend>
      {children}
    </fieldset>
  );
}

function PLRow({ label, value, color, bold, divider }: { label: string; value: string; color: string; bold?: boolean; divider?: boolean }) {
  return (
    <>
      {divider && <div className="h-px bg-slate-100" />}
      <div className={cn("flex items-center justify-between gap-3 py-2.5", bold && "py-3")}>
        <span className={cn("text-[13px] text-slate-500 flex-shrink-0", bold && "text-[14px] font-semibold text-[#0F172A]")}>{label}</span>
        <span className={cn("text-[14px] font-semibold text-right", bold && "text-[16px] font-extrabold", color)}>{value}</span>
      </div>
    </>
  );
}

export function ReportsClient({ businessId, currency }: Props) {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(firstOfMonth.toISOString().split("T")[0]);
  const [endDate, setEndDate]     = useState(today.toISOString().split("T")[0]);
  const [activePreset, setActivePreset] = useState<string>("month");
  const [data, setData]           = useState<ReportData | null>(null);
  const [loading, setLoading]     = useState(false);

  const fmt = (n: number) => formatCurrency(n, currency);

  async function fetchReport(start = startDate, end = endDate) {
    setLoading(true);
    const supabase = createClient();
    const startISO = `${start}T00:00:00.000Z`;
    const endISO   = `${end}T23:59:59.999Z`;

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
        .gte("expense_date", start)
        .lte("expense_date", end),
    ]);

    const sales    = salesRes.data ?? [];
    const saleIds  = new Set(sales.map((s) => s.id));
    const items    = (itemsRes.data ?? []).filter((i) => saleIds.has(i.sale_id));
    const expenses = expensesRes.data ?? [];

    const grossRevenue   = sales.reduce((s, r) => s + r.total_amount, 0);
    const cogs           = items.reduce((s, i) => s + i.cost_price * i.quantity, 0);
    const grossProfit    = grossRevenue - cogs;
    const totalExpenses  = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit      = grossProfit - totalExpenses;
    const marginPercent  = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    setData({ grossRevenue, cogs, grossProfit, totalExpenses, netProfit, marginPercent, salesCount: sales.length, sales: sales as any });
    setLoading(false);
  }

  useEffect(() => { fetchReport(); }, []);

  function applyPreset(preset: string) {
    const now = new Date();
    let start: Date;
    const end = new Date(now);
    switch (preset) {
      case "today": start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case "week":  start = new Date(now); start.setDate(start.getDate() - 7); break;
      case "month": start = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case "year":  start = new Date(now.getFullYear(), 0, 1); break;
      default: return;
    }
    const s = start.toISOString().split("T")[0];
    const e = end.toISOString().split("T")[0];
    setStartDate(s);
    setEndDate(e);
    setActivePreset(preset);
    fetchReport(s, e);
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 pt-4 pb-6 space-y-4">

      {/* Preset pills */}
      <div className="flex gap-2">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => applyPreset(key)}
            className={cn(
              "flex-1 py-2 rounded-[8px] text-[13px] font-semibold transition border",
              activePreset === key
                ? "bg-[#1a9c38] text-white border-[#1a9c38]"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <Field label="From">
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setActivePreset(""); }} className={innerCls} />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="To">
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setActivePreset(""); }} className={innerCls} />
            </Field>
          </div>
        </div>
        <button
          onClick={() => fetchReport()}
          disabled={loading}
          className="w-full h-11 flex items-center justify-center gap-2 bg-[#1a9c38] hover:bg-green-700 text-white rounded-[8px] text-[13px] font-semibold transition disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Apply
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a9c38]" />
        </div>
      )}

      {/* Report data */}
      {!loading && data && (
        <>
          {/* P&L card */}
          <div className="border border-slate-200 rounded-[12px] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#0F172A]">Profit & Loss</span>
              <span className="text-[12px] text-slate-400">{data.salesCount} sale{data.salesCount !== 1 ? "s" : ""}</span>
            </div>
            <div className="px-4 divide-y divide-slate-100">
              <PLRow label="Gross Revenue"   value={fmt(data.grossRevenue)}  color="text-[#1a9c38]" />
              <PLRow label="Cost of Goods"   value={`− ${fmt(data.cogs)}`}   color="text-slate-500" />
              <PLRow label="Gross Profit"    value={fmt(data.grossProfit)}   color={data.grossProfit >= 0 ? "text-[#1a9c38]" : "text-red-500"} bold divider />
              <PLRow label="Total Expenses"  value={`− ${fmt(data.totalExpenses)}`} color="text-red-500" />
              <PLRow
                label="Net Profit"
                value={fmt(data.netProfit)}
                color={data.netProfit >= 0 ? "text-[#1a9c38]" : "text-red-500"}
                bold
                divider
              />
            </div>
            {/* Margin strip */}
            <div className={cn(
              "flex items-center justify-between px-4 py-3 border-t border-slate-100",
              data.marginPercent >= 0 ? "bg-emerald-50" : "bg-red-50"
            )}>
              <div className="flex items-center gap-1.5">
                {data.marginPercent >= 0
                  ? <TrendingUp className="w-4 h-4 text-[#1a9c38]" />
                  : <TrendingDown className="w-4 h-4 text-red-500" />}
                <span className="text-[13px] font-semibold text-slate-600">Net Profit Margin</span>
              </div>
              <span className={cn("text-[18px] font-extrabold", data.marginPercent >= 0 ? "text-[#1a9c38]" : "text-red-500")}>
                {data.marginPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Sales list */}
          {data.sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-[16px] font-bold text-slate-800">No sales in this period</p>
              <p className="text-[13px] text-slate-400 mt-1.5">Try a different date range</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                {data.salesCount} sale{data.salesCount !== 1 ? "s" : ""}
              </p>
              <div className="bg-white rounded-[8px] border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {data.sales.map((sale) => {
                  const methodColor = METHOD_COLORS[sale.payment_method] ?? "text-slate-500";
                  return (
                    <div key={sale.id} className="px-4 py-3 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-[13px] text-[#0F172A] flex-shrink-0">{sale.sale_number}</span>
                          <span className={cn("text-[12px] font-semibold capitalize flex-shrink-0", methodColor)}>{sale.payment_method}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                          <span className="text-[12px] text-slate-500 truncate">{(sale.customers as any)?.name ?? "Walk-in"}</span>
                          <span className="text-[12px] text-slate-400 flex-shrink-0" suppressHydrationWarning>· {shortDate(sale.created_at)}</span>
                        </div>
                      </div>
                      <span className="text-[14px] font-extrabold text-[#1a9c38] flex-shrink-0">{fmt(sale.total_amount)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
