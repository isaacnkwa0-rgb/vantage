"use client";

import { useState } from "react";
import {
  Activity, ShoppingCart, Package, Users, FileText, FilePen,
  Receipt, DollarSign, Tag, Clock, ArrowRightLeft, Vault,
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string | null;
  entity_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  user_id: string;
}

interface Props {
  logs: AuditLog[];
}

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  "sale.created":      { label: "New sale",          color: "text-emerald-700", bg: "bg-emerald-50",  Icon: ShoppingCart },
  "sale.returned":     { label: "Return recorded",   color: "text-orange-700",  bg: "bg-orange-50",   Icon: ArrowRightLeft },
  "product.created":   { label: "Product created",   color: "text-blue-700",    bg: "bg-blue-50",     Icon: Package },
  "product.updated":   { label: "Product updated",   color: "text-blue-600",    bg: "bg-blue-50",     Icon: Package },
  "product.deleted":   { label: "Product deleted",   color: "text-red-700",     bg: "bg-red-50",      Icon: Package },
  "customer.created":  { label: "Customer added",    color: "text-violet-700",  bg: "bg-violet-50",   Icon: Users },
  "customer.updated":  { label: "Customer updated",  color: "text-violet-600",  bg: "bg-violet-50",   Icon: Users },
  "customer.deleted":  { label: "Customer deleted",  color: "text-red-700",     bg: "bg-red-50",      Icon: Users },
  "invoice.created":   { label: "Invoice created",   color: "text-indigo-700",  bg: "bg-indigo-50",   Icon: FileText },
  "invoice.updated":   { label: "Invoice updated",   color: "text-indigo-600",  bg: "bg-indigo-50",   Icon: FileText },
  "invoice.paid":      { label: "Invoice paid",      color: "text-emerald-700", bg: "bg-emerald-50",  Icon: FileText },
  "invoice.cancelled": { label: "Invoice cancelled", color: "text-red-700",     bg: "bg-red-50",      Icon: FileText },
  "quote.created":     { label: "Quote created",     color: "text-cyan-700",    bg: "bg-cyan-50",     Icon: FilePen },
  "quote.updated":     { label: "Quote updated",     color: "text-cyan-600",    bg: "bg-cyan-50",     Icon: FilePen },
  "quote.accepted":    { label: "Quote accepted",    color: "text-emerald-700", bg: "bg-emerald-50",  Icon: FilePen },
  "quote.rejected":    { label: "Quote rejected",    color: "text-red-700",     bg: "bg-red-50",      Icon: FilePen },
  "quote.converted":   { label: "Quote → Invoice",   color: "text-violet-700",  bg: "bg-violet-50",   Icon: FilePen },
  "expense.created":   { label: "Expense added",     color: "text-rose-700",    bg: "bg-rose-50",     Icon: Receipt },
  "expense.deleted":   { label: "Expense deleted",   color: "text-red-700",     bg: "bg-red-50",      Icon: Receipt },
  "bundle.created":    { label: "Bundle created",    color: "text-violet-700",  bg: "bg-violet-50",   Icon: Package },
  "bundle.updated":    { label: "Bundle updated",    color: "text-violet-600",  bg: "bg-violet-50",   Icon: Package },
  "bundle.deleted":    { label: "Bundle deleted",    color: "text-red-700",     bg: "bg-red-50",      Icon: Package },
  "shift.opened":      { label: "Shift started",     color: "text-green-700",   bg: "bg-green-50",    Icon: Vault },
  "shift.closed":      { label: "Shift closed",      color: "text-slate-700",   bg: "bg-slate-100",   Icon: Vault },
  "discount.created":  { label: "Discount created",  color: "text-amber-700",   bg: "bg-amber-50",    Icon: Tag },
  "discount.deleted":  { label: "Discount deleted",  color: "text-red-700",     bg: "bg-red-50",      Icon: Tag },
};

const ENTITY_FILTERS = ["all", "sale", "product", "customer", "invoice", "quote", "expense", "bundle", "shift", "discount"];

function timeAgo(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ActivityClient({ logs }: Props) {
  const [entityFilter, setEntityFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = logs.filter((log) => {
    const matchEntity = entityFilter === "all" || log.entity_type === entityFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      log.action.includes(q) ||
      (log.entity_name ?? "").toLowerCase().includes(q) ||
      (ACTION_CONFIG[log.action]?.label ?? "").toLowerCase().includes(q);
    return matchEntity && matchSearch;
  });

  // Group by date
  const groups: Record<string, AuditLog[]> = {};
  for (const log of filtered) {
    const date = new Date(log.created_at).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
  }

  return (
    <div className="flex-1 p-5 space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 capitalize"
        >
          {ENTITY_FILTERS.map((f) => (
            <option key={f} value={f} className="capitalize">{f === "all" ? "All activity" : f + "s"}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="w-14 h-14 text-slate-200 mb-4" />
          <p className="text-slate-600 font-medium">No activity yet</p>
          <p className="text-slate-400 text-sm mt-1">Actions across your business will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([date, dateLogs]) => (
            <div key={date}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">{date}</p>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-50 overflow-hidden">
                {dateLogs.map((log) => {
                  const cfg = ACTION_CONFIG[log.action] ?? { label: log.action, color: "text-slate-600", bg: "bg-slate-50", Icon: Activity };
                  const { Icon } = cfg;
                  return (
                    <div key={log.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition">
                      <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A]">
                          {cfg.label}
                          {log.entity_name && (
                            <span className="text-slate-500 font-normal"> · {log.entity_name}</span>
                          )}
                        </p>
                        {log.meta && Object.keys(log.meta).length > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {Object.entries(log.meta).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(log.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
