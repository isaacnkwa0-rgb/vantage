"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateBusinessSlug } from "@/lib/utils/slugify";
import { Loader2, Info } from "lucide-react";
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
  { label: "Kenya", flag: "🇰🇪", currency: "KES" },
  { label: "Ghana", flag: "🇬🇭", currency: "GHS" },
  { label: "South Africa", flag: "🇿🇦", currency: "ZAR" },
];

const BUSINESS_TYPES = [
  { value: "retail", label: "I sell products" },
  { value: "service", label: "I offer services" },
  { value: "restaurant", label: "Restaurant / Food" },
];

const WEEKLY_ORDERS_CONFIG: Record<string, { label: string; options: string[] }> = {
  retail:     { label: "How many orders do you get weekly?",   options: ["0-50", "51-100", "101-1000", "1001+"] },
  service:    { label: "How many clients do you see weekly?",  options: ["0-50", "51-100", "101-1000", "1001+"] },
  restaurant: { label: "How many covers do you serve weekly?", options: ["0-100", "101-500", "501-2000", "2001+"] },
};

const STORE_LABEL: Record<string, string> = {
  retail:     "How many physical stores do you have?",
  service:    "How many locations do you operate from?",
  restaurant: "How many branches do you have?",
};

const CURRENCIES = ["Naira", "KES", "USD", "GBP", "CAD", "Others"];
const STAFF_OPTIONS = ["None", "1-3", "4-5", "6-10", "11+"];
const STORE_COUNTS = ["None", "1", "2", "3", "4+"];

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={selected ? { backgroundColor: "#ecf7f1" } : undefined}
      className={cn(
        "px-4 h-10 rounded-[4px] text-[14px] font-medium border transition",
        selected ? "border-[#1a9c38] text-slate-900" : "bg-[#F3F4F6] border-transparent text-slate-700 hover:bg-slate-200"
      )}
    >
      {label}
    </button>
  );
}

function CheckChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={selected ? { backgroundColor: "#ecf7f1" } : undefined}
      className={cn(
        "flex items-center gap-2 px-4 h-10 rounded-[4px] text-[14px] font-medium border transition",
        selected ? "border-[#1a9c38] text-slate-900" : "bg-[#F3F4F6] border-transparent text-slate-700 hover:bg-slate-200"
      )}
    >
      <span className={cn(
        "w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0",
        selected ? "border-[#1a9c38] bg-[#1a9c38]" : "border-slate-400 bg-transparent"
      )}>
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [country, setCountry] = useState(COUNTRY_OPTIONS[0]);
  const [businessType, setBusinessType] = useState("retail");
  const [weeklyOrders, setWeeklyOrders] = useState("");
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [staffCount, setStaffCount] = useState("");
  const [storeCount, setStoreCount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleCurrency(c: string) {
    setCurrencies((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

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

    const baseSlug = storeUrl || businessName.trim().toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
    const suffix = Math.random().toString(36).slice(2, 5);
    const slug = `${baseSlug}-${suffix}`;
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

    router.push(`/onboarding/plan?slug=${slug}`);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-auto px-5 pt-14 pb-32">

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-[22px] font-bold text-slate-900 leading-tight">
            You&apos;re almost done
          </h1>
          <p className="text-slate-400 text-[15px] mt-2">
            Tell us a little bit about your business.
          </p>
        </div>

        <div className="space-y-8">

          {/* Business Name + Store URL */}
          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  setNameError(null);
                  setStoreUrl(e.target.value.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, ""));
                }}
                placeholder="Business Name"
                autoComplete="organization"
                className="w-full h-10 px-4 border border-slate-300 rounded-[4px] text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a9c38] focus:border-transparent"
              />
              {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
            </div>
            <div className="flex items-center h-10 border border-slate-300 rounded-[4px] focus-within:ring-2 focus-within:ring-[#1a9c38] focus-within:border-transparent">
              <input
                type="text"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="Store URL"
                className="flex-1 min-w-0 px-4 h-full text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
              {storeUrl && <span className="pr-3 text-[14px] text-slate-400 select-none whitespace-nowrap shrink-0">.getvantage.app</span>}
            </div>
          </div>

          {/* Country */}
          <div>
            <p className="text-[15px] font-bold text-slate-900 mb-3">
              Where is your business situated?
            </p>
            <div className="flex gap-3 flex-wrap">
              {COUNTRY_OPTIONS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setCountry(c)}
                  style={country.label === c.label ? { backgroundColor: "#ecf7f1" } : undefined}
                  className={cn(
                    "flex items-center gap-2 px-5 h-10 rounded-[4px] text-[14px] font-medium border transition",
                    country.label === c.label
                      ? "border-[#1a9c38] text-slate-900"
                      : "bg-[#F3F4F6] border-transparent text-slate-700 hover:bg-slate-200"
                  )}
                >
                  <span>{c.flag}</span> {c.label}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-1.5 mt-2">
              <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-slate-400 leading-relaxed">
                This determines the currency on your app will display. You can change the currency on your website later.
              </p>
            </div>
          </div>

          {/* Business type */}
          <div>
            <p className="text-[15px] font-bold text-slate-900 mb-3">
              What does your business do?
            </p>
            <div className="flex flex-wrap gap-3">
              {BUSINESS_TYPES.map((t) => (
                <Chip
                  key={t.value}
                  label={t.label}
                  selected={businessType === t.value}
                  onClick={() => { setBusinessType(t.value); setWeeklyOrders(""); setStoreCount(""); }}
                />
              ))}
            </div>
          </div>

          {/* Weekly orders */}
          <div>
            <p className="text-[15px] font-bold text-slate-900 mb-3">
              {WEEKLY_ORDERS_CONFIG[businessType].label}
            </p>
            <div className="flex flex-wrap gap-3">
              {WEEKLY_ORDERS_CONFIG[businessType].options.map((o) => (
                <Chip
                  key={o}
                  label={o}
                  selected={weeklyOrders === o}
                  onClick={() => setWeeklyOrders(weeklyOrders === o ? "" : o)}
                />
              ))}
            </div>
          </div>

          {/* Currencies */}
          <div>
            <p className="text-[15px] font-bold text-slate-900 mb-0.5">
              What currencies do you receive payment in?
            </p>
            <p className="text-[13px] text-[#1a9c38] font-medium mb-3">(Select all that apply)</p>
            <div className="flex flex-wrap gap-3">
              {CURRENCIES.map((c) => (
                <CheckChip
                  key={c}
                  label={c}
                  selected={currencies.includes(c)}
                  onClick={() => toggleCurrency(c)}
                />
              ))}
            </div>
          </div>

          {/* Staff count */}
          <div>
            <p className="text-[15px] font-bold text-slate-900 mb-3">
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

          {/* Physical stores */}
          <div>
            <p className="text-[15px] font-bold text-slate-900 mb-3">
              {STORE_LABEL[businessType]}
            </p>
            <div className="flex flex-wrap gap-3">
              {STORE_COUNTS.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  selected={storeCount === s}
                  onClick={() => setStoreCount(storeCount === s ? "" : s)}
                />
              ))}
            </div>
          </div>

        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mt-6">{error}</div>
        )}
      </div>

      {/* Sticky Continue button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-5 py-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full h-11 bg-[#1a9c38] hover:bg-green-700 text-white text-[15px] font-bold rounded-[4px] transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Setting up..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
