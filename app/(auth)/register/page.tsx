"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, Zap, ShoppingBag, Scissors, CheckCircle2,
  TrendingUp, Users, BarChart3, Receipt, Package,
} from "lucide-react";

const schema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-10 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">VANTAGE</span>
        </div>

        {/* Headline */}
        <div className="relative mb-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            One platform.<br />
            Every business.
          </h2>
          <p className="text-green-200 mt-3 text-base leading-relaxed">
            Whether you sell products or offer services,<br />
            VANTAGE gives you the tools to grow.
          </p>
        </div>

        {/* Feature cards */}
        <div className="relative space-y-4 flex-1">
          {/* Selling card */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-emerald-400/30 rounded-xl flex items-center justify-center border border-emerald-300/30">
                <ShoppingBag className="w-4.5 h-4.5 text-emerald-200" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">For shops & retailers</p>
                <p className="text-green-300 text-xs">Sell products, track inventory</p>
              </div>
            </div>
            {/* Mini POS mockup */}
            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-200 text-[10px] font-semibold uppercase tracking-wider">Live Sale</span>
                <span className="text-[10px] bg-emerald-400/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-300/30">POS Active</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-white/80 text-xs">
                  <span className="flex items-center gap-1.5"><Package className="w-3 h-3 text-green-300" /> Wireless Earbuds ×1</span>
                  <span className="font-numeric font-semibold">$89.00</span>
                </div>
                <div className="flex justify-between text-white/80 text-xs">
                  <span className="flex items-center gap-1.5"><Package className="w-3 h-3 text-green-300" /> Premium Tee ×2</span>
                  <span className="font-numeric font-semibold">€54.00</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
                <span className="text-green-200 text-xs">Total</span>
                <span className="font-numeric text-white font-bold text-sm">$143.00</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { icon: Package, label: "Inventory" },
                { icon: TrendingUp, label: "Analytics" },
                { icon: BarChart3, label: "Reports" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 bg-white/10 rounded-lg py-2">
                  <Icon className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-[10px] text-green-200">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Services card */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-green-400/30 rounded-xl flex items-center justify-center border border-green-300/30">
                <Scissors className="w-4.5 h-4.5 text-green-200" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">For salons & service businesses</p>
                <p className="text-green-300 text-xs">Record services, manage clients</p>
              </div>
            </div>
            {/* Mini session mockup */}
            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-200 text-[10px] font-semibold uppercase tracking-wider">Today's Session</span>
                <span className="text-[10px] bg-green-400/30 text-green-200 px-2 py-0.5 rounded-full border border-green-300/30">In Progress</span>
              </div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 bg-green-400/30 rounded-full flex items-center justify-center text-xs font-bold text-white border border-green-300/30">A</div>
                <div>
                  <p className="text-white text-xs font-medium">Amara Johnson</p>
                  <p className="text-green-300 text-[10px]">Walk-in client</p>
                </div>
              </div>
              <div className="space-y-1">
                {["Haircut", "Beard Trim"].map((s) => (
                  <div key={s} className="flex items-center gap-1.5 text-white/80 text-xs">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    {s}
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
                <span className="text-green-200 text-xs">Charge</span>
                <span className="font-numeric text-white font-bold text-sm">£65.00</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { icon: Users, label: "Clients" },
                { icon: Receipt, label: "Invoices" },
                { icon: TrendingUp, label: "Revenue" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 bg-white/10 rounded-lg py-2">
                  <Icon className="w-3.5 h-3.5 text-green-300" />
                  <span className="text-[10px] text-green-200">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust signal */}
        <div className="relative mt-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex -space-x-2">
              {[47, 12, 32, 68, 3].map((n) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={n}
                  src={`https://i.pravatar.cc/56?img=${n}`}
                  alt=""
                  className="w-8 h-8 rounded-full border-2 border-green-800 object-cover"
                />
              ))}
            </div>
            <div>
              <p className="text-white text-xs font-semibold">
                Join <span className="text-emerald-300">1,200+</span> businesses
              </p>
              <p className="text-green-300 text-[10px]">already growing with VANTAGE</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-3 h-3 fill-amber-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-green-300 text-[10px]">4.9 / 5 from 200+ reviews</span>
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex flex-col min-h-screen bg-white">
        {/* Mobile header */}
        <div className="lg:hidden bg-gradient-to-br from-green-900 to-green-700 px-6 pt-10 pb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">VANTAGE</span>
          </div>
          <p className="text-green-200 text-sm">Business management for shops & services</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            {success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-[#0F172A] mb-2">Check your email</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  We sent a confirmation link to your email. Click it to activate your account and get started.
                </p>
                <Link href="/login" className="mt-6 inline-block text-green-600 font-medium text-sm hover:underline">
                  Back to sign in →
                </Link>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="mb-7">
                  <h2 className="text-2xl font-bold text-[#0F172A]">Create your free account</h2>
                  <p className="text-slate-500 text-sm mt-1">Start managing your business in minutes</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Full Name</label>
                    <input
                      {...register("fullName")}
                      type="text"
                      autoComplete="name"
                      placeholder="Isaac Nkwa"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Email</label>
                    <input
                      {...register("email")}
                      type="email"
                      autoComplete="email"
                      placeholder="you@business.com"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Password</label>
                    <input
                      {...register("password")}
                      type="password"
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Confirm Password</label>
                    <input
                      {...register("confirmPassword")}
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-green-300/30 mt-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? "Creating account..." : "Get started — it's free"}
                  </button>
                </form>

                {/* Divider features */}
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  {[
                    { icon: ShoppingBag, label: "Sell products" },
                    { icon: Scissors, label: "Book services" },
                    { icon: BarChart3, label: "See reports" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <Icon className="w-4 h-4 text-green-600" />
                      <span className="text-[10px] text-slate-500 font-medium leading-tight">{label}</span>
                    </div>
                  ))}
                </div>

                <p className="text-center text-sm text-slate-500 mt-6">
                  Already have an account?{" "}
                  <Link href="/login" className="text-green-600 font-semibold hover:underline">Sign in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
