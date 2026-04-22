"use client";

import { useState, useRef } from "react";
import { Search, Package, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  image_url: string | null;
  sku: string | null;
  barcode: string | null;
  categories: { name: string; color: string } | null;
}

interface Props {
  products: Product[];
  currency: string;
}

export function ProductSearchPanel({ products, currency }: Props) {
  const [search, setSearch] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const searchRef = useRef<HTMLInputElement>(null);

  // Barcode scanner sniffing: < 50ms between keystrokes = scanner
  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const now = Date.now();
    const delta = now - lastKeyTime;
    setLastKeyTime(now);

    if (e.key === "Enter") {
      const match = products.find(
        (p) =>
          p.barcode === search.trim() || p.sku === search.trim()
      );
      if (match) {
        addProduct(match);
        setSearch("");
        return;
      }
    }
  }

  function addProduct(product: Product) {
    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: product.selling_price,
      costPrice: product.cost_price,
      imageUrl: product.image_url,
    });
  }

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q) ||
      (p.barcode ?? "").includes(q)
    );
  });

  const cartProductIds = new Set(items.map((i) => i.productId));

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Search bar */}
      <div className="p-3 bg-white border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search products, scan barcode..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            autoFocus
          />
        </div>
        <p className="text-xs text-slate-400 mt-1.5 px-1">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          {search && ` matching "${search}"`}
        </p>
      </div>

      {/* Products list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Package className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-slate-500 text-sm">No products found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((product) => {
              const inCart = cartProductIds.has(product.id);
              const outOfStock = product.stock_quantity === 0;

              return (
                <button
                  key={product.id}
                  onClick={() => !outOfStock && addProduct(product)}
                  disabled={outOfStock}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left transition",
                    outOfStock
                      ? "opacity-40 cursor-not-allowed"
                      : inCart
                      ? "bg-green-50"
                      : "hover:bg-slate-50 active:bg-slate-100"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-300" />
                    )}
                  </div>

                  {/* Name + category */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{product.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {product.categories && (
                        <span
                          className="text-xs font-medium px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: product.categories.color }}
                        >
                          {product.categories.name}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {outOfStock ? "Out of stock" : `${product.stock_quantity} left`}
                      </span>
                    </div>
                  </div>

                  {/* Price + cart indicator */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="font-numeric text-sm font-bold text-green-600">
                      {formatCurrency(product.selling_price, currency)}
                    </p>
                    {inCart && (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
