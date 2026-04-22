"use client";

import { useState, useMemo } from "react";
import {
  Search, Receipt, Printer, TrendingUp, ShoppingBag,
  CreditCard, Banknote, ArrowLeftRight, Loader2, Calendar,
  User, Download, BookOpen,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { createClient } from "@/lib/supabase/client";
import { ReceiptModal } from "@/components/pos/ReceiptModal";
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
}

interface Props {
  sales: Sale[];
  business: Business;
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

export function SalesClient({ sales, business }: Props) {
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [reprinting, setReprinting] = useState<string | null>(null);
  const [receiptSale, setReceiptSale] = useState<any | null>(null);
  const fmt = (n: number) => formatCurrency(n, business.currency);

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

  async function handleReprint(sale: Sale) {
    setReprinting(sale.id);
    const supabase = createClient();
    const { data: items } = await supabase
      .from("sale_items")
      .select("product_name, variant_name, quantity, unit_price, line_total")
      .eq("sale_id", sale.id);

    setReprinting(null);
    setReceiptSale({
      ...sale,
      customer_name: sale.customers?.name ?? null,
      customer_phone: sale.customers?.phone ?? null,
      items: (items ?? []).map((i) => ({
        product_name: i.product_name,
        variant_name: i.variant_name ?? null,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: i.line_total,
      })),
    });
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
    const headers = ["Sale #", "Customer", "Date", "Payment Method", "Subtotal", "Discount", "Tax", "Total"];
    const rows = filtered.map((s) => [
      s.sale_number,
      s.customers?.name ?? "Walk-in",
      new Date(s.created_at).toLocaleString("en-GB"),
      s.payment_method,
      s.subtotal.toFixed(2),
      s.discount_amount.toFixed(2),
      s.tax_amount.toFixed(2),
      s.total_amount.toFixed(2),
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
    <div className="flex-1 p-5 space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by sale number or customer..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All payment methods</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="transfer">Transfer</option>
          <option value="credit">Credit</option>
        </select>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-40 bg-white"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Sales list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Receipt className="w-14 h-14 text-slate-200 mb-4" />
          <p className="text-slate-600 font-medium">
            {search ? "No transactions match your search" : "No transactions yet"}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {search ? "Try a different keyword" : "Sales made through the POS will appear here"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div className="w-28 flex-shrink-0">Sale #</div>
            <div className="flex-1">Customer</div>
            <div className="w-44 flex-shrink-0 hidden sm:block">Date & Time</div>
            <div className="w-24 flex-shrink-0 hidden md:block">Method</div>
            <div className="w-28 text-right flex-shrink-0">Total</div>
            <div className="w-20 flex-shrink-0" />
          </div>

          <div className="divide-y divide-slate-50">
            {filtered.map((sale) => {
              const PayIcon = PAYMENT_ICONS[sale.payment_method] ?? Receipt;
              const payColor = PAYMENT_COLORS[sale.payment_method] ?? "bg-slate-50 text-slate-600";
              const isReprinting = reprinting === sale.id;

              return (
                <div
                  key={sale.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition group"
                >
                  {/* Sale number */}
                  <div className="w-28 flex-shrink-0">
                    <span className="text-sm font-bold text-[#0F172A] font-numeric">
                      {sale.sale_number}
                    </span>
                  </div>

                  {/* Customer */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      <span className="text-sm text-slate-600 truncate">
                        {sale.customers?.name ?? "Walk-in"}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="w-44 flex-shrink-0 hidden sm:flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="text-xs text-slate-500">{formatDate(sale.created_at)}</span>
                  </div>

                  {/* Payment method */}
                  <div className="w-24 flex-shrink-0 hidden md:block">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg",
                      payColor
                    )}>
                      <PayIcon className="w-3 h-3" />
                      {sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)}
                    </span>
                  </div>

                  {/* Total */}
                  <div className="w-28 text-right flex-shrink-0">
                    <p className="font-numeric font-bold text-sm text-[#0F172A]">
                      {fmt(sale.total_amount)}
                    </p>
                    {sale.discount_amount > 0 && (
                      <p className="text-xs text-emerald-600">-{fmt(sale.discount_amount)} disc.</p>
                    )}
                  </div>

                  {/* Reprint button */}
                  <div className="w-20 flex-shrink-0 flex justify-end">
                    <button
                      onClick={() => handleReprint(sale)}
                      disabled={isReprinting}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-600 hover:bg-green-50 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      {isReprinting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Printer className="w-3.5 h-3.5" />
                      )}
                      {isReprinting ? "" : "Print"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer count */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {sales.length} transactions (last 90 days)
          </div>
        </div>
      )}

      {/* Receipt modal for reprint */}
      {receiptSale && (
        <ReceiptModal
          sale={receiptSale}
          business={business}
          onClose={() => setReceiptSale(null)}
        />
      )}
    </div>
  );
}
