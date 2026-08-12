"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Store, FileText, ShoppingCart, LogOut, Loader2, Mail, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  currency: string;
}

interface Props {
  business: Business;
}

interface PortalSession {
  customerId: string;
  businessId: string;
  customerName: string;
}

export function CustomerPortal({ business }: Props) {
  const supabase = createClient();
  const fmt = (n: number) => formatCurrency(n, business.currency);

  const [session, setSession] = useState<PortalSession | null>(null);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`portal_session_${business.slug}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.exp > Date.now()) {
          setSession(parsed);
        } else {
          localStorage.removeItem(`portal_session_${business.slug}`);
        }
      } catch {}
    }
  }, [business.slug]);

  useEffect(() => {
    if (!session) return;
    loadData();
  }, [session]);

  async function loadData() {
    if (!session) return;
    setLoadingData(true);
    const [invRes, salesRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("id, invoice_number, total_amount, amount_paid, status, due_date, created_at")
        .eq("customer_id", session.customerId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("sales")
        .select("id, sale_number, total_amount, payment_method, payment_status, created_at")
        .eq("customer_id", session.customerId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setInvoices(invRes.data ?? []);
    setSales(salesRes.data ?? []);
    setLoadingData(false);
  }

  async function requestOTP() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/portal/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, businessSlug: business.slug }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setStep("otp");
  }

  async function verifyOTP() {
    if (!otp.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/portal/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, businessSlug: business.slug }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    const sess = { customerId: data.token.split(".")[0], businessId: business.id, customerName: data.customerName, exp: Date.now() + 86400000, token: data.token };
    // Decode the token to get customerId
    try {
      const decoded = JSON.parse(atob(data.token.replace(/-/g, "+").replace(/_/g, "/")));
      const fullSess = { ...decoded, customerName: data.customerName };
      localStorage.setItem(`portal_session_${business.slug}`, JSON.stringify(fullSess));
      setSession(fullSess);
    } catch {
      setError("Session error");
    }
  }

  function logout() {
    localStorage.removeItem(`portal_session_${business.slug}`);
    setSession(null);
    setStep("email");
    setEmail("");
    setOtp("");
  }

  const STATUS_COLORS: Record<string, string> = {
    paid: "text-green-600",
    unpaid: "text-red-500",
    partial: "text-amber-600",
    overdue: "text-red-600",
    draft: "text-slate-400",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {business.logo_url
              ? <Image src={business.logo_url} alt={business.name} width={36} height={36} className="rounded-xl object-cover" />
              : <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center"><Store className="w-4 h-4 text-white" /></div>}
            <div>
              <p className="text-sm font-extrabold text-[#0F172A]">{business.name}</p>
              <p className="text-xs text-slate-400">Customer Portal</p>
            </div>
          </div>
          {session && (
            <button onClick={logout} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {!session ? (
          /* Login form */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-sm mx-auto space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-base font-bold text-[#0F172A]">Sign in to your account</h2>
              <p className="text-xs text-slate-400 mt-1">We'll send a one-time code to your email</p>
            </div>

            {step === "email" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && requestOTP()}
                    placeholder="you@email.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button
                  onClick={requestOTP}
                  disabled={loading || !email.trim()}
                  className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {loading ? "Sending..." : "Send Code"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 text-center">Code sent to <strong>{email}</strong></p>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">6-digit code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && verifyOTP()}
                    placeholder="000000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button
                  onClick={verifyOTP}
                  disabled={loading || otp.length < 6}
                  className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Verifying..." : "Sign In"}
                </button>
                <button onClick={() => setStep("email")} className="w-full text-xs text-slate-400 hover:text-slate-600 transition">
                  ← Back
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Dashboard */
          <div className="space-y-6">
            <p className="text-lg font-bold text-[#0F172A]">Welcome back, {session.customerName} 👋</p>

            {loadingData ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>
            ) : (
              <>
                {/* Invoices */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" /> Invoices
                  </h3>
                  {invoices.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">No invoices yet</p>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      {invoices.map((inv) => (
                        <div key={inv.id} className="px-4 py-3 flex items-center justify-between border-b border-slate-50 last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-[#0F172A]">{inv.invoice_number}</p>
                            <p className="text-xs text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-numeric text-sm font-bold text-[#0F172A]">{fmt(inv.total_amount)}</p>
                            <p className={cn("text-xs capitalize font-medium", STATUS_COLORS[inv.status] ?? "text-slate-400")}>{inv.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Purchase history */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-slate-400" /> Purchase History
                  </h3>
                  {sales.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">No purchases yet</p>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      {sales.map((sale) => (
                        <div key={sale.id} className="px-4 py-3 flex items-center justify-between border-b border-slate-50 last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-[#0F172A]">{sale.sale_number}</p>
                            <p className="text-xs text-slate-400 capitalize">{sale.payment_method} · {new Date(sale.created_at).toLocaleDateString()}</p>
                          </div>
                          <p className="font-numeric text-sm font-bold text-[#0F172A]">{fmt(sale.total_amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
