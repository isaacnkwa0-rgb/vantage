"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, Share2, Trash2, Package, MapPin,
  Tag, Eye, EyeOff, Loader2, AlertTriangle,
  ChevronRight, History, BarChart3,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { ProductForm } from "./ProductForm";
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
  barcode: string | null;
  description: string | null;
  category_id: string | null;
  location_id: string | null;
  track_inventory: boolean;
  min_order_qty: number | null;
  max_order_qty: number | null;
  categories: { name: string; color: string } | null;
  locations: { name: string } | null;
}

interface StockAdjustment {
  adjustment: number;
  reason: string;
  notes: string | null;
  created_at: string;
}

interface Props {
  product: Product;
  categories: { id: string; name: string; color: string }[];
  locations: { id: string; name: string; address: string | null; phone: string | null }[];
  businessId: string;
  currency: string;
  slug: string;
  isService: boolean;
  totalUnitsSold: number;
  totalRevenue: number;
  totalSalesCount: number;
  recentAdjustments: StockAdjustment[];
}

function compactAmount(n: number, currency: string) {
  const sym = formatCurrency(0, currency).replace(/[\d.,\s]/g, "").trim();
  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(1)}K`;
  return formatCurrency(n, currency);
}

export function ProductDetailPage({
  product,
  categories,
  locations,
  businessId,
  currency,
  slug,
  isService,
  totalUnitsSold,
  totalRevenue,
  totalSalesCount,
  recentAdjustments,
}: Props) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [qty, setQty] = useState(product.stock_quantity);
  const [isActive, setIsActive] = useState(product.is_active);
  const [adjusting, setAdjusting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fmt = (n: number) => formatCurrency(n, currency);
  const isLow = qty <= product.low_stock_threshold && qty > 0;
  const isOut = qty === 0 && product.track_inventory;
  const margin =
    product.selling_price > 0
      ? ((product.selling_price - product.cost_price) / product.selling_price) * 100
      : 0;

  async function adjustStock(delta: number) {
    const newQty = Math.max(0, qty + delta);
    if (newQty === qty) return;
    setAdjusting(true);
    setQty(newQty);
    const supabase = createClient();
    await supabase
      .from("products")
      .update({ stock_quantity: newQty })
      .eq("id", product.id);
    setAdjusting(false);
  }

  async function toggleActive() {
    setToggling(true);
    const supabase = createClient();
    await supabase
      .from("products")
      .update({ is_active: !isActive })
      .eq("id", product.id);
    setIsActive(!isActive);
    setToggling(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("products").update({ is_active: false }).eq("id", product.id);
    router.push(`/${slug}/products`);
    router.refresh();
  }

  async function handleShare() {
    const url = `${window.location.origin}/store/${slug}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: product.name, text: `Check out ${product.name}`, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const META_ROWS = [
    product.sku ? { label: "SKU", value: product.sku } : null,
    product.barcode ? { label: "Barcode", value: product.barcode } : null,
    product.categories ? { label: "Category", value: product.categories.name } : null,
    product.locations ? { label: "Location", value: product.locations.name } : null,
    !isService && product.cost_price > 0 ? { label: "Cost Price", value: fmt(product.cost_price) } : null,
    !isService && product.cost_price > 0 ? { label: "Profit Margin", value: `${margin.toFixed(1)}%` } : null,
    !isService && product.min_order_qty && product.min_order_qty > 1
      ? { label: "Min Order Qty", value: String(product.min_order_qty) }
      : null,
    !isService && product.max_order_qty
      ? { label: "Max Order Qty", value: String(product.max_order_qty) }
      : null,
    !isService
      ? { label: "Low Stock Alert", value: `${product.low_stock_threshold} units` }
      : null,
    product.description ? { label: "Description", value: product.description } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#F5F6F8]">
      {/* Mobile header — hidden on lg (TopBar handles that) */}
      <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-100 flex items-center px-4 h-14 gap-3 flex-shrink-0">
        <Link
          href={`/${slug}/products`}
          className="flex items-center gap-0.5 text-[#1a9c38] text-[15px] font-medium flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Products</span>
        </Link>
        <h1 className="flex-1 text-center font-bold text-slate-900 text-[15px] truncate px-2">
          {product.name}
        </h1>
        <button
          onClick={() => setShowEdit(true)}
          className="text-green-600 text-sm font-semibold flex-shrink-0"
        >
          Edit
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3 pb-8">

          {/* Hero card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Product image */}
            {product.image_url && (
              <div className="relative w-full h-48 bg-slate-100">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, 640px"
                />
              </div>
            )}
            {!product.image_url && (
              <div className="flex items-center justify-center h-28 bg-slate-50 border-b border-slate-100">
                <Package className="w-12 h-12 text-slate-200" />
              </div>
            )}

            {/* Name + price + toggle */}
            <div className="px-4 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-bold text-[#0F172A] text-lg leading-tight">{product.name}</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{fmt(product.selling_price)}</p>
                {!isService && product.cost_price > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {margin.toFixed(0)}% margin · cost {fmt(product.cost_price)}
                  </p>
                )}
              </div>
              {/* Publish toggle */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <button
                  onClick={toggleActive}
                  disabled={toggling}
                  aria-label={isActive ? "Unpublish product" : "Publish product"}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
                    isActive ? "bg-green-500" : "bg-slate-200",
                    toggling && "opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                      isActive ? "translate-x-6" : "translate-x-0.5"
                    )}
                  />
                </button>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isActive ? "Published" : "Unpublished"}
                </span>
              </div>
            </div>
          </div>

          {/* Stock quantity card — retail only */}
          {!isService && product.track_inventory && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-center mb-4">
                Stock Quantity
              </p>
              <div className="flex items-center justify-center gap-8">
                <button
                  onClick={() => adjustStock(-1)}
                  disabled={adjusting || qty === 0}
                  className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 text-xl font-bold active:bg-slate-100 disabled:opacity-30 transition"
                >
                  −
                </button>
                <span
                  className={cn(
                    "text-5xl font-bold tabular-nums min-w-[3ch] text-center",
                    isOut ? "text-red-500" : isLow ? "text-amber-500" : "text-[#0F172A]"
                  )}
                >
                  {qty}
                </span>
                <button
                  onClick={() => adjustStock(1)}
                  disabled={adjusting}
                  className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 text-xl font-bold active:bg-slate-100 disabled:opacity-30 transition"
                >
                  +
                </button>
              </div>
              {(isLow || isOut) && (
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-xs font-medium text-amber-600">
                    {isOut ? "Out of stock" : `Low stock — alert threshold: ${product.low_stock_threshold}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#EEF6FF] rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-[#0F172A]">{totalUnitsSold}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                {isService ? "Sessions" : "Units sold"}
              </p>
            </div>
            <div className="bg-[#FEF9EC] rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-[#0F172A]">{totalSalesCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                {isService ? "Bookings" : "Orders"}
              </p>
            </div>
            <div className="bg-[#E8F5EC] rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-[#0F172A] leading-tight">
                {compactAmount(totalRevenue, currency)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Revenue</p>
            </div>
          </div>

          {/* Stock history */}
          {!isService && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="w-full flex items-center gap-3 px-4 py-4 active:bg-slate-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500"
              >
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <History className="w-5 h-5 text-green-600" />
                </div>
                <span className="flex-1 text-left text-sm font-semibold text-slate-700">
                  Stock History
                </span>
                <ChevronRight
                  className={cn(
                    "w-4 h-4 text-slate-300 transition-transform",
                    showHistory && "rotate-90"
                  )}
                />
              </button>

              {showHistory && (
                <div className="border-t border-slate-100">
                  {recentAdjustments.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-5">No manual stock adjustments yet</p>
                  ) : (
                    recentAdjustments.map((adj, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0"
                      >
                        <span
                          className={cn(
                            "text-sm font-bold w-10 text-center flex-shrink-0",
                            adj.adjustment > 0 ? "text-green-600" : "text-red-500"
                          )}
                        >
                          {adj.adjustment > 0 ? `+${adj.adjustment}` : adj.adjustment}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 font-medium">{adj.reason}</p>
                          {adj.notes && (
                            <p className="text-xs text-slate-400 truncate">{adj.notes}</p>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 flex-shrink-0">
                          {new Date(adj.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          {META_ROWS.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {META_ROWS.map((row, i) => (
                <div
                  key={row.label}
                  className={cn(
                    "flex items-start justify-between gap-4 px-4 py-3.5",
                    i > 0 && "border-t border-slate-50"
                  )}
                >
                  <span className="text-sm text-slate-500 flex-shrink-0">{row.label}</span>
                  <span className="text-sm font-medium text-[#0F172A] text-right">{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bottom actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center justify-center gap-2 border border-red-200 text-red-500 rounded-2xl h-12 text-sm font-semibold active:bg-red-50 transition disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-2xl h-12 text-sm font-semibold active:bg-green-700 transition"
            >
              <Share2 className="w-4 h-4" />
              {copied ? "Link copied!" : "Share link"}
            </button>
          </div>
        </div>
      </div>

      {/* Edit form modal */}
      {showEdit && (
        <ProductForm
          businessId={businessId}
          categories={categories}
          locations={locations}
          editingProduct={product}
          onClose={() => {
            setShowEdit(false);
            router.refresh();
          }}
          businessType={isService ? "service" : "retail"}
        />
      )}
    </div>
  );
}
