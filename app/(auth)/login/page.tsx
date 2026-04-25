"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Loader2, Zap, ShoppingCart, Users, BarChart3, Package,
  TrendingUp, Receipt, CheckCircle2, Clock,
} from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

const SLIDE_TABS = ["Sales", "Inventory", "Invoices", "Analytics"];

function SalesSlide() {
  return (
    <div className="h-full flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-3.5 h-3.5 text-emerald-300" />
          <span className="text-white text-[11px] font-semibold">POS Terminal</span>
        </div>
        <span className="text-[9px] bg-emerald-400/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-300/20">
          ● Live
        </span>
      </div>

      <div className="flex-1 space-y-1.5">
        {[
          { name: "Wireless Earbuds", qty: 1, price: "$89.00" },
          { name: "Premium Hoodie", qty: 2, price: "$110.00" },
          { name: "Yoga Mat", qty: 1, price: "$45.00" },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-2 bg-white/10 rounded-lg px-2.5 py-2 border border-white/5">
            <Package className="w-3 h-3 text-green-300/70 flex-shrink-0" />
            <span className="flex-1 text-white/85 text-[11px] truncate">{item.name}</span>
            <span className="text-green-300/60 text-[10px] flex-shrink-0">×{item.qty}</span>
            <span className="font-numeric text-white text-[11px] font-semibold flex-shrink-0">{item.price}</span>
          </div>
        ))}
      </div>

      <div className="pt-2.5 border-t border-white/10 space-y-1">
        <div className="flex justify-between text-white/60 text-[10px]">
          <span>Subtotal</span><span className="font-numeric">$244.00</span>
        </div>
        <div className="flex justify-between text-white/60 text-[10px]">
          <span>Tax (7.5%)</span><span className="font-numeric">$18.30</span>
        </div>
        <div className="flex items-center justify-between bg-emerald-500/25 rounded-lg px-2.5 py-1.5 border border-emerald-400/20 mt-1">
          <span className="text-white font-semibold text-xs">Total</span>
          <span className="font-numeric text-white font-bold text-sm">$262.30</span>
        </div>
        <div className="bg-emerald-500/80 hover:bg-emerald-500 rounded-lg py-2 text-center text-white text-[11px] font-bold transition cursor-default">
          Charge $262.30
        </div>
      </div>
    </div>
  );
}

