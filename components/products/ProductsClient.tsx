"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Search, Package, TrendingUp, BarChart3, Download, Briefcase } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { ProductForm } from "./ProductForm";
import { ProductCard } from "./ProductCard";
import { BulkImportModal } from "./BulkImportModal";
import { ImportInstagramModal } from "./ImportInstagramModal";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Location {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

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
  category_id: string | null;
  location_id: string | null;
  categories: { name: string; color: string } | null;
  locations: { name: string } | null;
}

interface Props {
  products: Product[];
  categories: Category[];
  locations: Location[];
  businessId: string;
  currency: string;
  slug: string;
  businessType?: "retail" | "service";
}

export function ProductsClient({ products, categories, locations, businessId, currency, slug, businessType = "retail" }: Props) {
  const isService = businessType === "service";
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showInstagram, setShowInstagram] = useState(false);
  const [igStartConnected, setIgStartConnected] = useState(false);
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("instagram") === "connected") {
      setIgStartConnected(true);
      setShowInstagram(true);
      // Clean the query param without full navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("instagram");
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    }
    if (searchParams.get("instagram_error") === "true") {
      setIgStartConnected(false);
      setShowInstagram(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("instagram_error");
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleStockChange(productId: string, newQty: number) {
    setStockOverrides((prev) => ({ ...prev, [productId]: newQty }));
  }

  function getQty(p: Product) {
    return stockOverrides[p.id] !== undefined ? stockOverrides[p.id] : p.stock_quantity;
  }

  const MOBILE_TABS = isService
    ? [
        { value: "all",      label: "All" },
        { value: "active",   label: "Active" },
        { value: "inactive", label: "Inactive" },
      ]
    : [
        { value: "all",           label: "All" },
        { value: "active",        label: "Active" },
        { value: "inactive",      label: "Inactive" },
        { value: "out-of-stock",  label: "Out of Stock" },
      ];

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (selectedFilter === "all") return true;
    if (selectedFilter === "active") return p.is_active;
    if (selectedFilter === "inactive") return !p.is_active;
    if (selectedFilter === "out-of-stock") return getQty(p) === 0;
    if (selectedFilter === "low-stock") return getQty(p) <= p.low_stock_threshold;
    if (selectedFilter.startsWith("loc-")) return p.location_id === selectedFilter.slice(4);
    return p.category_id === selectedFilter;
  });

  const stockValue = filtered.reduce((s, p) => s + p.cost_price * getQty(p), 0);
  const retailValue = filtered.reduce((s, p) => s + p.selling_price * getQty(p), 0);
  const profitPotential = retailValue - stockValue;
  const fmt = (n: number) => formatCurrency(n, currency);

  function exportCSV() {
    const headers = ["Name", "SKU", "Category", "Location", "Stock", "Low Stock Threshold", "Cost Price", "Selling Price", "Stock Value", "Retail Value"];
    const rows = filtered.map((p) => [
      p.name,
      p.sku ?? "",
      p.categories?.name ?? "",
      p.locations?.name ?? "",
      p.stock_quantity.toString(),
      p.low_stock_threshold.toString(),
      p.cost_price.toFixed(2),
      p.selling_price.toFixed(2),
      (p.cost_price * p.stock_quantity).toFixed(2),
      (p.selling_price * p.stock_quantity).toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filterLabel = selectedFilter === "all" ? null
    : selectedFilter === "active" ? null
    : selectedFilter === "inactive" ? null
    : selectedFilter === "out-of-stock" ? null
    : selectedFilter === "low-stock" ? "Low stock items"
    : selectedFilter.startsWith("loc-")
    ? locations.find((l) => l.id === selectedFilter.slice(4))?.name ?? "Location"
    : categories.find((c) => c.id === selectedFilter)?.name ?? "Category";

  return (
    <div className="flex-1 p-3 sm:p-5 space-y-4">
      {filterLabel && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-full font-semibold border border-green-100">
            Showing: {filterLabel} · {filtered.length} {isService ? "service" : "product"}{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
      {isService ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-green-400" />
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-sm shadow-green-200 flex-shrink-0">
                <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide leading-tight">Total Services</p>
            </div>
            <p className="font-numeric text-sm sm:text-xl font-bold text-[#0F172A]">{products.length}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">in your catalog</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-200 flex-shrink-0">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide leading-tight">Avg. Charge</p>
            </div>
            <p className="font-numeric text-sm sm:text-xl font-bold text-emerald-600">
              {products.length > 0 ? fmt(products.reduce((s, p) => s + p.selling_price, 0) / products.length) : "—"}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">per service</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-sm overflow-hidden relative col-span-2 sm:col-span-1">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-400" />
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-violet-500 to-violet-700 rounded-lg flex items-center justify-center shadow-sm shadow-violet-200 flex-shrink-0">
                <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide leading-tight">Top Charge</p>
            </div>
            <p className="font-numeric text-sm sm:text-xl font-bold text-violet-600">
              {products.length > 0 ? fmt(Math.max(...products.map((p) => p.selling_price))) : "—"}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">highest priced service</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-500 to-slate-400" />
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-slate-500 to-slate-700 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide leading-tight">Stock Value</p>
            </div>
            <p className="font-numeric text-sm sm:text-xl font-bold text-[#0F172A]">{fmt(stockValue)}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">at cost price</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-200 flex-shrink-0">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide leading-tight">Retail Value</p>
            </div>
            <p className="font-numeric text-sm sm:text-xl font-bold text-emerald-600">{fmt(retailValue)}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">at selling price</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-sm overflow-hidden relative col-span-2 sm:col-span-1">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-400" />
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-violet-500 to-violet-700 rounded-lg flex items-center justify-center shadow-sm shadow-violet-200 flex-shrink-0">
                <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide leading-tight">Profit Potential</p>
            </div>
            <p className="font-numeric text-sm sm:text-xl font-bold text-violet-600">{fmt(profitPotential)}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">if all stock sold</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isService ? "Search services..." : "Search products or SKU..."}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>
      </div>

      {/* Mobile status filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 sm:hidden">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedFilter(tab.value)}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors",
              selectedFilter === tab.value
                ? "bg-[#1a9c38] text-white"
                : "bg-white border border-slate-200 text-slate-600 active:bg-slate-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop filters */}
      <div className="hidden sm:flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">{isService ? "All services" : "All products"}</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            {!isService && <option value="out-of-stock">Out of Stock</option>}
            {!isService && <option value="low-stock">⚠️ Low stock</option>}
            {categories.length > 0 && (
              <optgroup label="Categories">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            )}
            {locations.length > 0 && (
              <optgroup label="Locations">
                {locations.map((l) => (
                  <option key={l.id} value={`loc-${l.id}`}>{l.name}</option>
                ))}
              </optgroup>
            )}
          </select>

          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 bg-white"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition bg-white"
          >
            <Download className="w-4 h-4 rotate-180" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <button
            onClick={() => { setIgStartConnected(false); setShowInstagram(true); }}
            className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition bg-white"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="url(#ig-gradient)" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="hidden sm:inline">Instagram</span>
          </button>
          <button
            onClick={() => { setEditingProduct(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm shadow-green-300/40"
          >
            <Plus className="w-4 h-4" />
            {isService ? "Add Service" : "Add Product"}
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm text-sm flex-wrap">
        <span className="text-slate-500">
          <span className="font-semibold text-[#0F172A]">{products.length}</span> total {isService ? "services" : "products"}
        </span>
        {!isService && (
          <>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              <span className="font-semibold text-amber-600">
                {products.filter((p) => getQty(p) <= p.low_stock_threshold && getQty(p) > 0).length}
              </span>{" "}
              low stock
            </span>
          </>
        )}
        {locations.length > 0 && (
          <>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              <span className="font-semibold text-[#0F172A]">{locations.length}</span> location{locations.length !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>

      {/* Product list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-14 h-14 text-slate-200 mb-4" />
          <p className="text-slate-600 font-medium">
            {search
              ? `No ${isService ? "services" : "products"} match your search`
              : `No ${isService ? "services" : "products"} yet`}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {search
              ? "Try a different keyword"
              : `Add your first ${isService ? "service" : "product"} to get started`}
          </p>
          {!search && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              {isService ? "Add your first service" : "Add your first product"}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 bg-slate-50 border-b border-slate-100">
            <div className="w-10 sm:w-12 flex-shrink-0" />
            <div className="flex-1 text-xs font-medium text-slate-500 uppercase tracking-wide">{isService ? "Service" : "Product"}</div>
            {!isService && <div className="w-[76px] sm:w-36 flex-shrink-0 text-xs font-medium text-slate-500 uppercase tracking-wide">Stock</div>}
            <div className="w-28 text-right flex-shrink-0 hidden md:block text-xs font-medium text-slate-500 uppercase tracking-wide">{isService ? "Charge" : "Price"}</div>
            <div className="w-16 flex-shrink-0" />
          </div>
          <div className="divide-y divide-slate-50">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
                onEdit={() => { setEditingProduct(product); setShowForm(true); }}
                onStockChange={handleStockChange}
                hideStock={isService}
                isService={isService}
              />
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <ProductForm
          businessId={businessId}
          categories={categories}
          locations={locations}
          editingProduct={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          businessType={businessType}
        />
      )}

      {showImport && (
        <BulkImportModal
          businessId={businessId}
          categories={categories}
          onClose={() => setShowImport(false)}
        />
      )}

      {showInstagram && (
        <ImportInstagramModal
          slug={slug}
          businessId={businessId}
          onClose={() => { setShowInstagram(false); setIgStartConnected(false); }}
          startConnected={igStartConnected}
        />
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => { setEditingProduct(null); setShowForm(true); }}
        className="sm:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] right-4 w-14 h-14 rounded-full bg-[#1a9c38] text-white flex items-center justify-center shadow-lg shadow-green-900/30 z-30 active:scale-95 transition-transform"
        aria-label={isService ? "Add service" : "Add product"}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
