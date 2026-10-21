import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const FEATURE_PILLS = ["POS Sales", "Invoices", "Inventory", "Expenses", "Customers", "Analytics"];

const FEATURES = [
  {
    title: "Record every sale instantly",
    body: "Use the built-in POS to ring up sales, accept cash, card or transfer, and print or share receipts — all from your phone.",
    bg: "bg-white",
    accent: "bg-primary-soft",
    tag: "Point of Sale",
  },
  {
    title: "Never run out of stock again",
    body: "Track inventory in real time, get low-stock alerts, and manage products across multiple locations with ease.",
    bg: "bg-[#FFF6EC]",
    accent: "bg-[#E8F5EC]",
    tag: "Inventory",
  },
  {
    title: "Send invoices & get paid faster",
    body: "Create professional invoices, share payment links, and track what's owed — all without leaving the app.",
    bg: "bg-white",
    accent: "bg-purple-50",
    tag: "Invoices",
  },
  {
    title: "Know your customers by name",
    body: "Build a customer database, track purchase history, manage credit balances, and run loyalty campaigns.",
    bg: "bg-[#FFF6EC]",
    accent: "bg-blue-50",
    tag: "Customers",
  },
];

const STATS = [
  { number: "10K+", label: "Businesses" },
  { number: "4.8★", label: "App rating" },
  { number: "₦0",   label: "To get started" },
];

