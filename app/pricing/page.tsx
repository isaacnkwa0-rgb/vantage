"use client";

import { useState } from "react";
import { Check, X, Zap, Star, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FEATURES = [
  { label: "Products / Services", free: "Up to 50", starter: "Unlimited", pro: "Unlimited" },
  { label: "Staff accounts", free: "1 (owner)", starter: "Up to 3", pro: "Unlimited" },
  { label: "Locations / Branches", free: "1", starter: "1", pro: "Unlimited" },
  { label: "Point of Sale (POS)", free: true, starter: true, pro: true },
  { label: "Sales & Transactions", free: true, starter: true, pro: true },
  { label: "Customer management", free: true, starter: true, pro: true },
  { label: "Invoicing", free: "5 / month", starter: "Unlimited", pro: "Unlimited" },
  { label: "Expenses tracking", free: false, starter: true, pro: true },
  { label: "Loyalty program", free: false, starter: true, pro: true },
  { label: "Barcode scanning", free: false, starter: true, pro: true },
  { label: "Offline mode", free: false, starter: true, pro: true },
  { label: "Full reports", free: false, starter: true, pro: true },
  { label: "Advanced analytics", free: false, starter: false, pro: true },
  { label: "Multi-location reports", free: false, starter: false, pro: true },
  { label: "Priority support", free: false, starter: false, pro: true },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-4 h-4 text-emerald-500 mx-auto" />;
  if (value === false) return <X className="w-4 h-4 text-slate-300 mx-auto" />;
  return <span className="text-xs font-medium text-slate-600">{value}</span>;
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      key: "free",
      label: "Free",
      icon: Zap,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-500",
      price: { monthly: 0, annual: 0 },
      priceNGN: { monthly: 0, annual: 0 },
      description: "For individuals just getting started",
      cta: "Get started free",
      ctaHref: "/register",
      ctaStyle: "border border-slate-200 text-slate-700 hover:bg-slate-50",
      highlight: false,
    },
    {
      key: "starter",
      label: "Starter",
      icon: Zap,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      price: { monthly: 12, annual: 99 },
      priceNGN: { monthly: 6000, annual: 50000 },
      description: "For growing businesses ready to scale",
      cta: "Start Starter",
      ctaHref: "/register?plan=starter",
      ctaStyle: "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200",
      highlight: true,
      badge: "Most Popular",
    },
    {
      key: "pro",
      label: "Pro",
      icon: Star,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      price: { monthly: 29, annual: 249 },
      priceNGN: { monthly: 15000, annual: 120000 },
      description: "For multi-location businesses at full scale",
      cta: "Start Pro",
      ctaHref: "/register?plan=pro",
      ctaStyle: "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200",
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Nav */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-md shadow-green-200">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-green-700">VANTAGE</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            Sign in
          </Link>
          <Link href="/register" className="text-sm font-semibold bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">
            Get started free
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Simple pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] leading-tight">
            Plans for every stage
            <br />
            <span className="text-green-600">of your business</span>
          </h1>
          <p className="text-slate-500 text-lg mt-4 max-w-xl mx-auto">
            Start free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={cn("text-sm font-medium", !annual ? "text-[#0F172A]" : "text-slate-400")}>Monthly</span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annual ? "bg-green-600" : "bg-slate-200"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${annual ? "translate-x-6" : "translate-x-0"}`} />
            </button>
            <span className={cn("text-sm font-medium", annual ? "text-[#0F172A]" : "text-slate-400")}>
              Annual
              <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Save 30%</span>
            </span>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={cn(
                "bg-white rounded-2xl border p-6 flex flex-col relative",
                plan.highlight
                  ? "border-green-400 shadow-xl shadow-green-100 scale-[1.02]"
                  : "border-slate-200 shadow-sm"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.iconBg}`}>
                <plan.icon className={`w-5 h-5 ${plan.iconColor}`} />
              </div>

              <h3 className="text-lg font-bold text-[#0F172A]">{plan.label}</h3>
              <p className="text-slate-500 text-sm mt-1 mb-5">{plan.description}</p>

              {plan.price.monthly === 0 ? (
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-[#0F172A]">Free</span>
                  <span className="text-slate-400 text-sm ml-1">forever</span>
                </div>
              ) : (
                <div className="mb-2">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-[#0F172A]">
                      ${annual ? Math.round(plan.price.annual / 12) : plan.price.monthly}
                    </span>
                    <span className="text-slate-400 text-sm mb-1">/month</span>
                  </div>
                  {annual && (
                    <p className="text-xs text-emerald-600 font-semibold">
                      Billed ${plan.price.annual}/year
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">
                    ≈ ₦{(annual ? plan.priceNGN.annual / 12 : plan.priceNGN.monthly).toLocaleString()}/month via Paystack
                  </p>
                </div>
              )}

              <Link
                href={plan.ctaHref}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition mb-6",
                  plan.ctaStyle
                )}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>

              <ul className="space-y-2.5 flex-1">
                {FEATURES.slice(0, 8).map((f) => {
                  const val = f[plan.key as "free" | "starter" | "pro"];
                  return (
                    <li key={f.label} className="flex items-center gap-2 text-sm">
                      {val === true && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      {val === false && <X className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                      {typeof val === "string" && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      <span className={val === false ? "text-slate-400" : "text-slate-700"}>
                        {f.label}
                        {typeof val === "string" && val !== "Unlimited" && (
                          <span className="text-slate-400"> ({val})</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Full feature table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-bold text-[#0F172A] text-lg">Full feature comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 font-semibold text-slate-500 w-1/2">Feature</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-500 w-1/6">Free</th>
                  <th className="text-center px-4 py-3 font-bold text-green-700 w-1/6 bg-green-50">Starter</th>
                  <th className="text-center px-4 py-3 font-bold text-purple-700 w-1/6">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {FEATURES.map((f) => (
                  <tr key={f.label} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 text-slate-700 font-medium">{f.label}</td>
                    <td className="px-4 py-3 text-center"><FeatureValue value={f.free} /></td>
                    <td className="px-4 py-3 text-center bg-green-50/50"><FeatureValue value={f.starter} /></td>
                    <td className="px-4 py-3 text-center"><FeatureValue value={f.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Questions?</h2>
          <p className="text-slate-500 mb-6">Everything you need to know about our pricing.</p>
          <div className="grid sm:grid-cols-2 gap-4 text-left max-w-3xl mx-auto">
            {[
              { q: "Can I switch plans?", a: "Yes — upgrade or downgrade anytime. Changes apply immediately." },
              { q: "Is there a free trial?", a: "The Free plan is free forever. No credit card needed to start." },
              { q: "What payment methods are accepted?", a: "Card, bank transfer, and USSD via Paystack. USD cards via Stripe." },
              { q: "What happens if I exceed free limits?", a: "You'll be prompted to upgrade. Existing data is never deleted." },
            ].map((item) => (
              <div key={item.q} className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="font-semibold text-[#0F172A] text-sm mb-1">{item.q}</p>
                <p className="text-slate-500 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
