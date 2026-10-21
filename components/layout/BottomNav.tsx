"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, ShoppingCart, Box, Package, Package2, Users, CircleEllipsis, Crown, Award,
  LayoutDashboard, ClipboardList,
  ActivitySquare, Megaphone, Receipt,
  BarChart3, TrendingUp, Settings, FileText, FilePen, Ticket, Target, Truck,
  CalendarDays, Globe, Gift, Share2,
  RefreshCw, Barcode, Thermometer, BellRing, Landmark, Wallet,
  ChevronRight, ChevronDown, Store, MapPin, Plus, X, Check, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBusinessStore } from "@/store/businessStore";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  label: string;
  serviceLabel?: string;
  icon: LucideIcon;
  href: string;
  retailOnly?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  retailOnly?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: "sales",
    label: "SALES",
    items: [
      { label: "Transactions", icon: ClipboardList, href: "sales" },
      { label: "Invoices", icon: FileText, href: "invoices" },
      { label: "Quotation", icon: FilePen, href: "quotes" },
      { label: "Discounts", icon: Ticket, href: "discounts" },
    ],
  },
  {
    id: "catalog",
    label: "CATALOG",
    items: [
      { label: "Bundles", icon: Package2, href: "bundles", retailOnly: true },
    ],
  },
  {
    id: "customers",
    label: "CUSTOMERS",
    items: [
      { label: "Campaigns", icon: Megaphone, href: "campaigns" },
      { label: "Referrals", icon: Share2, href: "referrals" },
      { label: "Gift Cards", icon: Gift, href: "gift-cards" },
    ],
  },
  {
    id: "inventory",
    label: "INVENTORY",
    retailOnly: true,
    items: [
      { label: "Suppliers", icon: Truck, href: "suppliers" },
      { label: "Store Orders", icon: Globe, href: "store-orders" },
    ],
  },
  {
    id: "finance",
    label: "FINANCE",
    items: [
      { label: "Expenses", icon: Receipt, href: "expenses" },
      { label: "Bank Accounts", icon: Landmark, href: "bank-accounts" },
    ],
  },
  {
    id: "insights",
    label: "INSIGHTS",
    items: [
      { label: "Reports", icon: BarChart3, href: "reports" },
      { label: "Milestones & Targets", icon: Target, href: "targets" },
    ],
  },
  {
    id: "operations",
    label: "OPERATIONS",
    items: [
      { label: "Appointments", icon: CalendarDays, href: "appointments" },
      { label: "Payroll", icon: Wallet, href: "payroll" },
    ],
  },
  {
    id: "system",
    label: "SYSTEM",
    items: [
      { label: "Settings", icon: Settings, href: "settings" },
      { label: "Activity", icon: ActivitySquare, href: "activity" },
    ],
  },
];

const BOTTOM_TABS = [
  { label: "Home",      icon: Home,         href: "dashboard" },
  { label: "Sales",     icon: ShoppingCart, href: "pos"       },
  { label: "Products",  icon: Box,          href: "products"  },
  { label: "Customers", icon: Users,        href: "customers" },
] as const;

