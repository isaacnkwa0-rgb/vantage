"use client";

import { useState } from "react";
import { useRef, useEffect } from "react";
import {
  Search, Activity, ShoppingCart, Package, Users, FileText, FilePen,
  Receipt, Tag, ArrowRightLeft, Vault, Clock, ChevronDown, Check,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

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
  currency: string;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  "sale.created":      { label: "New sale",          color: "text-primary", bg: "bg-primary-soft",  Icon: ShoppingCart },
  "sale.returned":     { label: "Return recorded",   color: "text-orange-700",  bg: "bg-orange-50",   Icon: ArrowRightLeft },
  "product.created":   { label: "Product created",   color: "text-blue-700",    bg: "bg-blue-50",     Icon: Package },
  "product.updated":   { label: "Product updated",   color: "text-blue-600",    bg: "bg-blue-50",     Icon: Package },
  "product.deleted":   { label: "Product deleted",   color: "text-red-600",     bg: "bg-red-50",      Icon: Package },
  "customer.created":  { label: "Customer added",    color: "text-violet-700",  bg: "bg-violet-50",   Icon: Users },
  "customer.updated":  { label: "Customer updated",  color: "text-violet-600",  bg: "bg-violet-50",   Icon: Users },
  "customer.deleted":  { label: "Customer deleted",  color: "text-red-600",     bg: "bg-red-50",      Icon: Users },
  "invoice.created":   { label: "Invoice created",   color: "text-indigo-700",  bg: "bg-indigo-50",   Icon: FileText },
  "invoice.updated":   { label: "Invoice updated",   color: "text-indigo-600",  bg: "bg-indigo-50",   Icon: FileText },
  "invoice.paid":      { label: "Invoice paid",      color: "text-primary", bg: "bg-primary-soft",  Icon: FileText },
  "invoice.cancelled": { label: "Invoice cancelled", color: "text-red-600",     bg: "bg-red-50",      Icon: FileText },
  "quote.created":     { label: "Quote created",     color: "text-cyan-700",    bg: "bg-cyan-50",     Icon: FilePen },
  "quote.updated":     { label: "Quote updated",     color: "text-cyan-600",    bg: "bg-cyan-50",     Icon: FilePen },
  "quote.accepted":    { label: "Quote accepted",    color: "text-primary", bg: "bg-primary-soft",  Icon: FilePen },
  "quote.rejected":    { label: "Quote rejected",    color: "text-red-600",     bg: "bg-red-50",      Icon: FilePen },
  "quote.converted":   { label: "Quote → Invoice",   color: "text-violet-700",  bg: "bg-violet-50",   Icon: FilePen },
  "expense.created":   { label: "Expense added",     color: "text-rose-700",    bg: "bg-rose-50",     Icon: Receipt },
  "expense.deleted":   { label: "Expense deleted",   color: "text-red-600",     bg: "bg-red-50",      Icon: Receipt },
  "bundle.created":    { label: "Bundle created",    color: "text-violet-700",  bg: "bg-violet-50",   Icon: Package },
  "bundle.updated":    { label: "Bundle updated",    color: "text-violet-600",  bg: "bg-violet-50",   Icon: Package },
  "bundle.deleted":    { label: "Bundle deleted",    color: "text-red-600",     bg: "bg-red-50",      Icon: Package },
  "shift.opened":      { label: "Shift started",     color: "text-primary",   bg: "bg-primary-soft",    Icon: Vault },
  "shift.closed":      { label: "Shift closed",      color: "text-slate-600",   bg: "bg-slate-100",   Icon: Vault },
  "discount.created":  { label: "Discount created",  color: "text-amber-700",   bg: "bg-amber-50",    Icon: Tag },
  "discount.deleted":  { label: "Discount deleted",  color: "text-red-600",     bg: "bg-red-50",      Icon: Tag },
};

