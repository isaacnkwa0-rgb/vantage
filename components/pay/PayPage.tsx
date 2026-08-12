"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, Zap, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  notes: string | null;
  client_name: string | null;
  client_email: string | null;
  businesses: {
    name: string;
    currency: string;
    logo_url: string | null;
    phone: string | null;
    address: string | null;
  } | null;
}

interface Props {
  invoice: Invoice;
  items: InvoiceItem[];
  token: string;
  paymentStatus?: "success" | "failed";
}

export function PayPage({ invoice, items, token, paymentStatus }: Props) {
  const biz = invoice.businesses;
  const currency = biz?.currency ?? "NGN";
  const fmt = (n: number) => formatCurrency(n, currency);
  const amountDue = invoice.total_amount - invoice.amount_paid;
  const isPaid = invoice.status === "paid" || (paymentStatus as string) === "success";

  const [email, setEmail] = useState(invoice.client_email ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!email.trim()) { setError("Please enter your email address"); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/pay/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Payment initialization failed"); setLoading(false); return; }
      window.location.href = data.authorizationUrl;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-lg space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center shadow-md shadow-green-200">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-extrabold tracking-tight text-green-700">VANTAGE</p>
          </div>
          <p className="text-sm text-slate-500">Secure payment powered by Paystack</p>
        </div>

        {/* Success banner */}
        {isPaid && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Payment successful!</p>
              <p className="text-sm">Thank you — your payment has been recorded.</p>
            </div>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Payment failed</p>
              <p className="text-sm">Please try again or contact the business.</p>
            </div>
          </div>
        )}

        {/* Invoice card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Business header */}
          <div className="bg-[#0F172A] px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-bold text-lg">{biz?.name ?? "Business"}</p>
                {biz?.address && <p className="text-slate-400 text-sm mt-0.5">{biz.address}</p>}
                {biz?.phone && <p className="text-slate-400 text-sm">{biz.phone}</p>}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-slate-300 text-sm mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  {invoice.invoice_number}
                </div>
                <p className="text-white font-numeric text-2xl font-bold">{fmt(invoice.total_amount)}</p>
                {invoice.due_date && (
                  <p className="text-slate-400 text-xs mt-1">Due {new Date(invoice.due_date).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bill to */}
          {invoice.client_name && (
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bill to</p>
              <p className="text-sm font-medium text-[#0F172A]">{invoice.client_name}</p>
              {invoice.client_email && <p className="text-xs text-slate-400">{invoice.client_email}</p>}
            </div>
          )}

          {/* Line items */}
          <div className="px-6 py-4 space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <div>
                  <p className="text-[#0F172A]">{item.description}</p>
                  {item.quantity > 1 && <p className="text-xs text-slate-400">{item.quantity} × {fmt(item.unit_price)}</p>}
                </div>
                <span className="font-numeric font-medium text-[#0F172A] ml-4">{fmt(item.line_total)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="px-6 py-4 border-t border-slate-100 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span><span className="font-numeric">{fmt(invoice.subtotal)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Discount</span><span className="font-numeric">-{fmt(invoice.discount_amount)}</span>
              </div>
            )}
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between text-sm text-slate-500">
                <span>Tax</span><span className="font-numeric">{fmt(invoice.tax_amount)}</span>
              </div>
            )}
            {invoice.amount_paid > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Already paid</span><span className="font-numeric">-{fmt(invoice.amount_paid)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[#0F172A] text-base pt-2 border-t border-slate-100">
              <span>Amount Due</span>
              <span className="font-numeric text-green-700">{fmt(amountDue)}</span>
            </div>
          </div>

          {/* Pay form */}
          {!isPaid && amountDue > 0 && (
            <div className="px-6 pb-6 pt-2 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Your email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-green-300/40"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? "Redirecting to Paystack..." : `Pay ${fmt(amountDue)}`}
              </button>
              <p className="text-xs text-center text-slate-400">
                Secured by Paystack · Your payment info is never stored by VANTAGE
              </p>
            </div>
          )}

          {isPaid && (
            <div className="px-6 pb-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-[#0F172A]">All paid up!</p>
              <p className="text-sm text-slate-400 mt-1">This invoice has been fully settled.</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          Powered by <span className="font-semibold text-green-700">VANTAGE</span>
        </p>
      </div>
    </div>
  );
}
