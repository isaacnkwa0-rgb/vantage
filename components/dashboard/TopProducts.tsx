import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/currency";
import { Package } from "lucide-react";

interface Props {
  businessId: string;
  currency: string;
  businessType?: "retail" | "service" | "restaurant";
}

export async function TopProducts({ businessId, currency, businessType = "retail" }: Props) {
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("sale_items")
    .select("product_name, quantity, line_total")
    .eq("business_id", businessId);

  // Aggregate by product name
  const map = new Map<string, { qty: number; revenue: number }>();
  (data ?? []).forEach((item) => {
    const existing = map.get(item.product_name) ?? { qty: 0, revenue: 0 };
    map.set(item.product_name, {
      qty: existing.qty + item.quantity,
      revenue: existing.revenue + item.line_total,
    });
  });

  const top = Array.from(map.entries())
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5);

  const fmt = (n: number) => formatCurrency(n, currency);
  const isService = businessType === "service";
  const isRestaurant = businessType === "restaurant";
  const widgetTitle = isService ? "Top Services" : isRestaurant ? "Popular Dishes" : "Top Products";
  const soldLabel = isService ? "times" : isRestaurant ? "orders" : "sold";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <Package className="w-4 h-4 text-slate-400" />
        <h3 className="font-semibold text-[#0F172A] text-sm">{widgetTitle}</h3>
      </div>

      {top.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-slate-400 text-xs">No data yet</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {top.map(([name, { qty, revenue }], i) => (
            <div key={name} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-5 h-5 bg-slate-100 text-slate-500 rounded-full text-xs flex items-center justify-center font-medium flex-shrink-0">
                {i + 1}
              </span>
              <p className="text-sm text-[#0F172A] flex-1 truncate">{name}</p>
              <div className="text-right flex-shrink-0">
                <p className="font-numeric text-xs font-semibold text-[#0F172A]">
                  {fmt(revenue)}
                </p>
                <p className="text-xs text-slate-400">{qty} {soldLabel}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
