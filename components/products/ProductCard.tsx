"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, AlertTriangle, MapPin, Plus, Minus, MoreVertical, Pencil, Eye, EyeOff, Share2, Trash2, X, ChevronRight } from "lucide-react";
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
  slug: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onStockChange?: (productId: string, newQty: number) => void;
  hideStock?: boolean;
  isService?: boolean;
}

export function ProductCard({ product, currency, slug, onEdit, onDelete, onStockChange, hideStock = false, isService = false }: Props) {
  const detailHref = `/${slug}/products/${product.id}`;
  const [qty, setQty] = useState(product.stock_quantity);
  const [saving, setSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isActive, setIsActive] = useState(product.is_active);
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

  async function handleTogglePublish() {
    const supabase = createClient();
    const newActive = !isActive;
    await supabase.from("products").update({ is_active: newActive }).eq("id", product.id);
    setIsActive(newActive);
    setShowMenu(false);
  }

  async function handleShare() {
    const url = `${window.location.origin}/store/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // user dismissed share sheet — ignore
    }
    setShowMenu(false);
  }

  return (
    <>
      <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-slate-50 transition group">
        {/* Thumbnail */}
        <Link
          href={detailHref}
          className="relative w-14 h-14 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
        >
          {product.image_url ? (
            <Image src={product.image_url!} alt={product.name} fill className="object-cover" sizes="56px" />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-slate-300" />
            </div>
          )}
        </Link>

        {/* Name + price */}
        <Link href={detailHref} className="flex-1 min-w-0 block">
          <p className="font-semibold text-[#0F172A] text-[15px] truncate leading-snug">{product.name}</p>
          {/* Desktop meta */}
          <div className="hidden sm:flex items-center gap-1.5 mt-0.5 flex-wrap">
            {product.sku && <span className="text-xs text-slate-400">SKU: {product.sku}</span>}
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
          {/* Price below name on mobile */}
          <p className="font-semibold text-[#0F172A] text-[12px] mt-2 sm:hidden">
            {formatCurrency(product.selling_price, currency)}
          </p>
        </Link>

        {/* Stock */}
        {!hideStock && (
          <>
            <span className={cn(
              "text-xs flex-shrink-0 sm:hidden",
              isOutOfStock ? "text-red-500 font-medium" : isLowStock ? "text-amber-500 font-medium" : "text-slate-400"
            )} onClick={(e) => e.stopPropagation()}>
              {isOutOfStock ? "Out of stock" : `${qty} in stock`}
            </span>

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
                isOutOfStock ? "bg-red-50 text-red-600" : isLowStock ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-700"
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

        {/* Price column — desktop only */}
        <div className="text-right flex-shrink-0 w-28 hidden md:block">
          <p className="font-semibold text-[#0F172A] text-sm">
            {formatCurrency(product.selling_price, currency)}
          </p>
          {!isService && <p className="text-xs text-slate-400">{margin.toFixed(0)}% margin</p>}
          {isService && product.cost_price > 0 && (
            <p className="text-xs text-slate-400">cost: {formatCurrency(product.cost_price, currency)}</p>
          )}
        </div>

        {/* 3-dot menu button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(true); }}
          className="flex-shrink-0 p-2 -mr-1 rounded-full hover:bg-slate-100 transition"
        >
          <MoreVertical className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Bottom sheet menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end"
          onClick={() => setShowMenu(false)}
        >
          <div
            className="w-full bg-white rounded-t-2xl pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
              <p className="font-bold text-[15px] text-[#0F172A] truncate flex-1 mr-3">{product.name}</p>
              <button onClick={() => setShowMenu(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions */}
            <Link
              href={detailHref}
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition"
            >
              <Pencil className="w-5 h-5 text-slate-400" />
              <span className="flex-1 text-[15px] text-[#0F172A]">Edit product</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>

            <button
              onClick={handleTogglePublish}
              className="w-full flex items-center gap-4 px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition text-left"
            >
              {isActive
                ? <EyeOff className="w-5 h-5 text-slate-400" />
                : <Eye className="w-5 h-5 text-slate-400" />}
              <span className="flex-1 text-[15px] text-[#0F172A]">
                {isActive ? "Unpublish product" : "Publish product"}
              </span>
            </button>

            <button
              onClick={handleShare}
              className="w-full flex items-center gap-4 px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition text-left"
            >
              <Share2 className="w-5 h-5 text-slate-400" />
              <span className="flex-1 text-[15px] text-[#0F172A]">Share product link</span>
            </button>

            <button
              onClick={() => { setShowMenu(false); onDelete?.(); }}
              className="w-full flex items-center gap-4 px-5 py-4 border-b border-slate-100 hover:bg-red-50 transition text-left"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
              <span className="flex-1 text-[15px] text-red-500 font-medium">Delete Product</span>
            </button>

            <div className="px-5 pt-4">
              <button
                onClick={() => setShowMenu(false)}
                className="w-full h-11 border border-[#1a9c38] text-[#1a9c38] font-bold rounded-[4px] text-[15px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