function InventorySlide() {
  return (
    <div className="h-full flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-violet-300" />
          <span className="text-white text-[11px] font-semibold">Inventory</span>
        </div>
        <span className="text-[9px] bg-white/10 text-green-200 px-2 py-0.5 rounded-full">86 products</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Stock Value", value: "$12.4K", color: "text-white" },
          { label: "Retail Value", value: "$24.8K", color: "text-emerald-300" },
          { label: "Profit", value: "$12.4K", color: "text-violet-300" },
        ].map((s) => (
          <div key={s.label} className="bg-white/10 rounded-lg p-2 text-center border border-white/5">
            <p className={`font-numeric font-bold text-xs ${s.color}`}>{s.value}</p>
            <p className="text-green-300/60 text-[8px] mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 space-y-1.5">
        {[
          { name: "Wireless Earbuds", stock: 12, status: "ok" as const, price: "$89" },
          { name: "Premium Hoodie", stock: 3, status: "low" as const, price: "$55" },
          { name: "Yoga Mat", stock: 28, status: "ok" as const, price: "$45" },
          { name: "Smart Watch", stock: 0, status: "out" as const, price: "$199" },
        ].map((p) => (
          <div key={p.name} className="flex items-center gap-2 bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/5">
            <Package className="w-2.5 h-2.5 text-green-300/60 flex-shrink-0" />
            <span className="flex-1 text-white/85 text-[11px] truncate">{p.name}</span>
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0",
              p.status === "ok" ? "bg-emerald-400/20 text-emerald-300" :
              p.status === "low" ? "bg-amber-400/20 text-amber-300" :
              "bg-red-400/20 text-red-300"
            )}>
              {p.status === "ok" ? `${p.stock} in stock` : p.status === "low" ? `Low: ${p.stock}` : "Out"}
            </span>
            <span className="font-numeric text-white text-[11px] font-semibold flex-shrink-0">{p.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoicesSlide() {
  return (
    <div className="h-full flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-3.5 h-3.5 text-blue-300" />
          <span className="text-white text-[11px] font-semibold">Invoices</span>
        </div>
        <span className="text-[9px] bg-white/10 text-green-200 px-2 py-0.5 rounded-full">This month</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Paid", value: "$8.4K", color: "text-emerald-300", icon: CheckCircle2 },
          { label: "Pending", value: "$2.1K", color: "text-amber-300", icon: Clock },
          { label: "Overdue", value: "$890", color: "text-red-300", icon: Clock },
        ].map((s) => (
          <div key={s.label} className="bg-white/10 rounded-lg p-2 text-center border border-white/5">
            <p className={`font-numeric font-bold text-xs ${s.color}`}>{s.value}</p>
            <p className="text-green-300/60 text-[8px] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 space-y-1.5">
        {[
          { id: "INV-042", client: "Acme Corp", amount: "$1,200", status: "paid" as const },
          { id: "INV-041", client: "TechStart", amount: "$850", status: "pending" as const },
          { id: "INV-040", client: "Studio J", amount: "$450", status: "paid" as const },
          { id: "INV-039", client: "DevHub", amount: "$320", status: "overdue" as const },
        ].map((inv) => (
          <div key={inv.id} className="flex items-center gap-2 bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/5">
            <span className="text-green-300/50 text-[9px] font-mono w-12 flex-shrink-0">{inv.id}</span>
            <span className="flex-1 text-white/85 text-[11px] truncate">{inv.client}</span>
            <span className="font-numeric text-white text-[11px] font-semibold flex-shrink-0">{inv.amount}</span>
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0",
              inv.status === "paid" ? "bg-emerald-400/20 text-emerald-300" :
              inv.status === "pending" ? "bg-amber-400/20 text-amber-300" :
              "bg-red-400/20 text-red-300"
            )}>
              {inv.status === "paid" ? "✓ Paid" : inv.status === "pending" ? "Pending" : "Overdue"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsSlide() {
  const bars = [35, 52, 41, 68, 48, 75, 90, 62, 80, 95, 70, 100];
  return (
    <div className="h-full flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-white text-[11px] font-semibold">Analytics</span>
        </div>
        <div className="flex items-center gap-1 bg-emerald-400/20 text-emerald-300 text-[9px] px-2 py-0.5 rounded-full border border-emerald-300/20">
          <TrendingUp className="w-2.5 h-2.5" />
          +24.8% YoY
        </div>
      </div>

      <div className="bg-white/10 rounded-xl p-2.5 border border-white/5">
        <p className="text-green-300/60 text-[9px] mb-0.5">Annual Revenue</p>
        <p className="font-numeric text-white font-bold text-lg">$284,600</p>
      </div>

      <div className="flex-1 flex items-end gap-0.5 min-h-0">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{
              height: `${h}%`,
              backgroundColor: i === 11 ? "rgba(52,211,153,0.85)" : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>
      <div className="flex gap-0.5">
        {["J","F","M","A","M","J","J","A","S","O","N","D"].map((m, i) => (
          <span key={i} className="flex-1 text-center text-[8px] text-green-300/40">{m}</span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Orders", value: "1,248" },
          { label: "Customers", value: "384" },
          { label: "Avg. Order", value: "$228" },
        ].map((m) => (
          <div key={m.label} className="bg-white/10 rounded-lg p-2 text-center border border-white/5">
            <p className="font-numeric text-white font-bold text-xs">{m.value}</p>
            <p className="text-green-300/60 text-[8px] mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const SLIDE_COMPONENTS = [<SalesSlide key="sales" />, <InventorySlide key="inv" />, <InvoicesSlide key="invoices" />, <AnalyticsSlide key="analytics" />];

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % 4), 3500);
    return () => clearInterval(t);
  }, []);

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (authError) { setError(authError.message); return; }
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-10 relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">VANTAGE</span>
        </div>

        {/* Headline */}
        <div className="relative mb-6">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Your business.<br />One platform.
          </h2>
          <p className="text-green-200 mt-3 text-sm leading-relaxed">
            Point of sale, inventory, invoicing and<br />analytics — built for businesses worldwide.
          </p>
        </div>

        {/* App preview slideshow */}
        <div className="relative flex-1 flex flex-col min-h-0">
          {/* Tab selector */}
          <div className="flex gap-1.5 mb-3 flex-shrink-0">
            {SLIDE_TABS.map((label, i) => (
              <button
                key={label}
                onClick={() => setSlide(i)}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-semibold transition-all",
                  i === slide
                    ? "bg-white/20 text-white border border-white/30 backdrop-blur-sm"
                    : "text-green-300/60 hover:text-green-200 hover:bg-white/10"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* App frame */}
          <div className="flex-1 bg-black/20 border border-white/20 rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col min-h-0">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-4 py-2 bg-black/20 border-b border-white/10 flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
              <div className="ml-2 flex-1 bg-white/10 rounded px-2.5 py-0.5 text-[9px] text-green-300/50 font-mono">
                app.vantage.io · {SLIDE_TABS[slide].toLowerCase()}
              </div>
            </div>

            {/* Slides */}
            <div className="relative flex-1 min-h-0">
              {SLIDE_COMPONENTS.map((content, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute inset-0 p-4 transition-all duration-500",
                    i === slide
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 translate-y-2 pointer-events-none"
                  )}
                >
                  {content}
                </div>
              ))}
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center items-center gap-2 mt-4 flex-shrink-0">
            {SLIDE_TABS.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === slide ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/50"
                )}
              />
            ))}
          </div>
        </div>

        {/* Trust signal */}
        <div className="relative mt-6 flex-shrink-0">
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
              <p className="text-green-300 text-[10px]">in 50+ countries worldwide</p>
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
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
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
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
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
