"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Users, Building2, Loader2, UserMinus, Mail, Upload, MapPin, Plus, Pencil, ToggleLeft, ToggleRight, Tag, Trash2, Star } from "lucide-react";

interface Business {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  currency: string;
  business_type: string;
  subscription_tier: string;
  logo_url: string | null;
  tax_enabled: boolean;
  tax_rate: number;
  tax_name: string;
  loyalty_enabled: boolean | null;
  loyalty_points_per_dollar: number | null;
  loyalty_redemption_rate: number | null;
}

interface Member {
  id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  location_id: string | null;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface Location {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

const ROLE_BADGES = ["owner", "manager", "cashier", "viewer"] as const;

const ROLE_SUMMARIES: Record<string, string> = {
  owner: "Full access — billing, staff, and all data",
  manager: "Manage products, customers, expenses and reports",
  cashier: "POS sales and customer lookup only",
  viewer: "Read-only — reports and analytics",
};

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
  "#F97316", "#6366F1", "#14B8A6", "#64748B",
];

interface Props {
  business: Business;
  members: Member[];
  locations: Location[];
  categories: Category[];
  currentUserId: string;
}

const bizSchema = z.object({
  name: z.string().min(2, "Required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().min(2, "Required"),
  currency: z.string().min(3, "Required"),
});
type BizForm = z.infer<typeof bizSchema>;

const CURRENCIES = ["NGN", "USD", "GHS", "KES", "ZAR", "GBP", "EUR", "XOF", "XAF"];

export function SettingsClient({ business, members, locations: initialLocations, categories: initialCategories, currentUserId }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"business" | "categories" | "locations" | "staff">("business");
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(business.logo_url);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [taxEnabled, setTaxEnabled] = useState(business.tax_enabled ?? false);
  const [taxRate, setTaxRate] = useState((business.tax_rate ?? 0).toString());
  const [taxName, setTaxName] = useState(business.tax_name ?? "VAT");
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(business.loyalty_enabled ?? false);
  const [loyaltyPtsPerDollar, setLoyaltyPtsPerDollar] = useState((business.loyalty_points_per_dollar ?? 1).toString());
  const [loyaltyRedemptionRate, setLoyaltyRedemptionRate] = useState((business.loyalty_redemption_rate ?? 100).toString());

  // Locations state
  const [locationsList, setLocationsList] = useState<Location[]>(initialLocations);
  const [newLoc, setNewLoc] = useState({ name: "", address: "", phone: "" });
  const [addingLoc, setAddingLoc] = useState(false);
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [editLoc, setEditLoc] = useState({ name: "", address: "", phone: "" });

  // Staff invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("cashier");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<BizForm>({
    resolver: zodResolver(bizSchema),
    defaultValues: {
      name: business.name,
      email: business.email ?? "",
      phone: business.phone ?? "",
      address: business.address ?? "",
      city: business.city ?? "",
      country: business.country,
      currency: business.currency,
    },
  });

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setLogoError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `logos/${business.id}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true });
    if (error) {
      setLogoError("Upload failed. Please try again.");
    } else if (data) {
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
      await supabase.from("businesses").update({ logo_url: urlData.publicUrl }).eq("id", business.id);
    }
    setUploadingLogo(false);
  }

  async function saveBusiness(data: BizForm) {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("businesses").update({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      country: data.country,
      currency: data.currency,
      tax_enabled: taxEnabled,
      tax_rate: parseFloat(taxRate) || 0,
      tax_name: taxName || "VAT",
      loyalty_enabled: loyaltyEnabled,
      loyalty_points_per_dollar: parseInt(loyaltyPtsPerDollar) || 1,
      loyalty_redemption_rate: parseInt(loyaltyRedemptionRate) || 100,
    }).eq("id", business.id);
    setSaving(false);
    router.refresh();
  }

  const [locError, setLocError] = useState<string | null>(null);

  // Category state
  const [categoriesList, setCategoriesList] = useState<Category[]>(initialCategories);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [addingCat, setAddingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // --- Location handlers ---
  async function addLocation() {
    if (!newLoc.name.trim()) return;
    setAddingLoc(true);
    setLocError(null);
    const supabase = createClient();
    const { data, error } = await supabase.from("locations").insert({
      business_id: business.id,
      name: newLoc.name.trim(),
      address: newLoc.address.trim() || null,
      phone: newLoc.phone.trim() || null,
    }).select().single();
    if (error) {
      setLocError(error.message);
    } else if (data) {
      setLocationsList((prev) => [...prev, data as Location]);
      setNewLoc({ name: "", address: "", phone: "" });
    }
    setAddingLoc(false);
  }

  function startEditLoc(loc: Location) {
    setEditingLocId(loc.id);
    setEditLoc({ name: loc.name, address: loc.address ?? "", phone: loc.phone ?? "" });
  }

  async function saveEditLoc(id: string) {
    const supabase = createClient();
    await supabase.from("locations").update({
      name: editLoc.name.trim(),
      address: editLoc.address.trim() || null,
      phone: editLoc.phone.trim() || null,
    }).eq("id", id);
    setLocationsList((prev) =>
      prev.map((l) => l.id === id ? { ...l, name: editLoc.name, address: editLoc.address || null, phone: editLoc.phone || null } : l)
    );
    setEditingLocId(null);
  }

  async function toggleLocationActive(loc: Location) {
    const supabase = createClient();
    await supabase.from("locations").update({ is_active: !loc.is_active }).eq("id", loc.id);
    setLocationsList((prev) =>
      prev.map((l) => l.id === loc.id ? { ...l, is_active: !loc.is_active } : l)
    );
  }

  // --- Category handlers ---
  async function addCategory() {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    setCatError(null);
    const supabase = createClient();
    const { data, error } = await supabase.from("categories").insert({
      business_id: business.id,
      name: newCatName.trim(),
      color: newCatColor,
    }).select().single();
    if (error) {
      setCatError(error.message);
    } else if (data) {
      setCategoriesList((prev) => [...prev, data as Category].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCatName("");
      setNewCatColor(PRESET_COLORS[0]);
    }
    setAddingCat(false);
  }

  async function deleteCategory(id: string) {
    const supabase = createClient();
    await supabase.from("categories").delete().eq("id", id);
    setCategoriesList((prev) => prev.filter((c) => c.id !== id));
  }

  // --- Staff handlers ---
  async function inviteStaff() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: business.id, email: inviteEmail.trim(), role: inviteRole }),
    });
    setInviteEmail("");
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 4000);
    setInviting(false);
  }

  async function removeMember(memberId: string) {
    setRemovingId(memberId);
    const supabase = createClient();
    await supabase.from("business_members").update({ is_active: false }).eq("id", memberId);
    router.refresh();
    setRemovingId(null);
  }

  async function changeRole(memberId: string, role: string) {
    const supabase = createClient();
    await supabase.from("business_members").update({ role }).eq("id", memberId);
    router.refresh();
  }

  async function changeStaffLocation(memberId: string, locationId: string) {
    const supabase = createClient();
    await supabase.from("business_members").update({
      location_id: locationId || null,
    }).eq("id", memberId);
    router.refresh();
  }

  const tabs = [
    { key: "business", label: "Business Profile", icon: Building2 },
    { key: "categories", label: "Categories", icon: Tag },
    { key: "locations", label: "Locations", icon: MapPin },
    { key: "staff", label: "Staff & Roles", icon: Users },
  ];

  return (
    <div className="flex-1 p-3 sm:p-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition flex-shrink-0 ${
              tab === t.key ? "bg-white text-[#0F172A] shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="w-4 h-4 flex-shrink-0" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Business Profile ─── */}
      {tab === "business" && (
        <form onSubmit={handleSubmit(saveBusiness)} className="max-w-lg space-y-4">
          {/* Logo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-[#0F172A]">Business Logo</h3>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-green-500 hover:underline font-medium">
                  {uploadingLogo ? "Uploading..." : logoUrl ? "Change logo" : "Upload logo"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                </label>
                <p className="text-xs text-slate-400 mt-1">PNG or JPG, recommended 200×200px</p>
                {logoError && <p className="text-xs text-red-500 mt-1">{logoError}</p>}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-[#0F172A]">Business Information</h3>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Business Name *</label>
              <input {...register("name")} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Email</label>
                <input {...register("email")} type="email" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Phone</label>
                <input {...register("phone")} type="tel" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Address</label>
              <input {...register("address")} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">City</label>
                <input {...register("city")} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Country *</label>
                <input {...register("country")} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Currency *</label>
              <select {...register("currency")} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Tax / VAT */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#0F172A]">Tax / VAT</h3>
                <p className="text-xs text-slate-400 mt-0.5">Auto-calculated on every sale</p>
              </div>
              <button
                type="button"
                onClick={() => setTaxEnabled((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${taxEnabled ? "bg-green-600" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${taxEnabled ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            {taxEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Tax Label</label>
                  <input
                    value={taxName}
                    onChange={(e) => setTaxName(e.target.value)}
                    placeholder="e.g. VAT, GST, Sales Tax"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="e.g. 7.5"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-numeric"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Loyalty Program */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#0F172A] flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Loyalty Program
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Reward customers with points on every purchase</p>
              </div>
              <button
                type="button"
                onClick={() => setLoyaltyEnabled((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${loyaltyEnabled ? "bg-amber-500" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${loyaltyEnabled ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            {loyaltyEnabled && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Points per 1 currency spent</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={loyaltyPtsPerDollar}
                      onChange={(e) => setLoyaltyPtsPerDollar(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-numeric"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Points earned per unit spent</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Points needed for 1 unit off</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={loyaltyRedemptionRate}
                      onChange={(e) => setLoyaltyRedemptionRate(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-numeric"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Points needed to redeem 1 currency unit</p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                  Customers earn <strong>{loyaltyPtsPerDollar || 1} pt</strong> per unit spent and can redeem <strong>{loyaltyRedemptionRate || 100} pts</strong> for 1 unit off.
                </div>
              </>
            )}
          </div>

          {/* Subscription */}
          <div className="bg-[#0F172A] rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold capitalize">{business.subscription_tier} Plan</p>
                <p className="text-slate-400 text-sm mt-0.5">
                  {business.subscription_tier === "free" ? "Free forever" : "Active subscription"}
                </p>
              </div>
              <span className="px-3 py-1 bg-green-500 rounded-full text-xs font-semibold capitalize">
                {business.subscription_tier}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60 shadow-sm shadow-green-300/40"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      )}

      {/* ─── Categories ─── */}
      {tab === "categories" && (
        <div className="max-w-lg space-y-4">
          {/* Add category */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-[#0F172A] mb-4">Add Category</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Electronics, Clothing, Food..."
                  className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                />
                {/* Preview chip */}
                <div
                  className="flex-shrink-0 flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: newCatColor }}
                >
                  {newCatName || "Preview"}
                </div>
              </div>

              {/* Color swatches */}
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium">Choose a color</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor: newCatColor === color ? "#0F172A" : "transparent",
                        outline: newCatColor === color ? "2px solid white" : "none",
                        outlineOffset: "1px",
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={addCategory}
                disabled={addingCat || !newCatName.trim()}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-60 shadow-sm shadow-green-200"
              >
                {addingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {addingCat ? "Adding..." : "Add Category"}
              </button>
              {catError && <p className="text-xs text-red-500">{catError}</p>}
            </div>
          </div>

          {/* Categories list */}
          {categoriesList.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-[#0F172A]">Your Categories ({categoriesList.length})</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {categoriesList.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-3 px-5 py-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full text-white flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.name}
                    </span>
                    <span className="flex-1" />
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm font-medium">No categories yet</p>
              <p className="text-slate-400 text-xs mt-1">Categories you add will appear in the product form</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Locations ─── */}
      {tab === "locations" && (
        <div className="max-w-xl space-y-4">
          {/* Add location form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-[#0F172A] mb-4">Add New Location</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Branch / Shop Name *</label>
                <input
                  value={newLoc.name}
                  onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })}
                  placeholder="e.g. Main Store, Ikeja Branch"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Address</label>
                  <input
                    value={newLoc.address}
                    onChange={(e) => setNewLoc({ ...newLoc, address: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Phone</label>
                  <input
                    value={newLoc.phone}
                    onChange={(e) => setNewLoc({ ...newLoc, phone: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <button
                onClick={addLocation}
                disabled={addingLoc || !newLoc.name.trim()}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-60"
              >
                {addingLoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {addingLoc ? "Adding..." : "Add Location"}
              </button>
            </div>
            {locError && (
              <div className="mt-3 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{locError}</div>
            )}
          </div>

          {/* Existing locations */}
          {locationsList.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-[#0F172A]">Locations ({locationsList.length})</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {locationsList.map((loc) => (
                  <div key={loc.id} className="px-5 py-3">
                    {editingLocId === loc.id ? (
                      <div className="space-y-2">
                        <input
                          value={editLoc.name}
                          onChange={(e) => setEditLoc({ ...editLoc, name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={editLoc.address}
                            onChange={(e) => setEditLoc({ ...editLoc, address: e.target.value })}
                            placeholder="Address"
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <input
                            value={editLoc.phone}
                            onChange={(e) => setEditLoc({ ...editLoc, phone: e.target.value })}
                            placeholder="Phone"
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEditLoc(loc.id)}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingLocId(null)}
                            className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs transition hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${loc.is_active ? "text-[#0F172A]" : "text-slate-400 line-through"}`}>
                            {loc.name}
                          </p>
                          {(loc.address || loc.phone) && (
                            <p className="text-xs text-slate-400 truncate">
                              {[loc.address, loc.phone].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => startEditLoc(loc)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleLocationActive(loc)}
                            className={`p-1.5 rounded-lg transition ${loc.is_active ? "text-emerald-500 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"}`}
                            title={loc.is_active ? "Deactivate" : "Activate"}
                          >
                            {loc.is_active
                              ? <ToggleRight className="w-4 h-4" />
                              : <ToggleLeft className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {locationsList.length === 0 && (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm font-medium">No locations yet</p>
              <p className="text-slate-400 text-xs mt-1">Add your first branch or shop location above</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Staff & Roles ─── */}
      {tab === "staff" && (
        <div className="max-w-xl space-y-5">
          {/* Invite */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-[#0F172A] mb-3">Invite Staff Member</h3>
            {inviteSuccess && (
              <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-lg mb-3">
                Invitation sent! The staff member will receive an email with instructions.
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="staff@email.com"
                className="flex-1 min-w-0 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
              >
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                onClick={inviteStaff}
                disabled={inviting || !inviteEmail.trim()}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-60 shadow-sm shadow-green-300/40"
              >
                <Mail className="w-4 h-4" />
                {inviting ? "Sending..." : "Invite"}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">An email invitation will be sent to the staff member.</p>
          </div>

          {/* Staff list */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-[#0F172A]">Team Members ({members.length})</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {members.map((member) => {
                const isCurrentUser = member.profiles.id === currentUserId;
                const isOwner = member.role === "owner";
                return (
                  <div key={member.id} className="px-5 py-4 space-y-3">
                    {/* Name row */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">
                        {member.profiles.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate">
                          {member.profiles.full_name}
                          {isCurrentUser && <span className="text-slate-400 font-normal"> (you)</span>}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{member.profiles.email}</p>
                      </div>
                      {!isOwner && !isCurrentUser && (
                        <button
                          onClick={() => removeMember(member.id)}
                          disabled={removingId === member.id}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                          title="Remove member"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Role badge picker */}
                    <div className="pl-12 space-y-1.5">
                      <div className={`flex items-center gap-1.5 flex-wrap ${isOwner || isCurrentUser ? "opacity-50 pointer-events-none" : ""}`}>
                        {ROLE_BADGES.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => !isOwner && !isCurrentUser && changeRole(member.id, role)}
                            disabled={isOwner || isCurrentUser}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                              member.role === role
                                ? "bg-green-600 text-white border-green-600 shadow-sm shadow-green-200"
                                : "bg-white text-slate-500 border-slate-200 hover:border-green-400 hover:text-green-600"
                            }`}
                          >
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400">{ROLE_SUMMARIES[member.role]}</p>
                    </div>

                    {/* Location assignment */}
                    {locationsList.filter((l) => l.is_active).length > 0 && (
                      <div className="flex items-center gap-2 pl-12">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <select
                          value={member.location_id ?? ""}
                          onChange={(e) => changeStaffLocation(member.id, e.target.value)}
                          className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-green-400"
                        >
                          <option value="">All locations</option>
                          {locationsList.filter((l) => l.is_active).map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
