"use client";

import { useState, useMemo } from "react";
import {
  Search, Receipt, Printer, TrendingUp, ShoppingBag,
  CreditCard, Banknote, ArrowLeftRight, Loader2, Calendar,
  User, Download, BookOpen, RotateCcw, ChevronRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { createClient } from "@/lib/supabase/client";
import { ReceiptModal } from "@/components/pos/ReceiptModal";
import { ReturnModal, type ReturnSaleItem } from "@/components/returns/ReturnModal";
import { cn } from "@/lib/utils";

interface Sale {
  id: string;
  sale_number: string;
  total_amount: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  amount_paid: number;
  change_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  customers: { name: string; phone: string | null } | null;
}

interface Business {
  id: string;
  name: string;
  currency: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  receipt_footer?: string | null;
  receipt_tagline?: string | null;
  receipt_show_logo?: boolean | null;
  social_instagram?: string | null;
  social_twitter?: string | null;
  social_whatsapp?: string | null;
}

interface Props {
  sales: Sale[];
  business: Business;
  userId: string;
  returnedSaleIds: string[];
}

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowLeftRight,
  credit: BookOpen,
};

const PAYMENT_COLORS: Record<string, string> = {
  cash: "bg-emerald-50 text-emerald-700",
  card: "bg-green-50 text-green-700",
  transfer: "bg-violet-50 text-violet-700",
  credit: "bg-amber-50 text-amber-700",
};

