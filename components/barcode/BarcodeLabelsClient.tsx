"use client";

import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { Printer, Search, CheckSquare, Square, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import JsBarcode from "jsbarcode";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  selling_price: number;
}

interface Props {
  products: Product[];
  currency: string;
}

const LABEL_SIZES = [
  { key: "small", label: "Small (50×25mm)", w: 189, h: 94 },
  { key: "medium", label: "Medium (70×35mm)", w: 264, h: 132 },
  { key: "large", label: "Large (100×50mm)", w: 378, h: 189 },
] as const;

type LabelSize = typeof LABEL_SIZES[number]["key"];

export function BarcodeLabelsClient({ products, currency }: Props) {
  const fmt = (n: number) => formatCurrency(n, currency);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [qty, setQty] = useState<Record<string, number>>({});
  const [size, setSize] = useState<LabelSize>("medium");
  const [showPrice, setShowPrice] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { next.add(id); if (!qty[id]) setQty((q) => ({ ...q, [id]: 1 })); }
      return next;
    });
  }

  function selectAll() {
    const allWithBarcode = filtered.filter((p) => p.barcode);
    if (allWithBarcode.every((p) => selected.has(p.id))) {
      setSelected((prev) => { const next = new Set(prev); allWithBarcode.forEach((p) => next.delete(p.id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); allWithBarcode.forEach((p) => { next.add(p.id); if (!qty[p.id]) setQty((q) => ({ ...q, [p.id]: 1 })); }); return next; });
    }
  }

  const dim = LABEL_SIZES.find((s) => s.key === size)!;
  const selectedProducts = products.filter((p) => selected.has(p.id) && p.barcode);

  function printLabels() {
    if (selectedProducts.length === 0) return;

    const win = window.open("", "_blank");
    if (!win) return;

    const labelsHtml = selectedProducts.flatMap((p) => {
      const count = qty[p.id] ?? 1;
      const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      try {
        JsBarcode(svgEl, p.barcode!, { format: "CODE128", width: 1.5, height: 40, displayValue: true, fontSize: 10, margin: 4 });
      } catch {}
      const svgStr = svgEl.outerHTML;
      return Array.from({ length: count }, () =>
        `<div class="label" style="width:${dim.w}px;height:${dim.h}px;">
          <p class="name">${p.name}</p>
          ${showSku && p.sku ? `<p class="sku">SKU: ${p.sku}</p>` : ""}
          <div class="barcode">${svgStr}</div>
          ${showPrice ? `<p class="price">${fmt(p.selling_price)}</p>` : ""}
        </div>`
      );
    }).join("");

    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Barcode Labels</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: white; }
        .grid { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; }
        .label { border: 1px solid #ccc; padding: 4px 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; page-break-inside: avoid; }
        .name { font-size: 9px; font-weight: bold; text-align: center; line-height: 1.2; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sku { font-size: 7px; color: #666; text-align: center; }
        .barcode svg { max-width: 100%; }
        .price { font-size: 10px; font-weight: bold; text-align: center; }
        @media print { body { margin: 0; } .grid { gap: 4px; padding: 4px; } }
      </style>
    </head><body><div class="grid">${labelsHtml}</div></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  }

  const allFiltered = filtered.filter((p) => p.barcode);
  const allSelected = allFiltered.length > 0 && allFiltered.every((p) => selected.has(p.id));

  return (
    <div className="flex-1 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Barcode Label Printing</h2>
          <p className="text-xs text-slate-400 mt-0.5">Select products and print labels for shelves or packaging</p>
        </div>
        <button
          onClick={printLabels}
          disabled={selectedProducts.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm disabled:opacity-40"
        >
          <Printer className="w-4 h-4" /> Print Labels ({selectedProducts.length})
        </button>
      </div>

      {/* Options bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Label Size</label>
          <select value={size} onChange={(e) => setSize(e.target.value as LabelSize)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            {LABEL_SIZES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="rounded" />
          Show Price
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={showSku} onChange={(e) => setShowSku(e.target.checked)} className="rounded" />
          Show SKU
        </label>
      </div>

      {/* Search + list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU or barcode..."
            className="flex-1 text-sm focus:outline-none"
          />
          <button onClick={selectAll} className="text-xs text-green-600 hover:text-green-700 font-medium transition flex-shrink-0">
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        </div>

        {products.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3 text-center">
            <Tag className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-semibold text-[#0F172A]">No products yet</p>
            <p className="text-xs text-slate-400">Add products with barcodes to print labels</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((p) => {
              const isSelected = selected.has(p.id);
              const hasBarcode = !!p.barcode;
              return (
                <div
                  key={p.id}
                  onClick={() => hasBarcode && toggleSelect(p.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition",
                    hasBarcode ? "cursor-pointer hover:bg-slate-50" : "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSelected
                    ? <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
                    : <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{p.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {p.sku && <span className="text-xs text-slate-400">SKU: {p.sku}</span>}
                      {p.barcode
                        ? <span className="text-xs text-slate-400 font-mono">{p.barcode}</span>
                        : <span className="text-xs text-red-400">No barcode</span>}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#0F172A] font-numeric flex-shrink-0">{fmt(p.selling_price)}</span>
                  {isSelected && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-500">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={qty[p.id] ?? 1}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); setQty((q) => ({ ...q, [p.id]: parseInt(e.target.value) || 1 })); }}
                        className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hidden print container (unused — we use popup window) */}
      <div ref={printRef} className="hidden" />
    </div>
  );
}
