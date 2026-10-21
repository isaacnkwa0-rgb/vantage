"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { X } from "lucide-react";

const COUNTRIES = [
  { name: "Nigeria",      flag: "🇳🇬", code: "NG" },
  { name: "Ghana",        flag: "🇬🇭", code: "GH" },
  { name: "South Africa", flag: "🇿🇦", code: "ZA" },
  { name: "Kenya",        flag: "🇰🇪", code: "KE" },
];

const NAV_LINKS = [
  { label: "POS Sales",  href: "/register" },
  { label: "Inventory",  href: "/register" },
  { label: "Invoices",   href: "/register" },
  { label: "Customers",  href: "/register" },
  { label: "Pricing",    href: "/pricing"  },
];

export function HomeNav() {
  const [country, setCountry]         = useState(COUNTRIES[0]);
  const [showCountry, setShowCountry] = useState(false);
  const [showMenu, setShowMenu]       = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#EADFD2] px-5 py-3 flex items-center justify-between">
        <Logo size={28} />

        <div className="flex items-center gap-2">
          {/* Country dropdown — Catlog-style */}
          <div className="relative">
            <button
              onClick={() => { setShowCountry((v) => !v); setShowMenu(false); }}
              className="flex items-center gap-1.5 bg-[#FFF6EC] border border-[#EADFD2] rounded-full px-3 py-1.5"
              aria-label="Select country"
            >
              <span className="text-[16px] leading-none">{country.flag}</span>
              <span className="text-[12px] font-medium text-slate-700 hidden sm:inline">{country.name}</span>
              <svg
                width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"
                className={`transition-transform duration-150 ${showCountry ? "rotate-180" : ""}`}
              >
                <path d="M1 1L5 5L9 1" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {showCountry && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#EADFD2] rounded-[12px] shadow-lg overflow-hidden w-44 z-50">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => { setCountry(c); setShowCountry(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-left text-[13px] font-medium transition-colors
                      ${c.code === country.code
                        ? "bg-primary-soft text-primary"
                        : "text-slate-700 hover:bg-[#FFF6EC]"}`}
                  >
                    <span className="text-[18px]">{c.flag}</span>
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hamburger — Catlog-style */}
          <button
            onClick={() => { setShowMenu((v) => !v); setShowCountry(false); }}
            aria-label={showMenu ? "Close menu" : "Open menu"}
            className="flex flex-col justify-center items-center gap-[5px] w-9 h-9 rounded-full bg-[#FFF6EC] border border-[#EADFD2] flex-shrink-0"
          >
            <span className={`block w-4 h-[1.5px] bg-slate-700 transition-all duration-200 origin-center ${showMenu ? "rotate-45 translate-y-[6.5px]" : ""}`} />
            <span className={`block w-4 h-[1.5px] bg-slate-700 transition-all duration-200 ${showMenu ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`block w-4 h-[1.5px] bg-slate-700 transition-all duration-200 origin-center ${showMenu ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Full-screen mobile menu */}
      {showMenu && (
        <div className="fixed inset-0 z-40 bg-white flex flex-col pt-20 px-6">
          <button
            onClick={() => setShowMenu(false)}
            className="absolute top-4 right-5 p-2"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>

          <nav className="flex flex-col gap-1 mb-8">
            {NAV_LINKS.map((lnk) => (
              <Link
                key={lnk.label}
                href={lnk.href}
                onClick={() => setShowMenu(false)}
                className="text-[20px] font-semibold text-slate-800 py-3.5 border-b border-slate-100"
              >
                {lnk.label}
              </Link>
            ))}
          </nav>

          <div className="space-y-3">
            <Link
              href="/register"
              onClick={() => setShowMenu(false)}
              className="flex w-full items-center justify-center bg-primary rounded-[12px] font-bold text-white text-[15px]"
              style={{ height: "52px" }}
            >
              Get Started. It&apos;s Free
            </Link>
            <Link
              href="/login"
              onClick={() => setShowMenu(false)}
              className="flex w-full items-center justify-center border border-[#EADFD2] rounded-[12px] font-semibold text-slate-700 text-[15px]"
              style={{ height: "52px" }}
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