const FILTERS = [
  { value: "all",      label: "All" },
  { value: "sale",     label: "Sales" },
  { value: "product",  label: "Products" },
  { value: "customer", label: "Customers" },
  { value: "invoice",  label: "Invoices" },
  { value: "quote",    label: "Quotes" },
  { value: "expense",  label: "Expenses" },
  { value: "bundle",   label: "Bundles" },
  { value: "shift",    label: "Shifts" },
  { value: "discount", label: "Discounts" },
];

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_LONG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function groupKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function groupLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const isToday =
    d.getUTCFullYear() === today.getUTCFullYear() &&
    d.getUTCMonth() === today.getUTCMonth() &&
    d.getUTCDate() === today.getUTCDate();
  if (isToday) return "Today";
  return `${DAYS_LONG[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

function timeAgo(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  const d = new Date(dateStr);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

function formatMeta(meta: Record<string, unknown>, currency: string): string | null {
  const parts: string[] = [];
  if (meta.total !== undefined) parts.push(formatCurrency(Number(meta.total), currency));
  if (meta.method !== undefined) parts.push(String(meta.method));
  if (meta.amount !== undefined && meta.total === undefined) parts.push(formatCurrency(Number(meta.amount), currency));
  if (parts.length === 0) {
    const entries = Object.entries(meta).slice(0, 2);
    return entries.map(([k, v]) => `${k}: ${v}`).join(" · ") || null;
  }
  return parts.join(" · ");
}

export function ActivityClient({ logs, currency }: Props) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const filtered = logs.filter((log) => {
    const matchEntity = filter === "all" || log.entity_type === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      log.action.includes(q) ||
      (log.entity_name ?? "").toLowerCase().includes(q) ||
      (ACTION_CONFIG[log.action]?.label ?? "").toLowerCase().includes(q);
    return matchEntity && matchSearch;
  });

  const groups: Record<string, AuditLog[]> = {};
  for (const log of filtered) {
    const key = groupKey(log.created_at);
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f8faf9] overflow-hidden">

      {/* Search + filter dropdown */}
      <div className="bg-white border-b border-slate-100 px-4 pt-3 pb-3 flex-shrink-0">
        <div className="flex gap-2 items-stretch h-11">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity..."
              className="w-full h-full pl-9 pr-4 border border-slate-200 rounded-[8px] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setShowDropdown((v) => !v)}
              className={[
                "h-full flex items-center gap-1.5 px-3 border rounded-[8px] text-[13px] font-medium transition bg-white",
                filter !== "all"
                  ? "border-primary text-primary"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {FILTERS.find((f) => f.value === filter)?.label ?? "All"}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-[10px] border border-slate-200 shadow-lg z-20 overflow-hidden">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => { setFilter(f.value); setShowDropdown(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    {f.label}
                    {filter === f.value && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
              <Clock className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-[15px] font-bold text-slate-800">No activity yet</p>
            <p className="text-[13px] text-slate-400 mt-1 max-w-xs">Actions across your business will appear here</p>
          </div>
        ) : (
          Object.entries(groups).map(([key, dateLogs]) => (
            <div key={key}>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-1">
                {groupLabel(dateLogs[0].created_at)}
              </p>
              <div className="bg-white rounded-[12px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                {dateLogs.map((log) => {
                  const cfg = ACTION_CONFIG[log.action] ?? {
                    label: log.action, color: "text-slate-600", bg: "bg-slate-100", Icon: Activity,
                  };
                  const { Icon } = cfg;
                  const meta = log.meta && Object.keys(log.meta).length > 0
                    ? formatMeta(log.meta, currency)
                    : null;
                  return (
                    <div key={log.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-[18px] h-[18px] ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 leading-snug">
                          {cfg.label}
                          {log.entity_name && (
                            <span className="text-slate-500 font-normal"> · {log.entity_name}</span>
                          )}
                        </p>
                        {meta && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{meta}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 flex-shrink-0 ml-1">{timeAgo(log.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
