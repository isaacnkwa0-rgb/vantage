"use client";

import { useState, useRef } from "react";
import { X, Upload, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

interface Props {
  businessId: string;
  categories: Category[];
  onClose: () => void;
}

interface ParsedRow {
  name: string;
  selling_price: string;
  cost_price: string;
  stock_quantity: string;
  sku: string;
  category: string;
  errors: string[];
}

const TEMPLATE_HEADERS = ["name", "selling_price", "cost_price", "stock_quantity", "sku", "category"];
const TEMPLATE_EXAMPLE = ["Example Product", "25.00", "15.00", "100", "SKU001", "Electronics"];

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vantage-product-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function validateRow(row: Record<string, string>): ParsedRow {
  const errors: string[] = [];
  const name = (row["name"] ?? "").trim();
  const selling_price = (row["selling_price"] ?? "").trim();
  const cost_price = (row["cost_price"] ?? "").trim();
  const stock_quantity = (row["stock_quantity"] ?? "").trim();

  if (!name) errors.push("Name is required");
  if (!selling_price || isNaN(Number(selling_price)) || Number(selling_price) < 0) errors.push("Invalid selling price");
  if (cost_price && (isNaN(Number(cost_price)) || Number(cost_price) < 0)) errors.push("Invalid cost price");
  if (stock_quantity && (isNaN(Number(stock_quantity)) || !Number.isInteger(Number(stock_quantity)))) errors.push("Stock must be a whole number");

  return {
    name,
    selling_price,
    cost_price: cost_price || "0",
    stock_quantity: stock_quantity || "0",
    sku: (row["sku"] ?? "").trim(),
    category: (row["category"] ?? "").trim(),
    errors,
  };
}

export function BulkImportModal({ businessId, categories, onClose }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidCount = rows.length - validRows.length;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsed = result.data.map(validateRow);
        setRows(parsed);
        setStep("preview");
      },
    });
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    const supabase = createClient();

    const categoryMap = new Map(
      categories.map((c) => [c.name.toLowerCase(), c.id])
    );

    const payload = validRows.map((r) => ({
      business_id: businessId,
      name: r.name,
      selling_price: parseFloat(r.selling_price),
      cost_price: parseFloat(r.cost_price),
      stock_quantity: parseInt(r.stock_quantity, 10),
      sku: r.sku || null,
      category_id: categoryMap.get(r.category.toLowerCase()) ?? null,
      is_active: true,
      track_inventory: true,
      low_stock_threshold: 5,
    }));

    const { data } = await supabase.from("products").insert(payload).select("id");
    setImportedCount(data?.length ?? 0);
    setImporting(false);
    setStep("done");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-[#0F172A]">Import Products from CSV</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {step === "upload" && "Upload a CSV file to add products in bulk"}
              {step === "preview" && `${rows.length} rows found · ${validRows.length} valid · ${invalidCount} with errors`}
              {step === "done" && `Import complete`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload step */}
        {step === "upload" && (
          <div className="p-6 space-y-4">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm text-green-600 hover:underline font-medium"
            >
              <Download className="w-4 h-4" />
              Download CSV template
            </button>

            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Click to upload your CSV file</p>
              <p className="text-slate-400 text-sm mt-1">Columns: name, selling_price, cost_price, stock_quantity, sku, category</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>
          </div>
        )}

        {/* Preview step */}
        {step === "preview" && (
          <>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">Sell Price</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">Cost</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">Stock</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">SKU</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((row, i) => (
                    <tr key={i} className={row.errors.length > 0 ? "bg-red-50" : ""}>
                      <td className="px-3 py-2">
                        {row.errors.length === 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <div title={row.errors.join(", ")}>
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium text-[#0F172A]">{row.name || <span className="text-red-400 italic">missing</span>}</td>
                      <td className="px-3 py-2 font-numeric">{row.selling_price}</td>
                      <td className="px-3 py-2 font-numeric">{row.cost_price}</td>
                      <td className="px-3 py-2 font-numeric">{row.stock_quantity}</td>
                      <td className="px-3 py-2 text-slate-500">{row.sku}</td>
                      <td className="px-3 py-2 text-slate-500">{row.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                onClick={() => { setRows([]); setStep("upload"); if (fileRef.current) fileRef.current.value = ""; }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                ← Upload different file
              </button>
              <button
                onClick={handleImport}
                disabled={validRows.length === 0 || importing}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 shadow-sm shadow-green-300/40"
              >
                {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                {importing ? "Importing..." : `Import ${validRows.length} product${validRows.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </>
        )}

        {/* Done step */}
        {step === "done" && (
          <div className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <div>
              <p className="text-lg font-bold text-[#0F172A]">{importedCount} products imported!</p>
              {invalidCount > 0 && (
                <p className="text-sm text-slate-400 mt-1">{invalidCount} rows were skipped due to errors</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
