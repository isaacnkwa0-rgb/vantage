"use client";

import { useState, useRef } from "react";
import { X, Printer, Share2, CheckCircle2, MessageCircle, Eye } from "lucide-react";
import { generateReceiptHTML } from "@/lib/utils/receipt";
import { formatCurrency } from "@/lib/utils/currency";

interface Props {
  sale: {
    id: string;
    sale_number: string;
    total_amount: number;
    amount_paid: number;
    change_amount: number;
    payment_method: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    created_at: string;
    customer_name?: string | null;
    customer_phone?: string | null;
    items: Array<{
      product_name: string;
      variant_name?: string | null;
      quantity: number;
      unit_price: number;
      line_total: number;
    }>;
  };
  business: {
    name: string;
    currency: string;
    phone: string | null;
    address: string | null;
    logo_url?: string | null;
    receipt_footer?: string | null;
    receipt_tagline?: string | null;
    receipt_show_logo?: boolean | null;
    social_instagram?: string | null;
    social_twitter?: string | null;
    social_whatsapp?: string | null;
  };
  onClose: () => void;
}

export function ReceiptModal({ sale, business, onClose }: Props) {
  const printIframeRef = useRef<HTMLIFrameElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fmt = (n: number) => formatCurrency(n, business.currency);

  const receiptHtml = generateReceiptHTML(
    { ...sale, customer_name: sale.customer_name ?? null },
    business
  );

  function handlePrint() {
    const iframe = printIframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(receiptHtml);
    doc.close();
    iframe.onload = () => iframe.contentWindow?.print();
  }

  function handlePreviewPrint() {
    previewIframeRef.current?.contentWindow?.print();
  }

  async function handleShare() {
    const text = buildReceiptText();
    if (navigator.share) {
      await navigator.share({ title: `Receipt ${sale.sale_number}`, text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Receipt copied to clipboard!");
    }
  }

  function buildReceiptText() {
    const lines = [
      `🧾 Receipt - ${sale.sale_number}`,
      business.name,
      ``,
      ...sale.items.map(
        (i) =>
          `${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ""} x${i.quantity}  ${fmt(i.line_total)}`
      ),
      `---`,
    ];
    if (sale.discount_amount > 0) lines.push(`Discount: -${fmt(sale.discount_amount)}`);
    lines.push(`Total: ${fmt(sale.total_amount)}`);
    lines.push(`Payment: ${sale.payment_method}`);
    lines.push(``);
    lines.push(`Thank you! 🙏`);
    return lines.join("\n");
  }

  function handleWhatsApp() {
    const text = buildReceiptText();
    const encoded = encodeURIComponent(text);
    const phone = sale.customer_phone?.replace(/\D/g, "") ?? "";
    const url = phone
      ? `https://wa.me/${phone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {/* ── Receipt summary modal ── */}
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-[#0F172A]">Sale Complete</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Success */}
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mb-2" />
              <p className="font-bold text-[#0F172A] text-lg">{fmt(sale.total_amount)}</p>
              <p className="text-slate-400 text-sm">{sale.sale_number}</p>
              {sale.customer_name && (
                <p className="text-slate-500 text-sm mt-1">For {sale.customer_name}</p>
              )}
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
              {sale.items.map((item, i) => (
                <div key={i} className="flex justify-between text-slate-600">
                  <span>{item.product_name} × {item.quantity}</span>
                  <span className="font-numeric">{fmt(item.line_total)}</span>
                </div>
              ))}
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 border-t border-slate-200 pt-1.5 mt-1.5">
                  <span>Discount</span>
                  <span className="font-numeric">-{fmt(sale.discount_amount)}</span>
                </div>
              )}
              {sale.tax_amount > 0 && (
                <div className="flex justify-between text-amber-600 border-t border-slate-200 pt-1.5 mt-1.5">
                  <span>Tax</span>
                  <span className="font-numeric">+{fmt(sale.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#0F172A] border-t border-slate-200 pt-1.5 mt-1.5">
                <span>Total</span>
                <span className="font-numeric">{fmt(sale.total_amount)}</span>
              </div>
              {sale.change_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Change</span>
                  <span className="font-numeric">{fmt(sale.change_amount)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-2.5 rounded-xl text-sm font-medium transition"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium transition"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center justify-center gap-1.5 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 py-2.5 rounded-xl text-sm font-medium transition"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium transition"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition"
            >
              New Sale
            </button>
          </div>
        </div>
      </div>

      {/* ── Full-screen receipt preview ── */}
      {showPreview && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-100">
          {/* Preview toolbar */}
          <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
            <div>
              <p className="font-bold text-[#0F172A] text-sm">Receipt Preview</p>
              <p className="text-xs text-slate-400">{sale.sale_number}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviewPrint}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => setShowPreview(false)}
                aria-label="Close preview"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable A4 canvas */}
          <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center">
            <iframe
              ref={previewIframeRef}
              srcDoc={receiptHtml}
              title="Receipt Preview"
              className="bg-white shadow-2xl rounded-sm"
              style={{
                width: 794,
                minHeight: 1123,
                border: "none",
                maxWidth: "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* Hidden print iframe */}
      <iframe ref={printIframeRef} className="hidden" title="receipt-print" />
    </>
  );
}
