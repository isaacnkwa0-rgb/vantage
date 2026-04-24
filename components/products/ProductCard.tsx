"use client";

import { useState } from "react";
import { Edit2, Package, AlertTriangle, X, MapPin, Plus, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  image_url: string | null;
  sku: string | null;
  categories: { name: string; color: string } | null;
  locations: { name: string } | null;
}

interface Props {
  product: Product;
  currency: string;
  onEdit: () => void;
  onStockChange?: (productId: string, newQty: number) => void;
  hideStock?: boolean;
  isService?: boolean;
}

export function ProductCard({ product, currency, onEdit, onStockChange, hideStock = false, isService = false }: Props) {
  const [preview, setPreview] = useState(false);
  const [qty, setQty] = useState(product.stock_quantity);
  const [saving, setSaving] = useState(false);
  const isLowStock = qty > 0 && qty <= product.low_stock_threshold;
  const isOutOfStock = qty === 0;
  const profit = product.selling_price - product.cost_price;
  const margin = product.selling_price > 0 ? (profit / product.selling_price) * 100 : 0;

  async function adjustStock(delta: number) {
    const newQty = Math.max(0, qty + delta);
    if (newQty === qty) return;
    setQty(newQty);
    setSaving(true);
    const supabase = createClient();
    await supabase.from("products").update({ stock_quantity: newQty }).eq("id", product.id);
    setSaving(false);
    onStockChange?.(product.id, newQty);
  }

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition group">
        {/* Image thumbnail */}
        <div
          className={cn(
            "w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200",
            product.image_url ? "cursor-pointer hover:ring-2 hover:ring-green-400 hover:ring-offset-1" : ""
          )}
          onClick={() => product.image_url && setPreview(true)}
        >
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-5 h-5 text-slate-300" />
          )}
        </div>

        {/* Name + SKU + category */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#0F172A] text-sm truncate">{product.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {product.sku && (
              <span className="text-xs text-slate-400">SKU: {product.sku}</span>
            )}
            {product.categories && (
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: product.categories.color }}
              >
                {product.categories.name}
              </span>
            )}
            {product.locations && (
              <span className="text-xs text-slate-400 flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                {product.locations.name}
              </span>
            )}
          </div>
        </div>

        {/* Stock controls */}
        {!hideStock && (
          <div className="w-36 flex-shrink-0 hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => adjustStock(-1)}
              disabled={saving || qty === 0}
              className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 transition flex-shrink-0"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className={cn(
              "flex-1 inline-flex items-center justify-center gap-1 text-xs font-medium px-2 py-1 rounded-lg",
              isOutOfStock
                ? "bg-red-50 text-red-600"
                : isLowStock
                ? "bg-amber-50 text-amber-600"
                : "bg-emerald-50 text-emerald-700"
            )}>
              {(isLowStock || isOutOfStock) && <AlertTriangle className="w-3 h-3" />}
              {isOutOfStock ? "Out of stock" : isLowStock ? `Low: ${qty}` : `${qty} in stock`}
            </span>
            <button
              onClick={() => adjustStock(1)}
              disabled={saving}
              className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 transition flex-shrink-0"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Price */}
        <div className="text-right flex-shrink-0 w-28 hidden md:block">
          <p className="font-numeric font-semibold text-[#0F172A] text-sm">
            {formatCurrency(product.selling_price, currency)}
          </p>
          {!isService && <p className="text-xs text-slate-400">{margin.toFixed(0)}% margin</p>}
          {isService && product.cost_price > 0 && (
            <p className="text-xs text-slate-400">cost: {formatCurrency(product.cost_price, currency)}</p>
          )}
        </div>

        {/* Edit button */}
        <button
          onClick={onEdit}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition flex-shrink-0 opacity-0 group-hover:opacity-100"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* Image preview lightbox */}
      {preview && product.image_url && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition"
            onClick={() => setPreview(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={product.image_url}
            alt={product.name}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
