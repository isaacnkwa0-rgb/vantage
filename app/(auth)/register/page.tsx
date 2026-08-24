"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Loader2, CheckCircle2, ShoppingCart, Package, TrendingUp, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
type FormData = z.infer<typeof schema>;

const SLIDES = [
  {
    headline: "Start managing your business like you",
    highlight: "mean business.",
    sub: "Manage your inventory, sales, customers & payments with structure.",
    Illustration: () => (
      <div className="bg-white rounded-2xl shadow-lg p-4 mx-2 border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] text-slate-400">Hello, Zikky</p>
            <p className="text-[10px] text-green-600 font-medium">Record your first sale →</p>
          </div>
          <div className="flex gap-2">
            <div className="w-7 h-7 bg-slate-100 rounded-full" />
            <div className="w-7 h-7 bg-slate-100 rounded-full" />
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl px-3 py-2 flex items-center gap-2 mb-3 border border-slate-100">
          <div className="w-5 h-5 rounded bg-[#1a9c38] flex items-center justify-center">
            <Package className="w-3 h-3 text-white" />
          </div>
          <span className="text-[11px] font-semibold text-slate-700">Zikky Gadgets</span>
        </div>
        <p className="text-[10px] text-slate-400 mb-0.5">Total Revenue · This Month</p>
        <p className="text-[22px] font-bold text-slate-900 font-numeric leading-none mb-3">₦840,000</p>
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {[
            { label: "Orders", val: "1,240", bg: "bg-slate-50" },
            { label: "Products", val: "289", bg: "bg-[#E8F5EC]" },
            { label: "Customers", val: "136", bg: "bg-[#FEF9EC]" },
            { label: "New", val: "+12", bg: "bg-[#FEF0F0]" },
          ].map((s) => (
            <div key={s.label} className={cn("rounded-lg p-1.5 text-center", s.bg)}>
              <p className="text-[11px] font-bold text-slate-800">{s.val}</p>
              <p className="text-[8px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "New Sale", icon: ShoppingCart, green: true },
            { label: "Products", icon: Package, green: false },
            { label: "Analytics", icon: TrendingUp, green: false },
            { label: "Expenses", icon: TrendingUp, green: false },
          ].map((a) => (
            <div key={a.label} className="flex flex-col items-center gap-1">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", a.green ? "bg-[#1a9c38]" : "bg-slate-100")}>
                <a.icon className={cn("w-4 h-4", a.green ? "text-white" : "text-slate-500")} />
              </div>
              <span className="text-[8px] text-slate-500">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    headline: "Record sales & track inventory",
    highlight: "in real time.",
    sub: "Fast POS checkout with multiple payment methods and live stock updates.",
    Illustration: () => (
      <div className="bg-white rounded-2xl shadow-lg p-4 mx-2 border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-bold text-slate-800">Today&apos;s Sales</p>
          <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-semibold">POS Active</span>
        </div>
        <div className="space-y-2 mb-3">
          {[
            { name: "Wireless Earbuds", qty: "×1", amount: "₦12,000", method: "Cash" },
            { name: "iPhone Case", qty: "×2", amount: "₦8,500", method: "Transfer" },
            { name: "USB-C Cable", qty: "×3", amount: "₦4,500", method: "Card" },
          ].map((s) => (
            <div key={s.name} className="flex items-center gap-2 py-1.5 border-b border-slate-50">
              <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-3.5 h-3.5 text-[#1a9c38]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-slate-800 truncate">{s.name} {s.qty}</p>
                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 rounded-full">{s.method}</span>
              </div>
              <p className="text-[11px] font-bold text-slate-900 font-numeric">{s.amount}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#E8F5EC] rounded-xl p-2.5 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-green-800">Total today</p>
          <p className="text-[14px] font-bold text-[#1a9c38] font-numeric">₦25,000</p>
        </div>
      </div>
    ),
  },
  {
    headline: "Grow your business beyond",
    highlight: "your goals.",
    sub: "Expense tracking, invoicing, customer insights, and detailed reports to keep you ahead.",
    Illustration: () => (
      <div className="bg-white rounded-2xl shadow-lg p-4 mx-2 border border-slate-100">
        <p className="text-[12px] font-bold text-slate-800 mb-3">Business Overview</p>
        <div className="space-y-2.5 mb-3">
          {[
            { label: "Revenue", val: "₦840,000", pct: 85, color: "bg-[#1a9c38]" },
            { label: "Expenses", val: "₦120,000", pct: 30, color: "bg-amber-400" },
            { label: "Net Profit", val: "₦720,000", pct: 72, color: "bg-blue-400" },
          ].map((r) => (
            <div key={r.label}>
              <div className="flex justify-between mb-1">
                <p className="text-[10px] text-slate-500">{r.label}</p>
                <p className="text-[10px] font-bold text-slate-800 font-numeric">{r.val}</p>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", r.color)} style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <p className="text-[18px] font-bold text-slate-900 font-numeric">136</p>
            <p className="text-[9px] text-slate-500">Customers</p>
          </div>
          <div className="bg-[#E8F5EC] rounded-xl p-2.5 text-center">
            <p className="text-[18px] font-bold text-[#1a9c38] font-numeric">+18%</p>
            <p className="text-[9px] text-slate-500">vs last month</p>
          </div>
        </div>
      </div>
    ),
  },
];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function RegisterPage() {
  const [slide, setSlide] = useState(0);
  const [step, setStep] = useState<"carousel" | "methods" | "email-form">("carousel");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (authError) { setError(authError.message); return; }
    setSuccess(true);
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  // ── Success ────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
        <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
          We sent a confirmation link to your email. Click it to activate your account.
        </p>
        <Link href="/login" className="mt-6 inline-block text-[#1a9c38] font-semibold text-sm">
          Back to sign in →
        </Link>
      </div>
    );
  }

  // ── Email form ─────────────────────────────────────────────
  if (step === "email-form") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-5 pt-12 pb-6">
          <button onClick={() => setStep("methods")} className="text-slate-400 text-sm font-medium">
            ← Back
          </button>
        </div>
        <div className="flex-1 px-5">
          <div className="flex items-center gap-2.5 mb-6">
            <Image src="/vantage-icon.svg" alt="Vantage" width={32} height={32} className="rounded-xl" />
            <span className="text-lg font-extrabold text-slate-900">Vantage</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h2>
          <p className="text-slate-400 text-sm mb-6">Start managing your business in minutes</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                {...register("fullName")}
                type="text"
                autoComplete="name"
                placeholder="Isaac Nkwa"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="you@business.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                {...register("password")}
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1a9c38] hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1a9c38] font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Auth method selection ──────────────────────────────────
  if (step === "methods") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-5 pt-12 pb-6">
          <button onClick={() => setStep("carousel")} className="text-slate-400 text-sm font-medium">
            ← Back
          </button>
        </div>
        <div className="flex-1 flex flex-col justify-center px-5 pb-10">
          <div className="flex items-center gap-2.5 mb-8">
            <Image src="/vantage-icon.svg" alt="Vantage" width={36} height={36} className="rounded-xl" />
            <span className="text-xl font-extrabold text-slate-900">Vantage</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Create your account</h2>
          <p className="text-slate-400 text-sm mb-8">Choose how you want to get started</p>

          <div className="space-y-3">
            <button
              onClick={signInWithGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 rounded-xl py-3.5 text-[15px] font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition disabled:opacity-60"
            >
              {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>

            <button
              onClick={() => setStep("email-form")}
              className="w-full flex items-center justify-center gap-3 bg-[#1a9c38] hover:bg-green-700 rounded-xl py-3.5 text-[15px] font-semibold text-white transition"
            >
              <Mail className="w-5 h-5" />
              Continue with Email
            </button>
          </div>

          <p className="text-center text-sm text-slate-400 mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1a9c38] font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Onboarding carousel ────────────────────────────────────
  const { headline, highlight, sub, Illustration } = SLIDES[slide];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Dot indicators */}
      <div className="flex justify-center gap-2 pt-14 pb-4">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={cn(
              "rounded-full transition-all",
              i === slide ? "w-6 h-2 bg-[#1a9c38]" : "w-2 h-2 bg-slate-200"
            )}
          />
        ))}
      </div>

      {/* Slide content */}
      <div
        className="flex-1 flex flex-col px-6 pt-4"
        onTouchStart={(e) => { e.currentTarget.dataset.startX = String(e.touches[0].clientX); }}
        onTouchEnd={(e) => {
          const diff = Number(e.currentTarget.dataset.startX ?? 0) - e.changedTouches[0].clientX;
          if (diff > 50) setSlide((s) => Math.min(s + 1, SLIDES.length - 1));
          if (diff < -50) setSlide((s) => Math.max(s - 1, 0));
        }}
      >
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold text-slate-900 leading-tight">
            {headline}{" "}
            <span className="text-[#1a9c38] underline decoration-[#1a9c38] underline-offset-4">
              {highlight}
            </span>
          </h1>
          <p className="text-slate-400 text-[14px] mt-3 leading-relaxed">{sub}</p>
        </div>
        <div className="flex-1 flex items-center">
          <div className="w-full"><Illustration /></div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="px-5 pb-10 pt-6 space-y-3">
        <Link
          href="/login"
          className="w-full bg-[#1a9c38] hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center text-[15px] transition"
        >
          Sign In
        </Link>
        <button
          onClick={() => setStep("methods")}
          className="w-full border-2 border-slate-200 text-slate-800 font-semibold py-3.5 rounded-xl flex items-center justify-center text-[15px] hover:border-slate-300 transition"
        >
          Create an account
        </button>
      </div>
    </div>
  );
}