export default function HomePage() {
  return (
    <div className="bg-white overflow-x-hidden">

      {/* ── Sticky nav ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#EADFD2] px-5 py-3 flex items-center justify-between">
        <Logo size={28} />
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-[13px] font-semibold text-slate-700 px-3 py-1.5">
            Sign In
          </Link>
          <Link href="/register" className="text-[13px] font-bold text-white bg-primary px-4 py-1.5 rounded-full">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-[#FFF6EC] px-5 pt-14 pb-12 text-center">
        {/* Pill badge — Catlog-style */}
        <div className="inline-flex items-center gap-2 bg-white border border-[#EADFD2] rounded-full px-3 py-1 mb-6">
          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
          <span className="text-[12px] font-medium text-slate-600">Built for African businesses</span>
        </div>

        {/* Two-tone heading — Catlog-style */}
        <h1 className="text-[40px] font-extrabold leading-[1.1] tracking-tight text-slate-900 mb-4">
          Run your business{" "}
          <span className="text-primary">like you mean it.</span>
        </h1>

        <p className="text-[16px] text-slate-500 leading-relaxed mb-8 max-w-[300px] mx-auto">
          POS, inventory, invoices, customers &amp; analytics — all in one app.
        </p>

        {/* Feature chips — Bumpa/Catlog scrollable pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar justify-start mb-8 -mx-5 px-5">
          {FEATURE_PILLS.map((tag) => (
            <span key={tag} className="flex-shrink-0 bg-white border border-[#EADFD2] text-[12px] font-medium text-slate-600 px-3 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-3 max-w-sm mx-auto">
          <Link href="/register" className="flex w-full items-center justify-center bg-primary rounded-[12px] font-bold text-white text-[15px]" style={{ height: "52px" }}>
            Get Started — It&apos;s Free
          </Link>
          <Link href="/login" className="flex w-full items-center justify-center bg-white border border-[#EADFD2] rounded-[12px] font-semibold text-slate-700 text-[15px]" style={{ height: "52px" }}>
            Sign In
          </Link>
        </div>

        {/* Download badges — Catlog/Bumpa style */}
        <p className="text-[12px] text-slate-400 mt-6 mb-3">Also available on</p>
        <div className="flex justify-center gap-3">
          {/* App Store */}
          <a
            href="#"
            className="flex items-center gap-2 bg-[#16130F] rounded-[10px] px-4 py-2.5"
            aria-label="Download on the App Store"
          >
            <svg width="18" height="22" viewBox="0 0 814 1000" fill="white" aria-hidden="true">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 376.8 45 355.2 45 345.4c0-177.3 115.4-271.6 228.7-271.6 60.7 0 111.3 39.8 149.7 39.8 36.5 0 93.5-42.4 162.9-42.4 13.1 0 108.2 1.3 170.5 82.6zm-160.2-181.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
            </svg>
            <div className="text-left">
              <p className="text-[9px] text-slate-300 leading-none">Download on the</p>
              <p className="text-[13px] font-bold text-white leading-tight">App Store</p>
            </div>
          </a>
          {/* Google Play */}
          <a
            href="#"
            className="flex items-center gap-2 bg-[#16130F] rounded-[10px] px-4 py-2.5"
            aria-label="Get it on Google Play"
          >
            <svg width="18" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M1.2 23.4c.4.2.8.3 1.3.1L14 12 9.6 7.6 1.2 23.4z"/>
              <path fill="#FBBC05" d="M21.7 10.1 17.6 7.8 13 12l4.6 4.2 4.1-2.3c1.2-.7 1.2-2.5 0-3.8z"/>
              <path fill="#4285F4" d="M2.5.5C2 .3 1.4.4 1 .8L13 12 17.6 7.8 2.5.5z"/>
              <path fill="#34A853" d="M1 23.2l12-11.2L9.6 7.6 1 23.2z" opacity=".01"/>
              <path fill="#34A853" d="M1.2.8C.8 1.2.5 1.8.5 2.5v19c0 .7.3 1.3.7 1.7L13 12 1.2.8z"/>
            </svg>
            <div className="text-left">
              <p className="text-[9px] text-slate-300 leading-none">Get it on</p>
              <p className="text-[13px] font-bold text-white leading-tight">Google Play</p>
            </div>
          </a>
        </div>
      </section>

      {/* ── Stats strip — Bumpa "Trusted by 54,000 SMEs" style ── */}
      <section className="bg-[#16130F] px-5 py-6">
        <div className="flex justify-around">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-[22px] font-extrabold text-white leading-none">{s.number}</p>
              <p className="text-[11px] text-[#CFC4B6] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dashboard screenshot — Bumpa-style proof section ── */}
      <section className="bg-[#FFF6EC] px-5 pt-12 pb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary mb-2">Your command centre</p>
        <h2 className="text-[28px] font-extrabold text-slate-900 leading-tight mb-4">
          Everything your business needs,{" "}
          <span className="text-primary">in one view.</span>
        </h2>
        <p className="text-[14px] text-slate-500 leading-relaxed mb-8">
          See your revenue, orders, inventory health and top products the moment you open the app.
        </p>
        {/* Mock dashboard card */}
        <div className="bg-white rounded-[20px] border border-[#EADFD2] shadow-[0_4px_24px_rgba(242,84,45,0.08)] overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[#F2542D] via-[#FBBCAA] to-[#FDE3D9]" />
          <div className="px-4 pt-4 pb-5">
            <p className="text-[11px] text-slate-400 font-medium">Total Revenue · This Month</p>
            <p className="text-[32px] font-extrabold text-slate-900 leading-none mt-1">₦840,000</p>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { n: "1,240", l: "Orders",   bg: "bg-primary-soft" },
                { n: "289",   l: "Products", bg: "bg-[#E8F5EC]"    },
                { n: "136",   l: "Customers",bg: "bg-amber-50"     },
                { n: "+12",   l: "New",      bg: "bg-blue-50"      },
              ].map((s) => (
                <div key={s.l} className={`${s.bg} rounded-[8px] py-2.5 flex flex-col items-center`}>
                  <p className="text-[15px] font-bold text-slate-900">{s.n}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { label: "New Sale",  color: "text-primary",    bg: "bg-primary-soft" },
                { label: "Products",  color: "text-blue-500",   bg: "bg-blue-50"      },
                { label: "Analytics", color: "text-violet-500", bg: "bg-purple-50"    },
                { label: "Expenses",  color: "text-amber-500",  bg: "bg-amber-50"     },
              ].map((a) => (
                <div key={a.label} className={`${a.bg} rounded-[8px] h-14 flex flex-col items-center justify-center gap-1`}>
                  <div className={`w-5 h-5 rounded-full ${a.bg} border-2 border-current ${a.color}`} />
                  <p className={`text-[9px] font-semibold ${a.color}`}>{a.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature sections — Catlog alternating bg ── */}
      {FEATURES.map((f, i) => (
        <section key={f.tag} className={`${f.bg} px-5 pt-12 pb-10`}>
          <span className={`inline-block ${f.accent} text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 px-3 py-1 rounded-full mb-4`}>
            {f.tag}
          </span>
          <h2 className="text-[26px] font-extrabold text-slate-900 leading-tight mb-3">
            {f.title}
          </h2>
          <p className="text-[14px] text-slate-500 leading-relaxed mb-6">
            {f.body}
          </p>
          <Link href="/register" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
            Get started →
          </Link>
        </section>
      ))}

      {/* ── Final CTA — Bumpa "Your Business Bestfriend" style ── */}
      <section className="bg-primary mx-4 mb-4 rounded-[20px] px-6 py-10 text-center">
        <h2 className="text-[28px] font-extrabold text-white leading-tight mb-3">
          Your business bestfriend.
        </h2>
        <p className="text-[14px] leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.75)" }}>
          Join thousands of businesses already running smarter with Stokka.
        </p>
        <Link href="/register" className="inline-flex items-center justify-center bg-white rounded-[12px] px-6 font-bold text-primary text-[15px]" style={{ height: "48px" }}>
          Start for free today
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#16130F] px-5 pt-10 pb-8">
        <Logo variant="inverted" size={28} className="mb-4" />
        <p className="text-[13px] text-[#CFC4B6] mb-6 leading-relaxed">
          The all-in-one business management app for modern African businesses.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { heading: "Product", links: [{ l: "POS", h: "/register" }, { l: "Invoices", h: "/register" }, { l: "Inventory", h: "/register" }, { l: "Pricing", h: "/pricing" }] },
            { heading: "Company",  links: [{ l: "Sign In", h: "/login" }, { l: "Register", h: "/register" }, { l: "Contact", h: "mailto:support@stokka.shop" }] },
          ].map((col) => (
            <div key={col.heading}>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B625A] mb-3">{col.heading}</p>
              <div className="space-y-2.5">
                {col.links.map((lnk) => (
                  <div key={lnk.l}>
                    <Link href={lnk.h} className="text-[14px] font-medium text-[#CFC4B6]">{lnk.l}</Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#6B625A]">© {new Date().getFullYear()} Stokka. All rights reserved.</p>
      </footer>

    </div>
  );
}
