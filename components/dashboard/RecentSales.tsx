import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import { ShoppingCart } from "lucide-react";

interface Sale {
  id: string;
  sale_number: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  customers: { name: string } | null;
}

interface Props {
  sales: Sale[];
  currency: string;
  businessType?: "retail" | "service" | "restaurant";
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  transfer: "Transfer",
  split: "Split",
};

export function RecentSales({ sales, currency, businessType = "retail" }: Props) {
  const fmt = (n: number) => formatCurrency(n, currency);
  const isService = businessType === "service";
  const isRestaurant = businessType === "restaurant";

  const heading = isService ? "Today's Services" : isRestaurant ? "Today's Orders" : "Today's Sales";
  const walkinLabel = isService ? "Walk-in client" : isRestaurant ? "Dine-in" : "Walk-in customer";
  const emptyLabel = isService ? "No services recorded today" : isRestaurant ? "No orders today" : "No sales yet today";
  const txUnit = isService ? "services" : isRestaurant ? "orders" : "transactions";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-[#0F172A]">{heading}</h3>
        <span className="text-xs text-slate-400">{sales.length} {txUnit}</span>
      </div>

      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingCart className="w-10 h-10 text-slate-200 mb-3" />
          <p className="text-slate-500 text-sm font-medium">{emptyLabel}</p>
          <p className="text-slate-400 text-xs mt-1">Transactions will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {sales.slice(0, 8).map((sale) => (
            <div
              key={sale.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0F172A] truncate">
                  {sale.customers?.name ?? walkinLabel}
                </p>
                <p className="text-xs text-slate-400">
                  {sale.sale_number} ·{" "}
                  {new Date(sale.created_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex-shrink-0">
                {METHOD_LABELS[sale.payment_method] ?? sale.payment_method}
              </span>
              <span className="font-numeric text-sm font-semibold text-emerald-600 flex-shrink-0">
                {fmt(sale.total_amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
