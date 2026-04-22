"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, Zap, TrendingUp, ArrowUpRight,
  ShoppingCart, Users, BarChart3, Package,
} from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (authError) {
      setError(authError.message);
      return;
    }
    router.refresh();
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
            Welcome back.<br />
            Your business awaits.
          </h2>
          <p className="text-green-200 mt-3 text-base leading-relaxed">
            Sign in to see your sales, manage your<br />
            team, and grow your business today.
          </p>
        </div>

        {/* Mini dashboard mockup */}
        <div className="relative space-y-4 flex-1">
          {/* Revenue summary card */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-300 text-xs font-semibold uppercase tracking-wider">Today's Revenue</p>
                <p className="font-numeric text-3xl font-bold text-white mt-1">₦142,500</p>
              </div>
              <div className="w-10 h-10 bg-emerald-400/20 rounded-xl flex items-center justify-center border border-emerald-300/30">
                <TrendingUp className="w-5 h-5 text-emerald-300" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-emerald-400/20 text-emerald-300 text-xs font-semibold px-2 py-1 rounded-full border border-emerald-300/30">
                <ArrowUpRight className="w-3 h-3" />
                +18.4%
              </div>
              <span className="text-green-300 text-xs">vs yesterday</span>
            </div>

            {/* Mini bar chart */}
            <div className="mt-4 flex items-end gap-1.5 h-14">
              {[40, 65, 50, 80, 60, 90, 100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: `${h}%`,
                    backgroundColor: i === 6 ? "rgba(52,211,153,0.9)" : "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i} className="flex-1 text-center text-[9px] text-green-300/60">{d}</span>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: ShoppingCart, label: "Sales Today", value: "24", color: "text-emerald-300", bg: "bg-emerald-400/20" },
              { icon: Users, label: "Customers", value: "312", color: "text-blue-300", bg: "bg-blue-400/20" },
              { icon: Package, label: "Products", value: "89", color: "text-violet-300", bg: "bg-violet-400/20" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="bg-white/10 border border-white/20 rounded-xl p-3 backdrop-blur-sm">
                <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center mb-2`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
                <p className="font-numeric text-white font-bold text-lg leading-none">{value}</p>
                <p className="text-green-300 text-[10px] mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Recent transactions */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-green-200 text-[10px] font-semibold uppercase tracking-wider">Recent Sales</span>
              <BarChart3 className="w-3.5 h-3.5 text-green-300/60" />
            </div>
            <div className="space-y-2">
              {[
                { name: "Running Shoes", amount: "₦24,000", time: "2m ago" },
                { name: "Haircut + Beard Trim", amount: "₦6,500", time: "14m ago" },
                { name: "Silk T-Shirt ×2", amount: "₦7,000", time: "31m ago" },
              ].map((tx) => (
                <div key={tx.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span className="text-white/80 text-xs">{tx.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-numeric text-white text-xs font-semibold">{tx.amount}</span>
                    <span className="text-green-300/60 text-[9px] ml-2">{tx.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust signal */}
        <div className="relative mt-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex -space-x-2">
              {[5, 28, 44, 57, 15].map((n) => (
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
                Trusted by <span className="text-emerald-300">1,200+</span> businesses
              </p>
              <p className="text-green-300 text-[10px]">across Africa and beyond</p>
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
          <p className="text-green-200 text-sm">Business management, simplified</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-[#0F172A]">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Email</label>
                <input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  placeholder="you@business.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Password</label>
                <input
                  {...register("password")}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
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
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Feature pills */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                { icon: ShoppingCart, label: "Live POS" },
                { icon: BarChart3, label: "Reports" },
                { icon: Users, label: "Your team" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Icon className="w-4 h-4 text-green-600" />
                  <span className="text-[10px] text-slate-500 font-medium leading-tight">{label}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-green-600 font-semibold hover:underline">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