export function SalesClient({ sales, business, userId, returnedSaleIds }: Props) {
  const [search, setSearch]             = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [reprinting, setReprinting]     = useState<string | null>(null);
  const [receiptSale, setReceiptSale]   = useState<any | null>(null);

  // Return modal state
  const [loadingReturn, setLoadingReturn] = useState<string | null>(null);
  const [returnSale, setReturnSale]       = useState<Sale | null>(null);
  const [returnItems, setReturnItems]     = useState<ReturnSaleItem[]>([]);
  // Track returns processed in this session so UI updates without full reload
  const [localReturned, setLocalReturned] = useState<Set<string>>(
    () => new Set(returnedSaleIds)
  );

  const fmt = (n: number) => formatCurrency(n, business.currency);

  const PAYMENT_TABS = [
    { value: "all",      label: "All" },
    { value: "cash",     label: "Cash" },
    { value: "card",     label: "Card" },
    { value: "transfer", label: "Transfer" },
    { value: "credit",   label: "Credit" },
  ] as const;

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        s.sale_number.toLowerCase().includes(q) ||
        (s.customers?.name ?? "").toLowerCase().includes(q);
      const matchPayment = paymentFilter === "all" || s.payment_method === paymentFilter;
      return matchSearch && matchPayment;
    });
  }, [sales, search, paymentFilter]);

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total_amount, 0);
  const avgSale = filtered.length > 0 ? totalRevenue / filtered.length : 0;

  async function fetchSaleItems(saleId: string): Promise<ReturnSaleItem[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from("sale_items")
      .select("id, product_id, variant_id, product_name, variant_name, quantity, unit_price, line_total")
      .eq("sale_id", saleId);
    return (data ?? []) as ReturnSaleItem[];
  }

  async function handleReprint(sale: Sale) {
    setReprinting(sale.id);
    const items = await fetchSaleItems(sale.id);
    setReprinting(null);
    setReceiptSale({
      ...sale,
      customer_name: sale.customers?.name ?? null,
      customer_phone: sale.customers?.phone ?? null,
      items: items.map(i => ({
        product_name: i.product_name,
        variant_name: i.variant_name ?? null,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: i.line_total,
      })),
    });
  }

  async function handleReturn(sale: Sale) {
    setLoadingReturn(sale.id);
    const items = await fetchSaleItems(sale.id);
    setLoadingReturn(null);
    setReturnItems(items);
    setReturnSale(sale);
  }

  function onReturnSuccess() {
    if (returnSale) {
      setLocalReturned(prev => new Set([...prev, returnSale.id]));
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function exportCSV() {
    const headers = ["Sale #", "Customer", "Date", "Payment Method", "Subtotal", "Discount", "Tax", "Total", "Status"];
    const rows = filtered.map((s) => [
      s.sale_number,
      s.customers?.name ?? "Walk-in",
      new Date(s.created_at).toLocaleString("en-GB"),
      s.payment_method,
      s.subtotal.toFixed(2),
      s.discount_amount.toFixed(2),
      s.tax_amount.toFixed(2),
      s.total_amount.toFixed(2),
      localReturned.has(s.id) ? "Returned" : "Paid",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex-1 space-y-0 pb-4">

      {/* ── Desktop summary cards (hidden on mobile) ─── */}
      <div className="hidden sm:grid grid-cols-3 gap-3 px-5 pt-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-green-400" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-sm shadow-green-200">
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Transactions</p>
          </div>
          <p className="font-numeric text-xl font-bold text-[#0F172A]">{filtered.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">in view</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-200">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Revenue</p>
          </div>
          <p className="font-numeric text-xl font-bold text-emerald-600 truncate">{fmt(totalRevenue)}</p>
          <p className="text-xs text-slate-400 mt-0.5">from filtered sales</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-400" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-violet-700 rounded-lg flex items-center justify-center shadow-sm shadow-violet-200">
              <Receipt className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Avg. Sale</p>
          </div>
          <p className="font-numeric text-xl font-bold text-violet-600 truncate">{fmt(avgSale)}</p>
          <p className="text-xs text-slate-400 mt-0.5">per transaction</p>
        </div>
      </div>

      {/* ── Search + export (shared) ─────────────────── */}
      <div className="flex items-center gap-2 px-4 pt-4 sm:px-5 sm:pt-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by sale number or customer..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-40 bg-white"
          title="Export CSV"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* ── Filter tabs ───────────────────────────────── */}
      <div className="flex gap-2 px-4 pt-3 sm:px-5 overflow-x-auto scrollbar-none pb-1">
        {PAYMENT_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setPaymentFilter(tab.value)}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors",
              paymentFilter === tab.value
                ? "bg-[#1a9c38] text-white"
                : "bg-white border border-slate-200 text-slate-600 active:bg-slate-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Sales list ────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-8">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Receipt className="w-9 h-9 text-slate-400" aria-hidden="true" />
          </div>
          <p className="text-[16px] font-bold text-slate-800">
            {search ? "No transactions found" : "No transactions yet"}
          </p>
          <p className="text-[13px] text-slate-400 mt-1.5 max-w-xs">
            {search ? "Try a different keyword or filter." : "Sales you record will appear here."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="sm:hidden px-4 pt-3 pb-4 space-y-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
              {filtered.map((sale) => {
                const PayIcon = PAYMENT_ICONS[sale.payment_method] ?? Receipt;
                const payColor = PAYMENT_COLORS[sale.payment_method] ?? "bg-slate-50 text-slate-600";
                const isReturned = localReturned.has(sale.id);

                return (
                  <div
                    key={sale.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5",
                      isReturned && "bg-orange-50/40"
                    )}
                  >
                    {/* Icon avatar */}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      isReturned ? "bg-orange-50" : "bg-green-50"
                    )}>
                      <PayIcon className={cn("w-4.5 h-4.5", isReturned ? "text-orange-400" : "text-[#1a9c38]")} aria-hidden="true" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-slate-900 truncate">
                        {sale.customers?.name ?? "Walk-in"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[11px] text-slate-400">{sale.sale_number}</p>
                        <span className={cn(
                          "px-1.5 rounded-full text-[10px] font-semibold capitalize leading-[18px]",
                          isReturned ? "bg-orange-100 text-orange-600" : payColor
                        )}>
                          {isReturned ? "Returned" : sale.payment_method}
                        </span>
                      </div>
                    </div>

                    {/* Amount + time */}
                    <div className="text-right flex-shrink-0">
                      <p className={cn(
                        "font-numeric text-[14px] font-bold",
                        isReturned ? "text-slate-400 line-through" : "text-slate-900"
                      )}>
                        {fmt(sale.total_amount)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(sale.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    {/* Reprint icon */}
                    <button
                      onClick={() => handleReprint(sale)}
                      disabled={reprinting === sale.id}
                      className="ml-1 p-2 rounded-full text-slate-300 active:text-green-500 transition"
                      aria-label="Reprint receipt"
                    >
                      {reprinting === sale.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Printer className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-[11px] text-slate-400 mt-3">
              Showing {filtered.length} of {sales.length} (last 90 days)
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block px-5 pt-3 pb-5">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Column headers */}
              <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <div className="w-28 flex-shrink-0">Sale #</div>
                <div className="flex-1">Customer</div>
                <div className="w-44 flex-shrink-0">Date & Time</div>
                <div className="w-24 flex-shrink-0">Method</div>
                <div className="w-28 text-right flex-shrink-0">Total</div>
                <div className="w-32 flex-shrink-0" />
              </div>

              <div className="divide-y divide-slate-50">
                {filtered.map((sale) => {
                  const PayIcon = PAYMENT_ICONS[sale.payment_method] ?? Receipt;
                  const payColor = PAYMENT_COLORS[sale.payment_method] ?? "bg-slate-50 text-slate-600";
                  const isReprinting    = reprinting === sale.id;
                  const isLoadingReturn = loadingReturn === sale.id;
                  const isReturned      = localReturned.has(sale.id);

                  return (
                    <div
                      key={sale.id}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition group",
                        isReturned && "bg-orange-50/40"
                      )}
                    >
                      <div className="w-28 flex-shrink-0 space-y-0.5">
                        <span className="text-sm font-bold text-[#0F172A] font-numeric">{sale.sale_number}</span>
                        {isReturned && (
                          <span className="block text-[10px] font-semibold text-orange-500 uppercase tracking-wide">Returned</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                          <span className="text-sm text-slate-600 truncate">{sale.customers?.name ?? "Walk-in"}</span>
                        </div>
                      </div>

                      <div className="w-44 flex-shrink-0 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        <span className="text-xs text-slate-500">{formatDate(sale.created_at)}</span>
                      </div>

                      <div className="w-24 flex-shrink-0">
                        <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg", payColor)}>
                          <PayIcon className="w-3 h-3" />
                          {sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)}
                        </span>
                      </div>

                      <div className="w-28 text-right flex-shrink-0">
                        <p className={cn("font-numeric font-bold text-sm", isReturned ? "text-slate-400 line-through" : "text-[#0F172A]")}>
                          {fmt(sale.total_amount)}
                        </p>
                        {sale.discount_amount > 0 && !isReturned && (
                          <p className="text-xs text-emerald-600">-{fmt(sale.discount_amount)} disc.</p>
                        )}
                      </div>

                      <div className="w-32 flex-shrink-0 flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleReprint(sale)}
                          disabled={isReprinting}
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-600 hover:bg-green-50 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        >
                          {isReprinting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => !isReturned && handleReturn(sale)}
                          disabled={isReturned || isLoadingReturn}
                          title={isReturned ? "Already returned" : "Process return"}
                          className={cn(
                            "flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg border transition opacity-0 group-hover:opacity-100",
                            isReturned
                              ? "border-orange-100 text-orange-300 cursor-default"
                              : "border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                          )}
                        >
                          {isLoadingReturn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
                Showing {filtered.length} of {sales.length} transactions (last 90 days)
                {localReturned.size > 0 && (
                  <span className="ml-2 text-orange-400">· {localReturned.size} returned</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Receipt reprint modal */}
      {receiptSale && (
        <ReceiptModal
          sale={receiptSale}
          business={business}
          onClose={() => setReceiptSale(null)}
        />
      )}

      {/* Return modal */}
      {returnSale && (
        <ReturnModal
          sale={{
            id:              returnSale.id,
            sale_number:     returnSale.sale_number,
            business_id:     business.id,
            created_at:      returnSale.created_at,
            customers:       returnSale.customers ? { name: returnSale.customers.name } : null,
          }}
          items={returnItems}
          business={{ currency: business.currency, name: business.name }}
          userId={userId}
          onClose={() => setReturnSale(null)}
          onSuccess={onReturnSuccess}
        />
      )}
    </div>
  );
}
