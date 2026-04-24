"use client";

import { useState } from "react";
import { Plus, Search, Package, TrendingUp, BarChart3, Download, Briefcase } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { ProductForm } from "./ProductForm";
import { ProductCard } from "./ProductCard";
import { BulkImportModal } from "./BulkImportModal";

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
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});

  function handleStockChange(productId: string, newQty: number) {
    setStockOverrides((prev) => ({ ...prev, [productId]: newQty }));
  }

  function getQty(p: Product) {
    return stockOverrides[p.id] !== undefined ? stockOverrides[p.id] : p.stock_quantity;
  }

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (selectedFilter === "all") return true;
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

  const filterLabel = selectedFilter === "all"
    ? null
    : selectedFilter === "low-stock"
    ? "Low stock items"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-green-400" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-sm shadow-green-200">
                <Briefcase className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Services</p>
            </div>
            <p className="font-numeric text-xl font-bold text-[#0F172A]">{products.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">in your catalog</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-200">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Avg. Charge</p>
            </div>
            <p className="font-numeric text-xl font-bold text-emerald-600 truncate">
              {products.length > 0 ? fmt(products.reduce((s, p) => s + p.selling_price, 0) / products.length) : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">per service</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-400" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-violet-700 rounded-lg flex items-center justify-center shadow-sm shadow-violet-200">
                <BarChart3 className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Top Charge</p>
            </div>
            <p className="font-numeric text-xl font-bold text-violet-600 truncate">
              {products.length > 0 ? fmt(Math.max(...products.map((p) => p.selling_price))) : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">highest priced service</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-500 to-slate-400" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-gradient-to-br from-slate-500 to-slate-700 rounded-lg flex items-center justify-center shadow-sm">
                <Package className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Stock Value</p>
            </div>
            <p className="font-numeric text-xl font-bold text-[#0F172A] truncate">{fmt(stockValue)}</p>
            <p className="text-xs text-slate-400 mt-0.5">at cost price</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-200">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Retail Value</p>
            </div>
            <p className="font-numeric text-xl font-bold text-emerald-600 truncate">{fmt(retailValue)}</p>
            <p className="text-xs text-slate-400 mt-0.5">at selling price</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-400" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-violet-700 rounded-lg flex items-center justify-center shadow-sm shadow-violet-200">
                <BarChart3 className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Profit Potential</p>
            </div>
            <p className="font-numeric text-xl font-bold text-violet-600 truncate">{fmt(profitPotential)}</p>
            <p className="text-xs text-slate-400 mt-0.5">if all stock sold</p>
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isService ? "Search services..." : "Search products or SKU..."}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">{isService ? "All services" : "All products"}</option>
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
          <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 border-b border-slate-100">
            <div className="w-12 flex-shrink-0" />
            <div className="flex-1 text-xs font-medium text-slate-500 uppercase tracking-wide">{isService ? "Service" : "Product"}</div>
            {!isService && <div className="w-36 flex-shrink-0 hidden sm:block text-xs font-medium text-slate-500 uppercase tracking-wide">Stock</div>}
            <div className="w-28 text-right flex-shrink-0 hidden md:block text-xs font-medium text-slate-500 uppercase tracking-wide">{isService ? "Charge" : "Price"}</div>
            <div className="w-8 flex-shrink-0" />
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
    </div>
  );
}
