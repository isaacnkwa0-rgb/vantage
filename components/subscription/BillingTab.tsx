"use client";

import { useState } from "react";
import { Check, Zap, Star, Loader2, ExternalLink } from "lucide-react";
import { PLAN_PRICING, PLAN_LIMITS, type PlanTier } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface Props {
  business: { id: string; name: string; subscription_tier: string };
  userEmail: string;
}

const PLAN_META = {
  free:    { label: "Free",    icon: Zap,  color: "slate",  iconBg: "bg-slate-100",  iconColor: "text-slate-500" },
  starter: { label: "Starter", icon: Zap,  color: "green",  iconBg: "bg-green-100",  iconColor: "text-green-600" },
  pro:     { label: "Pro",     icon: Star, color: "purple", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
};

export function BillingTab({ business, userEmail }: Props) {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const currentTier = (business.subscription_tier ?? "free") as PlanTier;
  const currentMeta = PLAN_META[currentTier] ?? PLAN_META.free;

  async function handleUpgrade(plan: "starter" | "pro") {
    setLoading(plan);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billing: annual ? "annual" : "monthly", businessId: business.id, email: userEmail }),
      });
      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        alert(data.error ?? "Failed to start checkout");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setLoading(null);
  }

  const plans: Array<{
    key: "starter" | "pro";
    label: string;
    monthlyUSD: number;
    annualUSD: number;
    monthlyNGN: number;
    annualNGN: number;
    features: string[];
    color: string;
  }> = [
    {
      key: "starter",
      label: "Starter",
      monthlyUSD: PLAN_PRICING.starter.monthly,
      annualUSD: PLAN_PRICING.starter.annual,
      monthlyNGN: PLAN_PRICING.starter.monthlyNGN,
      annualNGN: PLAN_PRICING.starter.annualNGN,
      features: ["Unlimited products", "3 staff accounts", "Loyalty program", "Barcode scanning", "Offline mode", "Unlimited invoicing", "Full reports"],
      color: "green",
    },
    {
      key: "pro",
      label: "Pro",
      monthlyUSD: PLAN_PRICING.pro.monthly,
      annualUSD: PLAN_PRICING.pro.annual,
      monthlyNGN: PLAN_PRICING.pro.monthlyNGN,
      annualNGN: PLAN_PRICING.pro.annualNGN,
      features: ["Everything in Starter", "Unlimited staff", "Unlimited locations", "Advanced analytics", "Multi-location reports", "Priority support"],
      color: "purple",
    },
  ];

  return (
    <div className="max-w-2xl space-y-5">
      {/* Current plan */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-[#0F172A] mb-4">Current Plan</h3>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentMeta.iconBg}`}>
            <currentMeta.icon className={`w-5 h-5 ${currentMeta.iconColor}`} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#0F172A]">{currentMeta.label} Plan</p>
            <p className="text-sm text-slate-500">
              {currentTier === "free"
                ? "Free forever — upgrade to unlock more features"
                : "Active subscription"}
            </p>
          </div>
          <span className={cn(
            "text-xs font-bold px-3 py-1 rounded-full",
            currentTier === "free" ? "bg-slate-100 text-slate-600" :
            currentTier === "starter" ? "bg-green-100 text-green-700" :
            "bg-purple-100 text-purple-700"
          )}>
            {currentMeta.label}
          </span>
        </div>
      </div>

      {/* Billing toggle */}
      {currentTier !== "pro" && (
        <>
          <div className="flex items-center gap-3">
            <span className={cn("text-sm font-medium", !annual ? "text-[#0F172A]" : "text-slate-400")}>Monthly</span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${annual ? "bg-green-600" : "bg-slate-200"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${annual ? "translate-x-5" : "translate-x-0"}`} />
            </button>
            <span className={cn("text-sm font-medium", annual ? "text-[#0F172A]" : "text-slate-400")}>
              Annual
              <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Save 30%</span>
            </span>
          </div>

          {/* Upgrade options */}
          <div className="grid gap-4">
            {plans.filter((p) =>
              currentTier === "free" ? true : p.key === "pro"
            ).map((plan) => (
              <div
                key={plan.key}
                className={cn(
                  "bg-white rounded-xl border-2 p-5",
                  plan.color === "green" ? "border-green-200" : "border-purple-200"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-[#0F172A]">{plan.label}</p>
                    <div className="flex items-end gap-1 mt-1">
                      <span className="text-2xl font-extrabold text-[#0F172A]">
                        ₦{(annual ? Math.round(plan.annualNGN / 12) : plan.monthlyNGN).toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-xs mb-1">/month</span>
                    </div>
                    {annual && (
                      <p className="text-xs text-emerald-600 font-semibold">
                        ₦{plan.annualNGN.toLocaleString()} billed annually
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      ≈ ${annual ? Math.round(plan.annualUSD / 12) : plan.monthlyUSD}/month USD
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={!!loading}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition disabled:opacity-60",
                      plan.color === "green"
                        ? "bg-green-600 hover:bg-green-700 shadow-md shadow-green-200"
                        : "bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200"
                    )}
                  >
                    {loading === plan.key && <Loader2 className="w-4 h-4 animate-spin" />}
                    Upgrade
                  </button>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className={cn("w-3.5 h-3.5 flex-shrink-0", plan.color === "green" ? "text-green-500" : "text-purple-500")} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {currentTier !== "free" && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm text-slate-600 flex items-center justify-between gap-3">
          <p>Need to cancel or manage your subscription?</p>
          <a
            href="mailto:support@vantage.app"
            className="flex items-center gap-1 text-green-600 font-semibold hover:underline whitespace-nowrap"
          >
            Contact support <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
