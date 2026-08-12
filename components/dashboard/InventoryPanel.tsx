import Link from "next/link";
import { Package, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

interface Props {
  products: Product[];
  slug: string;
}

export function InventoryPanel({ products, slug }: Props) {
  const total = products.length;
  const lowStock = products.filter((p) => p.stock_quantity <= p.low_stock_threshold);
  const runningLow = products.filter(
    (p) => p.stock_quantity > p.low_stock_threshold && p.stock_quantity <= p.low_stock_threshold * 2
  );
  const healthy = total - lowStock.length - runningLow.length;

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-900">Inventory</p>
        </div>
        <p className="text-sm text-slate-400 py-4 text-center">No products yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-900">Inventory</p>
        </div>
        <span className="font-numeric text-xs font-semibold text-slate-500">{total.toLocaleString()} products</span>
      </div>

      <div className="space-y-2">
        {lowStock.length > 0 && (
          <Link href={`/${slug}/products`} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg hover:bg-red-100 transition group">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-700">Low stock</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-numeric text-xs font-bold text-red-700">{lowStock.length}</span>
              <ArrowRight className="w-3 h-3 text-red-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
          </Link>
        )}

        {runningLow.length > 0 && (
          <Link href={`/${slug}/products`} className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition group">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">Running low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-numeric text-xs font-bold text-amber-700">{runningLow.length}</span>
              <ArrowRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
          </Link>
        )}

        <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-green-700">Healthy</span>
          </div>
          <span className="font-numeric text-xs font-bold text-green-700">{healthy}</span>
        </div>
      </div>

      {(lowStock.length > 0 || runningLow.length > 0) && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-600 mb-2">Needs restock</p>
          <div className="space-y-1.5">
            {lowStock.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <p className="text-xs text-slate-600 truncate flex-1 mr-2">{p.name}</p>
                <span className={cn("text-xs font-numeric font-semibold flex-shrink-0", p.stock_quantity === 0 ? "text-red-600" : "text-amber-600")}>
                  {p.stock_quantity} left
                </span>
              </div>
            ))}
          </div>
          <Link href={`/${slug}/products`} className="mt-2 flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-semibold transition">
            View all inventory <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
