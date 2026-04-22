import Link from "next/link";
import { AlertTriangle } from "lucide-react";

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

export function LowStockAlert({ products, slug }: Props) {
  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-100">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h3 className="font-semibold text-[#0F172A] text-sm">Low Stock</h3>
        <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          {products.length}
        </span>
      </div>
      <div className="divide-y divide-slate-50">
        {products.slice(0, 5).map((product) => (
          <div key={product.id} className="flex items-center justify-between px-4 py-2.5">
            <p className="text-sm text-[#0F172A] truncate flex-1">{product.name}</p>
            <span className="font-numeric text-xs font-semibold text-amber-600 ml-2">
              {product.stock_quantity} left
            </span>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-100">
        <Link
          href={`/${slug}/products`}
          className="text-xs text-green-500 hover:underline font-medium"
        >
          Manage inventory →
        </Link>
      </div>
    </div>
  );
}
