"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { generateBusinessSlug } from "@/lib/utils/slugify";
import { Loader2, Building2 } from "lucide-react";

const DEFAULT_CATEGORIES: Record<string, { name: string; color: string }[]> = {
  retail: [
    { name: "General", color: "#64748b" },
    { name: "Electronics", color: "#3b82f6" },
    { name: "Clothing", color: "#8b5cf6" },
    { name: "Food & Drinks", color: "#f59e0b" },
    { name: "Beauty", color: "#ec4899" },
    { name: "Household", color: "#10b981" },
  ],
  service: [
    { name: "General", color: "#64748b" },
    { name: "Consultation", color: "#3b82f6" },
    { name: "Treatment", color: "#8b5cf6" },
    { name: "Package", color: "#10b981" },
    { name: "Add-on", color: "#f59e0b" },
    { name: "Premium", color: "#ec4899" },
  ],
  restaurant: [
    { name: "Starters", color: "#f59e0b" },
    { name: "Main Course", color: "#ef4444" },
    { name: "Drinks", color: "#3b82f6" },
    { name: "Desserts", color: "#ec4899" },
    { name: "Combos", color: "#10b981" },
    { name: "Specials", color: "#8b5cf6" },
  ],
};

const CURRENCIES = [
  { value: "NGN", label: "Nigerian Naira (₦)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "GHS", label: "Ghanaian Cedi (₵)" },
  { value: "KES", label: "Kenyan Shilling (KSh)" },
  { value: "ZAR", label: "South African Rand (R)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "EUR", label: "Euro (€)" },
];

const BUSINESS_MODES = [
  {
    value: "retail",
    label: "I sell products",
    description: "Shops, stores, wholesale, supermarkets, pharmacies",
    icon: "🛍️",
  },
  {
    value: "service",
    label: "I offer services",
    description: "Salons, barbershops, clinics, laundry, freelancers",
    icon: "✂️",
  },
];

const schema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  business_type: z.string().min(1, "Select a business type"),
  currency: z.string().min(1, "Select a currency"),
  country: z.string().min(2, "Enter your country"),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "NGN", business_type: "retail" },
  });

  const selectedType = watch("business_type");

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Ensure profile exists
    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? "Business Owner",
      email: user.email!,
    });

    // Create business
    const slug = generateBusinessSlug(data.name);
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .insert({
        owner_id: user.id,
        name: data.name,
        slug,
        business_type: data.business_type,
        currency: data.currency,
        country: data.country,
        phone: data.phone || null,
      })
      .select()
      .single();

    if (bizError || !business) {
      setError(bizError?.message ?? "Failed to create business");
      return;
    }

    // Add owner as member
    await supabase.from("business_members").insert({
      business_id: business.id,
      user_id: user.id,
      role: "owner",
    });

    // Seed default categories based on business type
    const defaultCats = DEFAULT_CATEGORIES[data.business_type] ?? DEFAULT_CATEGORIES.retail;
    await supabase.from("categories").insert(
      defaultCats.map((c) => ({ business_id: business.id, name: c.name, color: c.color }))
    );

    router.push(`/${slug}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            VANTAGE
          </h1>
          <p className="text-green-200 mt-1 text-sm">
            Let&apos;s set up your business
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">
                Create your business
              </h2>
              <p className="text-slate-500 text-sm">
                You can add more businesses later
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Business Name *
              </label>
              <input
                {...register("name")}
                placeholder="e.g. Mama's Store"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Business Mode */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                What does your business do? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {BUSINESS_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setValue("business_type", mode.value)}
                    className={`p-4 border-2 rounded-xl text-left transition ${
                      selectedType === mode.value
                        ? "border-green-500 bg-green-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">{mode.icon}</div>
                    <div className={`font-semibold text-sm mb-1 ${selectedType === mode.value ? "text-green-700" : "text-[#0F172A]"}`}>
                      {mode.label}
                    </div>
                    <div className="text-xs text-slate-400 leading-snug">{mode.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Currency *
              </label>
              <select
                {...register("currency")}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition bg-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Country *
              </label>
              <input
                {...register("country")}
                placeholder="e.g. Nigeria"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              />
              {errors.country && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.country.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Business Phone{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                {...register("phone")}
                type="tel"
                placeholder="+234 800 000 0000"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Setting up..." : "Launch my business →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