function MorePage({ slug, onClose }: { slug: string; onClose: () => void }) {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const isService = activeBusiness?.business_type === "service";

  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(NAV_SECTIONS.map((s) => s.id))
  );
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>("");
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const { selectedLocationId, setSelectedLocation } = useBusinessStore();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single()
        .then(({ data }) => {
          if (data) {
            setProfileAvatar(data.avatar_url);
            setProfileName(data.full_name ?? "");
          }
        });
    });
  }, []);

  useEffect(() => {
    if (!activeBusiness?.id) return;
    const supabase = createClient();
    supabase.from("locations").select("id, name").eq("business_id", activeBusiness.id).eq("is_active", true).order("name")
      .then(({ data }) => setLocations(data ?? []));
  }, [activeBusiness?.id]);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);
  const locationLabel = selectedLocation?.name ?? "Headquarters";

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleSections = NAV_SECTIONS.filter((s) => !(s.retailOnly && isService));
  const avatarInitial = (profileName || activeBusiness?.name || "?")[0].toUpperCase();

  return (
    /* Covers full viewport except the bottom nav (h-16 = 64px) */
    <div className="fixed inset-x-0 top-0 z-50 bg-white flex flex-col overflow-hidden" style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}>
      {/* Mint hero — profile only */}
      <div className="bg-[#FDE3D9] px-4 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
            {profileAvatar ? (
              <img src={profileAvatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-ember">{avatarInitial}</span>
            )}
          </div>
          {/* Name + business */}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-slate-900 truncate">
              {profileName || (activeBusiness?.name ?? "")}
            </p>
            {profileName && activeBusiness?.name && (
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{activeBusiness.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {activeBusiness?.subscription_tier === "free" && (
        <div className="px-4 pt-3 pb-5 flex-shrink-0">
          <Link
            href={`/${slug}/settings?tab=billing`}
            onClick={onClose}
            className="flex items-center gap-3 bg-primary-soft rounded-[8px] px-4 py-5 active:bg-[#FCD0C0] transition-colors"
          >
            <Award className="w-6 h-6 text-ember flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Upgrade to Starter</p>
              <p className="text-xs text-slate-500 mt-0.5">Unlock the full benefits of Stokka</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 space-y-3 pt-3">

        {/* Branch / location picker */}
        <button
          onClick={() => setShowLocationSheet(true)}
          className="w-full flex items-center gap-3 bg-white rounded-[8px] px-4 h-11 border border-slate-200 active:bg-slate-50 transition-colors mb-6"
        >
          <Store className="w-5 h-5 text-ember flex-shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left text-[14px] font-medium text-slate-800">{locationLabel}</span>
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
        </button>

        {/* Location bottom sheet */}
        {showLocationSheet && (
          <div
            className="fixed inset-0 z-[60] bg-black/40 flex items-end"
            onClick={() => setShowLocationSheet(false)}
          >
            <div
              className="w-full bg-white rounded-t-2xl px-5 pt-5 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[16px] font-bold text-slate-900">Select Branch</h3>
                <button onClick={() => setShowLocationSheet(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Headquarters (all branches) */}
              <button
                onClick={() => { setSelectedLocation(null); setShowLocationSheet(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl mb-1 transition-colors ${!selectedLocationId ? "bg-primary-soft" : "hover:bg-slate-50 active:bg-slate-100"}`}
              >
                <Store className="w-5 h-5 text-ember flex-shrink-0" />
                <span className={`flex-1 text-left text-[14px] font-medium ${!selectedLocationId ? "text-ember" : "text-slate-700"}`}>Headquarters</span>
                {!selectedLocationId && <Check className="w-4 h-4 text-ember flex-shrink-0" />}
              </button>

              {/* Other branches */}
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => { setSelectedLocation(loc.id); setShowLocationSheet(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl mb-1 transition-colors ${selectedLocationId === loc.id ? "bg-primary-soft" : "hover:bg-slate-50 active:bg-slate-100"}`}
                >
                  <MapPin className="w-5 h-5 text-ember flex-shrink-0" />
                  <span className={`flex-1 text-left text-[14px] font-medium ${selectedLocationId === loc.id ? "text-ember" : "text-slate-700"}`}>{loc.name}</span>
                  {selectedLocationId === loc.id && <Check className="w-4 h-4 text-ember flex-shrink-0" />}
                </button>
              ))}

              {/* Add new branch */}
              <Link
                href={`/${slug}/settings?tab=locations`}
                onClick={() => { setShowLocationSheet(false); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-slate-200 mt-2 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <Plus className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span className="text-[14px] font-medium text-slate-500">Add new branch</span>
              </Link>
            </div>
          </div>
        )}

        {/* Nav sections */}
        {visibleSections.map((section) => {
          const items = section.items.filter((item) => !(item.retailOnly && isService));
          if (!items.length) return null;
          const isOpen = openSections.has(section.id);

          return (
            <div key={section.id}>
              {/* Section label — outside the card */}
              <button
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between px-1 mb-2 focus-visible:outline-none"
              >
                <span className="text-[14px] font-bold uppercase tracking-[0.12em] text-slate-900">
                  {section.label}
                </span>
                <svg
                  aria-hidden="true"
                  width="11" height="6" viewBox="0 0 11 6"
                  fill="currentColor"
                  className={cn(
                    "text-slate-400 transition-transform duration-200 flex-shrink-0",
                    !isOpen && "-rotate-90"
                  )}
                >
                  <path d="M0 0L5.5 6L11 0Z" />
                </svg>
              </button>

              {/* Items card */}
              {isOpen && <div className="bg-surface rounded-xl overflow-hidden">
              {items.map((item, i) => {
                const label = isService && item.serviceLabel ? item.serviceLabel : item.label;
                const href = `/${slug}/${item.href}`;
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-4 py-[18px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ember active:bg-slate-50",
                      i > 0 && "border-t border-slate-100"
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "w-5 h-5 flex-shrink-0",
                        isActive ? "text-ember" : "text-primary"
                      )}
                    />

                    {/* Label */}
                    <span className="flex-1 text-[14px] font-medium text-slate-700">
                      {label}
                    </span>

                    {/* Chevron */}
                    <ChevronRight
                      aria-hidden="true"
                      className="w-4 h-4 text-slate-300 flex-shrink-0"
                    />
                  </Link>
                );
              })}
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BottomNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const [showMore, setShowMore] = useState(false);

  const isService = activeBusiness?.business_type === "service";
  const posLabel = isService ? "Services" : "Sales";
  const customersLabel = isService ? "Clients" : "Customers";

  // Close when the user navigates to any route
  useEffect(() => {
    setShowMore(false);
  }, [pathname]);

  return (
    <>
      {showMore && <MorePage slug={slug} onClose={() => setShowMore(false)} />}

      <nav
        aria-label="Main navigation"
        className="bottom-nav fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-slate-200 flex flex-col"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Fixed-height row so safe-area padding never squashes the icons */}
        <div className="h-16 flex items-stretch w-full">
        {BOTTOM_TABS.map((tab) => {
          const href = `/${slug}/${tab.href}`;
          const isActive = !showMore && (pathname === href || pathname.startsWith(`${href}/`));
          const Icon = tab.icon;
          const label =
            tab.href === "pos"       ? posLabel
            : tab.href === "customers" ? customersLabel
            : tab.href === "products"  && isService ? "Services"
            : tab.label;

          return (
            <Link
              key={tab.href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ember",
                isActive ? "text-ember-deep" : "text-slate-500 active:text-slate-700"
              )}
            >
              <Icon
                aria-hidden="true"
                className="w-7 h-7"
              />
              <span className={cn("text-[12px] font-normal leading-none", isActive ? "text-ember-deep" : "text-slate-500")}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* More */}
        <button
          onClick={() => setShowMore((v) => !v)}
          aria-label="Open full navigation menu"
          aria-expanded={showMore}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ember",
            showMore ? "text-ember-deep" : "text-slate-400 active:text-slate-600"
          )}
        >
          <CircleEllipsis
            aria-hidden="true"
            className="w-7 h-7"
          />
          <span className={cn("text-[12px] font-normal leading-none", showMore ? "text-ember-deep" : "text-slate-400")}>
            More
          </span>
        </button>
        </div>
      </nav>
    </>
  );
}
