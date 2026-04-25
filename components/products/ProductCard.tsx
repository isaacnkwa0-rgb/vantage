"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Package, AlertTriangle, X, MapPin, Plus, Minus, Trash2 } from "lucide-react";
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
  onDelete?: () => void;
  onStockChange?: (productId: string, newQty: number) => void;
  hideStock?: boolean;
  isService?: boolean;
}

export function ProductCard({ product, currency, onEdit, onDelete, onStockChange, hideStock = false, isService = false }: Props) {
  const router = useRouter();
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

  async function handleDelete() {
    if (!window.confirm(`Delete "${product.name}"? This will remove it from your catalog.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("products").update({ is_active: false }).eq("id", product.id);
    if (error) { alert(`Failed to delete: ${error.message}`); return; }
    onDelete?.();
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-slate-50 transition group">
        {/* Image thumbnail */}
        <div
          className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200",
            product.image_url ? "cursor-pointer hover:ring-2 hover:ring-green-400 hover:ring-offset-1" : ""
          )}
          onClick={() => product.image_url && setPreview(true)}
        >
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
          )}
        </div>

        {/* Name + SKU + category + mobile price */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#0F172A] text-sm truncate">{product.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
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
          {/* Price shown below name on mobile */}
          <p className="font-numeric font-semibold text-emerald-600 text-sm mt-1 md:hidden">
            {formatCurrency(product.selling_price, currency)}
            {!isService && (
              <span className="text-slate-400 font-normal text-xs ml-1">· {margin.toFixed(0)}% margin</span>
            )}
          </p>
        </div>

        {/* Stock controls */}
        {!hideStock && (
          <>
            {/* Mobile: compact +/- with quantity number */}
            <div className="flex items-center gap-1 sm:hidden flex-shrink-0">
              <button
                onClick={() => adjustStock(-1)}
                disabled={saving || qty === 0}
                className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition flex-shrink-0"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className={cn(
                "text-xs font-semibold w-7 text-center",
                isOutOfStock ? "text-red-500" : isLowStock ? "text-amber-500" : "text-slate-700"
              )}>
                {qty}
              </span>
              <button
                onClick={() => adjustStock(1)}
                disabled={saving}
                className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition flex-shrink-0"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Desktop: full stock status badge */}
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
          </>
        )}

        {/* Price column — desktop only (mobile shows below name) */}
        <div className="text-right flex-shrink-0 w-28 hidden md:block">
          <p className="font-numeric font-semibold text-[#0F172A] text-sm">
            {formatCurrency(product.selling_price, currency)}
          </p>
          {!isService && <p className="text-xs text-slate-400">{margin.toFixed(0)}% margin</p>}
          {isService && product.cost_price > 0 && (
            <p className="text-xs text-slate-400">cost: {formatCurrency(product.cost_price, currency)}</p>
          )}
        </div>

        {/* Action buttons — always visible on mobile, hover-reveal on desktop */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition sm:opacity-0 sm:group-hover:opacity-100"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition sm:opacity-0 sm:group-hover:opacity-100"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
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
