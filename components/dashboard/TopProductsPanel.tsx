import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/currency";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

interface Props {
  businessId: string;
  currency: string;
  businessType: "retail" | "service" | "restaurant";
  slug: string;
}

export async function TopProductsPanel({ businessId, currency, businessType, slug }: Props) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("sale_items")
    .select("product_name, quantity, line_total")
    .eq("business_id", businessId);

  const map = new Map<string, { qty: number; revenue: number }>();
  (data ?? []).forEach((item) => {
    const e = map.get(item.product_name) ?? { qty: 0, revenue: 0 };
    map.set(item.product_name, { qty: e.qty + item.quantity, revenue: e.revenue + item.line_total });
  });

  const top = Array.from(map.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  const totalRevenue = top.reduce((s, [, { revenue }]) => s + revenue, 0);
  const fmt = (n: number) => formatCurrency(n, currency);

  const widgetTitle = businessType === "service" ? "Top Services" : businessType === "restaurant" ? "Popular Dishes" : "Top Products";
  const soldLabel = businessType === "service" ? "times" : businessType === "restaurant" ? "orders" : "sold";

  const RANK_COLORS = ["bg-amber-400", "bg-slate-400", "bg-orange-400", "bg-slate-300", "bg-slate-200"];

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">{widgetTitle}</h3>
        </div>
        <Link href={`/${slug}/reports`} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-semibold transition">
          Reports <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {top.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <Package className="w-8 h-8 text-slate-200" />
          <p className="text-sm font-medium text-slate-500">No products sold yet</p>
          <p className="text-xs text-slate-400">Top performers will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {top.map(([name, { qty, revenue }], i) => {
            const pct = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
            return (
              <div key={name} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${RANK_COLORS[i]}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-numeric text-xs font-bold text-slate-900">{fmt(revenue)}</p>
                  <p className="text-[10px] text-slate-400">{qty} {soldLabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
