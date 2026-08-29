import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import { ArrowRight, ShoppingCart, Scissors, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

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
  businessType: "retail" | "service" | "restaurant";
  slug: string;
}

const METHOD_STYLES: Record<string, string> = {
  cash: "bg-green-50 text-green-700",
  card: "bg-blue-50 text-blue-700",
  transfer: "bg-purple-50 text-purple-700",
  split: "bg-amber-50 text-amber-700",
};

export function RecentTransactions({ sales, currency, businessType, slug }: Props) {
  const fmt = (n: number) => formatCurrency(n, currency);
  const isService = businessType === "service";
  const isRestaurant = businessType === "restaurant";
  const heading = isService ? "Today's Services" : isRestaurant ? "Today's Orders" : "Today's Sales";
  const walkIn = isService ? "Walk-in client" : isRestaurant ? "Dine-in" : "Walk-in";
  const EmptyIcon = isService ? Scissors : isRestaurant ? Utensils : ShoppingCart;
  const emptyLabel = isService ? "No services recorded today" : isRestaurant ? "No orders today" : "No sales yet today";
  const txLabel = isService ? "services" : isRestaurant ? "orders" : "transactions";

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{heading}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{sales.length} {txLabel} today</p>
        </div>
        <Link href={`/${slug}/sales`} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-semibold transition">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <EmptyIcon className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">{emptyLabel}</p>
            <p className="text-xs text-slate-400 mt-1">
              Your {txLabel} will appear here once recorded.
            </p>
          </div>
          <Link
            href={`/${slug}/pos`}
            className="mt-1 px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition"
          >
            {isService ? "Record service" : isRestaurant ? "New order" : "Make a sale"}
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2 border-b border-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <span>Customer</span>
            <span>Payment</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Time</span>
          </div>

          <div className="divide-y divide-slate-50">
            {sales.slice(0, 8).map((sale) => (
              <div key={sale.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 gap-y-0.5 items-center px-5 py-3 hover:bg-slate-50 transition">
                {/* Customer + ref */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {sale.customers?.name ?? walkIn}
                  </p>
                  <p className="text-xs text-slate-400">{sale.sale_number}</p>
                </div>

                {/* Amount — always visible */}
                <div className="text-right sm:order-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {fmt(sale.total_amount)}
                  </p>
                </div>

                {/* Payment badge — sm+ */}
                <div className="hidden sm:flex sm:order-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize",
                    METHOD_STYLES[sale.payment_method] ?? "bg-slate-100 text-slate-600"
                  )}>
                    {sale.payment_method}
                  </span>
                </div>

                {/* Time — sm+ */}
                <div className="hidden sm:block sm:order-4 text-right">
                  <p className="text-xs text-slate-400">
                    {new Date(sale.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
