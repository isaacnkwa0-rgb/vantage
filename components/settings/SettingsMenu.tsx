"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Building2, Tag, MapPin, Users, Printer, Globe,
  CreditCard, ChevronRight, LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useBusinessStore } from "@/store/businessStore";

interface Business {
  name: string;
  slug: string;
  logo_url: string | null;
}

interface Props {
  business: Business;
  businessSlug: string;
}

const SECTIONS = [
  {
    label: "BUSINESS",
    items: [
      { key: "business", label: "Business Profile", icon: Building2 },
      { key: "categories", label: "Categories", icon: Tag },
      { key: "locations", label: "Locations", icon: MapPin },
    ],
  },
  {
    label: "TEAM",
    items: [
      { key: "staff", label: "Staff & Roles", icon: Users },
    ],
  },
  {
    label: "SALES",
    items: [
      { key: "receipt", label: "Receipt & Invoice", icon: Printer },
    ],
  },
  {
    label: "ONLINE STORE",
    items: [
      { key: "store", label: "Store Settings", icon: Globe },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { key: "billing", label: "Billing & Plan", icon: CreditCard },
    ],
  },
];

export function SettingsMenu({ business, businessSlug }: Props) {
  const router = useRouter();
  const { clearBusiness } = useBusinessStore();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearBusiness();
    router.push("/login");
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-[#f5f5f5]">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 via-green-400 to-transparent" />
        <div className="flex items-center px-4 h-14">
          <div className="flex-1" />
          <p className="text-base font-bold text-[#0F172A]">{business.name}</p>
          <div className="flex-1 flex justify-end">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
              {business.logo_url ? (
                <Image src={business.logo_url} alt={business.name} width={40} height={40} className="object-cover w-full h-full rounded-full" />
              ) : (
                <span className="text-base font-bold text-slate-400">{business.name[0]?.toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable menu */}
      <div className="flex-1 overflow-auto pb-12">
        {SECTIONS.map((section) => (
          <div key={section.label} className="px-4 mt-5">
            <p className="text-[11px] font-bold text-[#0F172A] tracking-widest mb-2 px-1 uppercase">{section.label}</p>
            <div className="bg-white rounded-2xl overflow-hidden">
              {section.items.map((item, idx) => (
                <Link
                  key={item.key}
                  href={`/${businessSlug}/settings?tab=${item.key}`}
                  className={`flex items-center gap-4 px-4 py-[15px] hover:bg-slate-50 active:bg-slate-100 transition ${
                    idx !== section.items.length - 1 ? "border-b border-slate-100" : ""
                  }`}
                >
                  <item.icon className="w-5 h-5 text-[#1a9c38] flex-shrink-0" />
                  <span className="flex-1 text-[#1a1a1a] text-[15px]">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Sign Out */}
        <div className="px-4 mt-5">
          <div className="bg-white rounded-2xl overflow-hidden">
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-4 py-[15px] w-full hover:bg-red-50 active:bg-red-100 transition"
            >
              <LogOut className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="flex-1 text-left text-red-500 text-[15px] font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
