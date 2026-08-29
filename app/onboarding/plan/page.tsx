"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const BILLING_PERIODS = [
  { key: "monthly", label: "Monthly", discount: null },
  { key: "quarterly", label: "Quarterly", discount: "10% off" },
  { key: "yearly", label: "Yearly", discount: "33% off" },
] as const;

type BillingKey = typeof BILLING_PERIODS[number]["key"];

const PLANS = [
  {
    key: "trial",
    label: "Free Trial",
    tagline: "Try everything free for 14 days",
    badge: null,
    price: { monthly: 0, quarterly: 0, yearly: 0 },
    features: [
      "All Pro features included",
      "No credit card required",
      "Unlimited products",
      "3 staff accounts",
      "POS & Sales recording",
      "Custom invoices & receipts",
      "Advanced reports & analytics",
      "Online store link",
    ],
  },
  {
    key: "starter",
    label: "Starter",
    tagline: "For individuals just getting started",
    badge: null,
    price: { monthly: 1500, quarterly: 4000, yearly: 12000 },
    features: [
      "Unlimited products",
      "1 staff account",
      "POS & Sales recording",
      "Customer management",
      "Basic invoicing",
      "Basic reports",
    ],
  },
  {
    key: "pro",
    label: "Pro",
    tagline: "For solopreneurs growing their business",
    badge: "Recommended",
    price: { monthly: 3500, quarterly: 9000, yearly: 28000 },
    features: [
      "Everything in Starter",
      "3 staff accounts",
      "Advanced reports & analytics",
      "Custom invoices & receipts",
      "Expense tracking",
      "Loyalty program",
      "Online store link",
    ],
  },
  {
    key: "growth",
    label: "Growth",
    tagline: "For businesses ready to scale",
    badge: null,
    price: { monthly: 7000, quarterly: 18000, yearly: 55000 },
    features: [
      "Everything in Pro",
      "10 staff accounts",
      "Multi-location support",
      "Priority support",
      "Custom domain",
      "API access",
    ],
  },
];

function fmt(n: number) {
  return n === 0 ? "Free" : `₦${n.toLocaleString()}`;
}

function PlanPage() {
  const router = useRouter();
  const params = useSearchParams();
  const slug = params.get("slug") ?? "";

  const [billing, setBilling] = useState<BillingKey>("monthly");
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [isLoading, setIsLoading] = useState(false);

  const plan = PLANS.find((p) => p.key === selectedPlan)!;

  function handleSelect() {
    setIsLoading(true);
    router.push(`/onboarding/success?slug=${slug}`);
  }

  function handleFreeTrial() {
    setIsLoading(true);
    router.push(`/onboarding/success?slug=${slug}`);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[13px] font-medium text-[#1a9c38] bg-slate-100 px-3 py-1.5 rounded-full w-fit"
        >
          <ChevronLeft className="w-[13px] h-[13px]" /> Back
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto px-5 pb-36">

        {/* Title */}
        <div className="text-center mb-6 mt-2">
          <h1 className="text-[22px] font-bold text-slate-900 leading-tight">
            Choose your Plan
          </h1>
          <p className="text-slate-500 text-[14px] mt-1.5 leading-relaxed">
            Join thousands of businesses managing smarter with Vantage. Start free, upgrade anytime.
          </p>
        </div>

        {/* Billing period segmented control */}
        <div
          className="flex rounded-[4px] p-1 mb-5"
          style={{ backgroundColor: "#ecf7f1" }}
        >
          {BILLING_PERIODS.map((b) => (
            <button
              key={b.key}
              onClick={() => setBilling(b.key)}
              className={cn(
                "flex-1 h-9 rounded-[4px] text-[13px] font-semibold transition",
                billing === b.key
                  ? "bg-white text-[#1a9c38] shadow-sm"
                  : "text-slate-600"
              )}
            >
              {b.label}
              {b.discount && billing !== b.key && (
                <span className="block text-[10px] font-normal text-slate-400 leading-none">
                  {b.discount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Plan radio pills */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-4">
          {PLANS.filter((p) => p.key !== "trial").map((p) => (
            <button
              key={p.key}
              onClick={() => setSelectedPlan(p.key)}
              style={selectedPlan === p.key ? { backgroundColor: "#ecf7f1" } : undefined}
              className={cn(
                "px-4 h-8 rounded-[8px] border text-[14px] font-medium whitespace-nowrap flex-shrink-0 transition",
                selectedPlan === p.key
                  ? "border-[#1a9c38] text-slate-900"
                  : "bg-[#F3F4F6] border-transparent text-slate-700"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Plan detail card */}
        <div className="border border-slate-200 rounded-xl p-5">
          {/* Plan name + badge */}
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-[17px] font-bold text-slate-900">{plan.label}</h2>
            {plan.badge && (
              <span className="bg-[#1a9c38] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {plan.badge}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-[13px] mb-4">{plan.tagline}</p>

          {/* Price */}
          {plan.price[billing] === 0 ? (
            <div className="mb-1">
              <span className="text-[28px] font-bold text-slate-900">Free</span>
              <span className="text-slate-400 text-[13px] ml-1">for 14 days</span>
            </div>
          ) : (
            <div className="mb-1">
              {billing !== "monthly" && (
                <p className="text-slate-400 text-[13px] line-through mb-0.5">
                  {fmt(plan.price.monthly * (billing === "quarterly" ? 3 : 12))}
                </p>
              )}
              <div className="flex items-end gap-1">
                <span className="text-[28px] font-bold text-slate-900">
                  {fmt(plan.price[billing])}
                </span>
                <span className="text-slate-400 text-[13px] mb-1">
                  /{billing === "monthly" ? "month" : billing === "quarterly" ? "quarter" : "year"}
                </span>
              </div>
              {billing !== "monthly" && (
                <p className="text-[#1a9c38] text-[12px] font-semibold mt-0.5">
                  Save {BILLING_PERIODS.find((b) => b.key === billing)?.discount}
                </p>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-slate-100 my-4" />

          {/* Features */}
          <ul className="space-y-3">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#1a9c38] flex-shrink-0" />
                <span className="text-[13px] text-slate-700">{f}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-5 py-4 border-t border-slate-100 space-y-2">
        {/* Free trial secondary */}
        {/* Select Plan primary */}
        <button
          onClick={handleSelect}
          disabled={isLoading}
          className="w-full h-11 bg-[#1a9c38] hover:bg-green-700 text-white font-bold rounded-[4px] text-[15px] transition disabled:opacity-60"
        >
          Select Plan
        </button>

        <button
          onClick={handleFreeTrial}
          className="w-full h-11 border border-[#1a9c38] rounded-[4px] text-[15px] text-[#1a9c38] font-semibold flex items-center justify-center"
        >
          Start free trial for 14 days
        </button>
      </div>
    </div>
  );
}

export default function PlanPageWrapper() {
  return (
    <Suspense>
      <PlanPage />
    </Suspense>
  );
}
