"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateBusinessSlug } from "@/lib/utils/slugify";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

const COUNTRY_OPTIONS = [
  { label: "Nigeria", flag: "🇳🇬", currency: "NGN" },
  { label: "Kenya",  flag: "🇰🇪", currency: "KES" },
];

const BUSINESS_TYPES = [
  { value: "retail",     label: "I sell products"  },
  { value: "service",    label: "I offer services" },
  { value: "restaurant", label: "Restaurant / Food" },
];

const WEEKLY_ORDERS = ["0-50", "51-100", "101-1000", "1001+"];

const STAFF_OPTIONS = ["None", "1-3", "4-5", "6-10", "11+"];

function Chip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-5 py-2.5 rounded-lg text-[14px] font-medium transition",
        selected ? "bg-[#1a9c38] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      )}
    >
      {label}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [country, setCountry] = useState(COUNTRY_OPTIONS[0]);
  const [businessType, setBusinessType] = useState("retail");
  const [weeklyOrders, setWeeklyOrders] = useState("");
  const [staffCount, setStaffCount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit() {
    if (!businessName.trim() || businessName.trim().length < 2) {
      setNameError("Enter your business name (at least 2 characters)");
      return;
    }
    setNameError(null);
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? "Business Owner",
      email: user.email!,
    });

    const slug = generateBusinessSlug(businessName.trim());
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .insert({
        owner_id: user.id,
        name: businessName.trim(),
        slug,
        business_type: businessType,
        currency: country.currency,
        country: country.label,
      })
      .select()
      .single();

    if (bizError || !business) {
      setError(bizError?.message ?? "Failed to create business");
      setIsSubmitting(false);
      return;
    }

    await supabase.from("business_members").insert({
      business_id: business.id,
      user_id: user.id,
      role: "owner",
      is_active: true,
    });

    const defaultCats = DEFAULT_CATEGORIES[businessType] ?? DEFAULT_CATEGORIES.retail;
    await supabase.from("categories").insert(
      defaultCats.map((c) => ({ business_id: business.id, name: c.name, color: c.color }))
    );

    router.push(`/${slug}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-5 pt-14 pb-10 overflow-auto">

      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-bold text-slate-900 leading-tight">
          You&apos;re almost done
        </h1>
        <p className="text-slate-400 text-[15px] mt-2">
          Tell us a little bit about your business.
        </p>
      </div>

      <div className="space-y-8">

        {/* Business Name */}
        <div>
          <input
            type="text"
            value={businessName}
            onChange={(e) => { setBusinessName(e.target.value); setNameError(null); }}
            placeholder="Business Name"
            autoComplete="organization"
            className="w-full h-11 px-4 border border-slate-200 rounded-[4px] text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a9c38] focus:border-transparent"
          />
          {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
        </div>

        {/* Country */}
        <div>
          <p className="text-[15px] font-semibold text-slate-900 mb-3">
            Where is your business situated?
          </p>
          <div className="flex gap-3">
            {COUNTRY_OPTIONS.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setCountry(c)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-medium transition",
                  country.label === c.label
                    ? "bg-[#1a9c38] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                <span>{c.flag}</span> {c.label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-slate-400 mt-2 leading-relaxed">
            This determines the currency your app will display. You can change it later.
          </p>
        </div>

        {/* Business type */}
        <div>
          <p className="text-[15px] font-semibold text-slate-900 mb-3">
            What does your business do?
          </p>
          <div className="flex flex-wrap gap-3">
            {BUSINESS_TYPES.map((t) => (
              <Chip
                key={t.value}
                label={t.label}
                selected={businessType === t.value}
                onClick={() => setBusinessType(t.value)}
              />
            ))}
          </div>
        </div>

        {/* Weekly orders */}
        <div>
          <p className="text-[15px] font-semibold text-slate-900 mb-3">
            How many orders do you get weekly?
          </p>
          <div className="flex flex-wrap gap-3">
            {WEEKLY_ORDERS.map((o) => (
              <Chip
                key={o}
                label={o}
                selected={weeklyOrders === o}
                onClick={() => setWeeklyOrders(weeklyOrders === o ? "" : o)}
              />
            ))}
          </div>
        </div>

        {/* Staff count */}
        <div>
          <p className="text-[15px] font-semibold text-slate-900 mb-3">
            How many staff do you have?
          </p>
          <div className="flex flex-wrap gap-3">
            {STAFF_OPTIONS.map((s) => (
              <Chip
                key={s}
                label={s}
                selected={staffCount === s}
                onClick={() => setStaffCount(staffCount === s ? "" : s)}
              />
            ))}
          </div>
        </div>

      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mt-6">{error}</div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full h-11 bg-[#1a9c38] hover:bg-green-700 text-white font-bold rounded-[4px] transition flex items-center justify-center gap-2 disabled:opacity-60 mt-10"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isSubmitting ? "Setting up..." : "Continue"}
      </button>

    </div>
  );
}
