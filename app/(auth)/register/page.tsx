"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle2, ShoppingCart, Package, TrendingUp, Mail, ChevronDown, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  firstName: z.string().min(1, "Enter your first name"),
  lastName: z.string().min(1, "Enter your last name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  phone: z.string().optional(),
  referral: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const COUNTRIES = [
  { flag: "🇳🇬", code: "+234", name: "Nigeria" },
  { flag: "🇰🇪", code: "+254", name: "Kenya" },
  { flag: "🇿🇦", code: "+27", name: "South Africa" },
  { flag: "🇬🇭", code: "+233", name: "Ghana" },
];

const REFERRAL_OPTIONS = [
  "Friend/Family",
  "Twitter/X",
  "Instagram",
  "TikTok",
  "Google Search",
  "Facebook/Instagram Ads",
  "Google Ads",
  "Referral",
  "Others",
];

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
        <p className="text-[22px] font-bold text-slate-900 leading-none mb-3">₦840,000</p>
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
              <p className="text-[11px] font-bold text-slate-900">{s.amount}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#E8F5EC] rounded-xl p-2.5 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-green-800">Total today</p>
          <p className="text-[14px] font-bold text-[#1a9c38]">₦25,000</p>
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
                <p className="text-[10px] font-bold text-slate-800">{r.val}</p>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", r.color)} style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <p className="text-[18px] font-bold text-slate-900">136</p>
            <p className="text-[9px] text-slate-500">Customers</p>
          </div>
          <div className="bg-[#E8F5EC] rounded-xl p-2.5 text-center">
            <p className="text-[18px] font-bold text-[#1a9c38]">+18%</p>
            <p className="text-[9px] text-slate-500">vs last month</p>
          </div>
        </div>
      </div>
    ),
  },
];

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 376.8 45 355.2 45 345.4c0-177.3 115.4-271.6 228.7-271.6 60.7 0 111.3 39.8 149.7 39.8 36.5 0 93.5-42.4 162.9-42.4 13.1 0 108.2 1.3 170.5 82.6zm-160.2-181.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}

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
  return <Suspense><RegisterPageInner /></Suspense>;
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = searchParams.get("step") as "carousel" | "methods" | "email-form" | null;
  const [slide, setSlide] = useState(0);
  const [step, setStep] = useState<"carousel" | "methods" | "email-form">(initialStep ?? "carousel");
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: `${data.firstName} ${data.lastName}` },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (authError) { setError(authError.message); return; }
    // If Supabase returns a session immediately (email confirmation disabled),
    // go straight to onboarding. Otherwise show the "check your email" screen.
    if (signUpData.session) {
      router.push("/onboarding");
      return;
    }
    setSubmittedEmail(data.email);
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
          We sent a confirmation link to
        </p>
        <p className="text-slate-900 font-semibold text-sm mt-1 mb-1">{submittedEmail}</p>
        <p className="text-slate-500 text-sm">Click it to activate your account.</p>
        <Link href="/login" className="mt-6 inline-block text-[#1a9c38] font-semibold text-sm">
          Back to sign in →
        </Link>
      </div>
    );
  }

  // ── Email form ─────────────────────────────────────────────
  if (step === "email-form") {
    const filteredCountries = COUNTRIES.filter((c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Country picker modal */}
        {showCountryPicker && (
          <div className="fixed inset-0 bg-black/40 z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-2xl pt-4 pb-10">
              <div className="flex items-center gap-3 px-5 pb-3 border-b border-slate-100">
                <button type="button" onClick={() => { setShowCountryPicker(false); setCountrySearch(""); }}>
                  <X className="w-5 h-5 text-slate-700" />
                </button>
                <input
                  type="text"
                  placeholder="Enter country name"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="flex-1 text-[14px] text-slate-700 focus:outline-none placeholder:text-slate-400"
                  autoFocus
                />
              </div>
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { setCountry(c); setShowCountryPicker(false); setCountrySearch(""); }}
                  className="w-full flex items-center gap-4 px-5 py-4 border-b border-slate-50 text-[16px] text-slate-800 hover:bg-slate-50 text-left"
                >
                  <span className="text-2xl">{c.flag}</span>
                  {c.name} ({c.code})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Back pill */}
        <div className="px-5 pt-12 pb-4">
          <button
            onClick={() => setStep("methods")}
            className="flex items-center gap-1 text-[13px] font-medium text-[#1a9c38] bg-slate-100 px-3 py-1.5 rounded-full w-fit"
          >
            <ChevronLeft className="w-[13px] h-[13px]" /> Back
          </button>
        </div>

        <div className="flex-1 px-5 pb-10 overflow-auto">
          <h2 className="text-[22px] font-bold text-slate-900 leading-snug mb-1">
            Start doing business like a Pro today.
          </h2>
          <p className="text-slate-400 text-[14px] mb-6">Manage your business smarter with Vantage</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  {...register("firstName")}
                  type="text"
                  autoComplete="given-name"
                  placeholder="First Name*"
                  className="w-full h-10 px-4 border border-slate-200 rounded-[4px] text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a9c38] focus:border-transparent"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <input
                  {...register("lastName")}
                  type="text"
                  autoComplete="family-name"
                  placeholder="Surname*"
                  className="w-full h-10 px-4 border border-slate-200 rounded-[4px] text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a9c38] focus:border-transparent"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="Email Address*"
                className="w-full h-10 px-4 border border-slate-200 rounded-[4px] text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a9c38] focus:border-transparent"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone with country picker */}
            <div className="h-10 flex border border-slate-200 rounded-[4px] overflow-hidden focus-within:ring-2 focus-within:ring-[#1a9c38]">
              <button
                type="button"
                onClick={() => setShowCountryPicker(true)}
                className="flex items-center gap-1.5 px-3 border-r border-slate-200 bg-white flex-shrink-0"
              >
                <span className="text-xl leading-none">{country.flag}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <input
                {...register("phone")}
                type="tel"
                autoComplete="tel"
                placeholder={`${country.code} 8012345678`}
                className="flex-1 px-3 text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none bg-white"
              />
            </div>

            {/* Password */}
            <div>
              <input
                {...register("password")}
                type="password"
                autoComplete="new-password"
                placeholder="Password*"
                className="w-full h-10 px-4 border border-slate-200 rounded-[4px] text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a9c38] focus:border-transparent"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* How did you hear dropdown */}
            <div className="relative">
              <select
                {...register("referral")}
                className="w-full h-10 px-4 border border-slate-200 rounded-[4px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1a9c38] focus:border-transparent appearance-none bg-white text-slate-400"
                defaultValue=""
              >
                <option value="" disabled>How did you hear about Vantage?</option>
                {REFERRAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="text-slate-800">{opt}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Marketing consent checkbox */}
            <label className="flex items-start gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded accent-[#1a9c38] cursor-pointer flex-shrink-0"
              />
              <span className="text-[13px] text-slate-500 leading-snug">
                I&apos;ll like to receive marketing communication and tips from Vantage
              </span>
            </label>

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

            {/* Continue button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-[#1a9c38] hover:bg-green-700 text-white font-bold rounded-[4px] text-[15px] transition flex items-center justify-center gap-2 disabled:opacity-60 !mt-5"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Creating account..." : "Continue"}
            </button>
          </form>

          {/* Terms */}
          <p className="text-center text-[12px] text-slate-400 mt-5 leading-relaxed px-2">
            By continuing, I agree to Vantage&apos;s{" "}
            <Link href="/terms" className="text-[#1a9c38]">Terms of Use</Link>
            {" "}&amp;{" "}
            <Link href="/privacy" className="text-[#1a9c38]">Privacy Policy</Link>
          </p>

          <p className="text-center text-[14px] text-slate-400 mt-3">
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
      <div className="min-h-screen bg-white flex flex-col px-5">
        {/* Back */}
        <div className="pt-12 pb-2">
          <button onClick={() => setStep("carousel")} className="flex items-center gap-1 text-[13px] font-medium text-[#1a9c38] bg-slate-100 px-3 py-1.5 rounded-full w-fit">
            <ChevronLeft className="w-[13px] h-[13px]" /> Back
          </button>
        </div>

        {/* Headline */}
        <div className="text-center mt-10 mb-10 px-2">
          <h2 className="text-[22px] font-bold text-slate-900 leading-snug">
            Start doing business like a Pro today.
          </h2>
          <p className="text-slate-400 text-[14px] mt-2">Manage your business smarter with Vantage</p>
        </div>

        {/* Auth buttons */}
        <div className="space-y-3">
          <button
            onClick={() => setStep("email-form")}
            className="w-full h-11 flex items-center justify-center gap-3 bg-[#1a9c38] hover:bg-green-700 rounded-[4px] text-[15px] font-semibold text-white transition"
          >
            <Mail className="w-5 h-5" />
            Join with Email
          </button>

          <button
            type="button"
            className="w-full h-11 flex items-center justify-center gap-3 border border-black rounded-[4px] text-[15px] font-semibold text-slate-900 hover:bg-slate-50 transition"
          >
            <AppleIcon />
            Join with Apple
          </button>

          <button
            onClick={signInWithGoogle}
            disabled={googleLoading}
            className="w-full h-11 flex items-center justify-center gap-3 border border-black rounded-[4px] text-[15px] font-semibold text-slate-900 hover:bg-slate-50 transition disabled:opacity-60"
          >
            {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
            Join with Google
          </button>
        </div>

        {/* Sign in link */}
        <p className="text-center text-[14px] text-slate-400 mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-[#1a9c38] font-semibold">Sign in</Link>
        </p>
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
          <h1 className="text-[28px] font-semibold text-slate-900 leading-tight">
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
          className="w-full bg-[#1a9c38] hover:bg-green-700 text-white font-semibold h-11 rounded-[4px] flex items-center justify-center text-[15px] transition"
        >
          Sign In
        </Link>
        <button
          onClick={() => setStep("methods")}
          className="w-full border border-black text-slate-900 font-semibold h-11 rounded-[4px] flex items-center justify-center text-[15px] hover:bg-slate-50 transition"
        >
          Create an account
        </button>
      </div>
    </div>
  );
}
