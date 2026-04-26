"use client";

import { X, Zap, Star, Lock } from "lucide-react";
import Link from "next/link";
import { useBusinessStore } from "@/store/businessStore";

interface Props {
  feature: string;
  description: string;
  requiredPlan: "starter" | "pro";
  onClose?: () => void;
  inline?: boolean; // render as inline banner instead of modal
}

export function UpgradePrompt({ feature, description, requiredPlan, onClose, inline = false }: Props) {
  const { activeBusiness } = useBusinessStore();
  const slug = activeBusiness?.slug ?? "";

  const planLabel = requiredPlan === "pro" ? "Pro" : "Starter";
  const planColor = requiredPlan === "pro" ? "purple" : "green";

  const content = (
    <div className={`flex flex-col items-center text-center gap-3 p-6 ${inline ? "" : ""}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
        requiredPlan === "pro" ? "bg-purple-100" : "bg-green-100"
      }`}>
        {requiredPlan === "pro"
          ? <Star className="w-6 h-6 text-purple-600" />
          : <Zap className="w-6 h-6 text-green-600" />
        }
      </div>
      <div>
        <p className="font-bold text-[#0F172A] text-base">{feature} requires {planLabel}</p>
        <p className="text-slate-500 text-sm mt-1">{description}</p>
      </div>
      <Link
        href={`/${slug}/settings?tab=billing`}
        className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition shadow-md ${
          requiredPlan === "pro"
            ? "bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-purple-200"
            : "bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 shadow-green-200"
        }`}
      >
        Upgrade to {planLabel}
      </Link>
      <Link href="/pricing" className="text-xs text-slate-400 hover:text-slate-600 transition">
        View all plans
      </Link>
    </div>
  );

  if (inline) {
    return (
      <div className={`rounded-2xl border-2 ${
        requiredPlan === "pro" ? "border-purple-200 bg-purple-50" : "border-green-200 bg-green-50"
      }`}>
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className={`h-1.5 rounded-t-2xl ${
          requiredPlan === "pro"
            ? "bg-gradient-to-r from-purple-400 to-purple-600"
            : "bg-gradient-to-r from-green-400 to-green-600"
        }`} />
        {content}
      </div>
    </div>
  );
}

export function FeatureLockBadge({ requiredPlan }: { requiredPlan: "starter" | "pro" }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
      requiredPlan === "pro"
        ? "bg-purple-100 text-purple-700"
        : "bg-amber-100 text-amber-700"
    }`}>
      <Lock className="w-2.5 h-2.5" />
      {requiredPlan === "pro" ? "PRO" : "STARTER"}
    </span>
  );
}
