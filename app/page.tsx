import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { HomeNav } from "@/components/home/HomeNav";

const MARQUEE_FEATURES = [
  {
    label: "Staff Accounts",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    label: "Invoice & Receipt",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
  },
  {
    label: "Manage Inventory",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    label: "Analytics",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    label: "Run Discounts",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
  },
  {
    label: "Receive Payments",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    label: "Multiple Locations",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    label: "POS Sales",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
  {
    label: "Customer Records",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];



export default function HomePage() {
  return (
    <div className="bg-white overflow-x-hidden">

      {/* ── Sticky nav ── */}
      <HomeNav />

      {/* ── Hero ── */}
      <section className="bg-[#FFF6EC] px-5 pt-12 pb-10 text-center">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-[#EADFD2] rounded-full px-3 py-1 mb-5">
          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
          <span className="text-[12px] font-medium text-slate-600">Built for African businesses</span>
        </div>

        {/* Left-aligned heading — Catlog-style */}
        <h1 className="text-[38px] font-extrabold leading-[1.1] tracking-tight text-slate-900 mb-4">
          Manage your business like you{" "}
          <span className="text-primary underline decoration-primary/40 underline-offset-4">mean business.</span>
        </h1>

        <p className="text-[15px] text-slate-500 leading-relaxed mb-6 max-w-[340px] mx-auto">
          Record every sale, track your stock, send invoices and know your customers. All from your phone.
        </p>

        {/* CTAs */}
        <div className="mb-8">
          {/* Single combined Download App button — Catlog-style */}
          <a
            href="#"
            className="flex w-full items-center justify-center gap-3 bg-primary rounded-[14px] mb-3"
            style={{ height: "54px" }}
            aria-label="Download App"
          >
            {/* Apple logo — white */}
            <svg width="15" height="20" viewBox="0 0 384 512" fill="white" style={{ display: "block" }} aria-hidden="true">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
            {/* Pipe divider */}
            <span style={{ display: "block", width: "1px", height: "28px", background: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
            {/* Google Play logo — white monochrome 4-section arrow */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ display: "block" }} aria-hidden="true">
              <path d="M1.571 23.664l10.531-10.501 3.144 3.143-10.201 5.892c-.505.274-2.273 1.038-3.474 1.466zm-1.571-21.9v19.728l10.025-9.993L0 1.764zm22.621 9.317l-3.369-1.945-3.7 3.694 3.7 3.694 3.369-1.945c.962-.555.962-2.944 0-3.498zM1.571.336C2.772.764 4.54 1.528 5.045 1.802l10.201 5.892-3.144 3.142z"/>
            </svg>
            <span className="text-[15px] font-bold text-white">Download App</span>
          </a>
          {/* Continue on web */}
          <Link
            href="/register"
            className="flex w-full items-center justify-center gap-1.5 text-[14px] font-semibold text-slate-700 border border-[#EADFD2] bg-white rounded-[14px]"
            style={{ height: "52px" }}
          >
            Continue on the web
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* Sliding feature pills — Bumpa-style marquee */}
        <div className="overflow-hidden -mx-5 mb-8">
          <div className="marquee-track flex gap-2 w-max">
            {[...MARQUEE_FEATURES, ...MARQUEE_FEATURES].map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 bg-white border border-[#EADFD2] text-slate-600 text-[12px] font-medium px-3 py-1.5 rounded-[8px] flex-shrink-0"
              >
                {f.icon}
                {f.label}
              </span>
            ))}
          </div>
        </div>

        {/* Hero store image */}
        <div className="rounded-[20px] border border-[#EADFD2] shadow-[0_4px_24px_rgba(242,84,45,0.08)] overflow-hidden">
          <img
            src="/hero-store.jpeg"
            alt="Business owner serving a customer in her cloth store"
            className="w-full object-cover object-top"
            style={{ aspectRatio: "1 / 1" }}
          />
        </div>

      </section>


      {/* ── Feature sections ── */}
      <div className="bg-[#FAF7F3] px-4 pt-6 pb-2 space-y-4">

        {/* Point of Sale */}
        <div className="bg-[#FFFAF5] rounded-[24px] px-5 pt-8 pb-8">
          <span className="inline-block bg-primary-soft text-primary text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full mb-4">Point of Sale</span>
          <h2 className="text-[26px] font-extrabold text-slate-900 leading-tight mb-3">Ring up any sale in seconds.</h2>
          <p className="text-[14px] text-slate-500 leading-relaxed mb-5">Tap to add items, pick cash, card or transfer, and share a receipt instantly. Works perfectly offline too.</p>
          <Link href="/register" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary mb-8">Get started →</Link>
          {/* 3D framed mockup */}
          <div className="relative" style={{ perspective: "1000px" }}>
            {/* Geometric depth shadow */}
            <div className="absolute inset-0 rounded-[18px] bg-primary/20 translate-x-3 translate-y-3" style={{ transform: "translateX(10px) translateY(10px) rotate(1deg)" }} />
            {/* Angled frame */}
            <div className="relative rounded-[14px] overflow-hidden border-[3px] border-primary shadow-[0_12px_40px_rgba(242,84,45,0.2)]"
              style={{ transform: "perspective(900px) rotateX(4deg) rotateY(-7deg)", willChange: "transform" }}>
              {/* Chrome bar */}
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#F0EBE3]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F2542D]/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFC93C]/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E8E5A]/80" />
                <span className="flex-1 ml-2 bg-white/60 rounded-[4px] text-[9px] text-slate-400 px-2 py-0.5 text-center">stokka.shop · New Sale</span>
              </div>
              <div className="bg-white">
                <div className="px-4 pt-3 pb-2 border-b border-[#EADFD2] flex items-center justify-between">
                  <span className="text-[13px] font-bold text-slate-900">New Sale</span>
                  <span className="text-[11px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full">₦12,500</span>
                </div>
                <div className="px-4 py-3 space-y-2.5">
                  {[
                    { name: "Ankara shirt",  qty: "×1", price: "₦4,500", img: "https://images.unsplash.com/photo-1768212565426-58b089b6386d?w=56&h=56&fit=crop&crop=center&auto=format" },
                    { name: "Ankara blouse", qty: "×2", price: "₦8,000", img: "https://images.unsplash.com/photo-1784123476705-f92b827da974?w=56&h=56&fit=crop&crop=center&auto=format" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-2.5">
                      <img src={item.img} alt={item.name} className="w-8 h-8 rounded-[6px] object-cover flex-shrink-0" />
                      <span className="flex-1 text-[13px] text-slate-600">{item.name} <span className="text-slate-400">{item.qty}</span></span>
                      <span className="text-[13px] font-semibold text-slate-900">{item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4 pt-1 flex gap-2">
                  <span className="flex-1 bg-primary text-white text-[12px] font-bold rounded-[8px] py-2.5 text-center">Cash</span>
                  <span className="flex-1 bg-[#FFF6EC] text-slate-600 text-[12px] font-semibold rounded-[8px] py-2.5 text-center">Card</span>
                  <span className="flex-1 bg-[#FFF6EC] text-slate-600 text-[12px] font-semibold rounded-[8px] py-2.5 text-center">Transfer</span>
                </div>
              </div>
            </div>
            {/* Floating notification */}
            <div className="absolute -bottom-3 -left-1 z-10 flex items-center gap-2 bg-white rounded-[12px] px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <div>
                <div className="text-[11px] font-bold text-slate-900 leading-tight">Sale recorded!</div>
                <div className="text-[10px] text-slate-400">₦12,500 · Cash</div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -top-3 -right-1 z-10 w-10 h-10 rounded-full bg-primary shadow-[0_4px_12px_rgba(242,84,45,0.4)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-[#EDF2FF] rounded-[24px] px-5 pt-8 pb-14">
          <span className="inline-block bg-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full mb-4">Inventory</span>
          <h2 className="text-[26px] font-extrabold text-slate-900 leading-tight mb-3">Always know what you have. Before it runs out.</h2>
          <p className="text-[14px] text-slate-500 leading-relaxed mb-5">Track stock in real time, get low-stock alerts before you run dry, and update quantities from anywhere.</p>
          <Link href="/register" className="inline-flex items-center gap-1 text-[13px] font-semibold text-blue-700 mb-8">Get started →</Link>

          {/* Phone mockup wrapper */}
          <div className="relative flex justify-center">
            {/* Geometric bg glow */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-44 h-64 bg-blue-300/25 rounded-[40px] -rotate-3" />

            {/* Phone frame — 3D perspective */}
            <div style={{ transform: "perspective(900px) rotateX(4deg) rotateY(-7deg)", willChange: "transform" }}>
              <div className="bg-[#1C1C1E] rounded-[36px] shadow-[0_24px_64px_rgba(0,0,0,0.32)]" style={{ width: "192px", padding: "3px" }}>
                <div className="bg-[#0A0A0A] rounded-[33px] overflow-hidden">

                  {/* Status bar */}
                  <div className="bg-white flex items-center justify-between px-4 pt-2.5 pb-0">
                    <span className="text-[10px] font-bold text-slate-900">9:41</span>
                    {/* Dynamic Island */}
                    <div className="w-[72px] h-[18px] bg-black rounded-full" />
                    <div className="flex items-center gap-[3px]">
                      <svg width="13" height="9" viewBox="0 0 13 9" fill="#1C1C1E" aria-hidden="true">
                        <rect x="0" y="5" width="2" height="4" rx="0.5"/>
                        <rect x="3" y="3" width="2" height="6" rx="0.5"/>
                        <rect x="6" y="1" width="2" height="8" rx="0.5"/>
                        <rect x="9" y="0" width="2" height="9" rx="0.5"/>
                      </svg>
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none" stroke="#1C1C1E" strokeWidth="1" aria-hidden="true">
                        <path d="M1 5.5C2.2 3.8 3.7 3 5.5 3s3.3.8 4.5 2.5M3 7c.7-.9 1.5-1.3 2.5-1.3S7.3 6.1 8 7"/>
                        <circle cx="5.5" cy="7.5" r="0.6" fill="#1C1C1E" stroke="none"/>
                      </svg>
                    </div>
                  </div>

                  {/* App header */}
                  <div className="bg-white px-3 pt-2 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-[12px] font-extrabold text-slate-900">Products</span>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3l2 2 2-2"/></svg>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/></svg>
                    </div>
                  </div>

                  {/* Search + filters */}
                  <div className="bg-[#F5F6F8] px-3 pt-1.5 pb-1">
                    <div className="bg-white border border-slate-200 rounded-[8px] px-2.5 py-1.5 flex items-center gap-1.5 mb-1.5">
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true"><circle cx="4" cy="4" r="2.5"/><path d="M6.5 6.5l1.5 1.5"/></svg>
                      <span className="text-[9px] text-slate-400">Search products...</span>
                    </div>
                    {/* Filter tabs */}
                    <div className="flex gap-1.5 overflow-hidden">
                      {[["All","active"],["Active",""],["Out of Stock",""]].map(([label, state]) => (
                        <span key={label} className={`text-[8px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${state === "active" ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-500"}`}>{label}</span>
                      ))}
                    </div>
                  </div>

                  {/* Product rows */}
                  <div className="bg-[#F5F6F8] px-3 pt-1.5 space-y-1.5">
                    {[
                      { name: "Ankara Fabric",  price: "₦2,500", stock: "Low: 3",       badge: "bg-amber-50 text-amber-600",    img: "https://images.unsplash.com/photo-1552710307-537199cd41c0?w=64&h=64&fit=crop&crop=center&auto=format"  },
                      { name: "Lace Material",  price: "₦5,000", stock: "Out of stock",  badge: "bg-red-50 text-red-500",        img: "https://images.unsplash.com/photo-1556379069-7c1b1b8990b0?w=64&h=64&fit=crop&crop=center&auto=format"  },
                      { name: "Chiffon Roll",   price: "₦1,800", stock: "24 in stock",   badge: "bg-primary-soft text-primary",  img: "https://images.unsplash.com/photo-1612353375223-e6acfa31ae71?w=64&h=64&fit=crop&crop=center&auto=format" },
                      { name: "Sequin Cloth",   price: "₦3,200", stock: "8 in stock",    badge: "bg-primary-soft text-primary",  img: "https://images.unsplash.com/photo-1784123476742-de48239d2fb0?w=64&h=64&fit=crop&crop=center&auto=format" },
                    ].map((p) => (
                      <div key={p.name} className="bg-white rounded-[8px] px-2.5 py-2 flex items-center gap-2">
                        <img src={p.img} alt={p.name} className="w-8 h-8 rounded-[6px] object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-semibold text-slate-800 truncate">{p.name}</div>
                          <div className="text-[9px] font-semibold text-slate-700">{p.price}</div>
                        </div>
                        <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${p.badge}`}>{p.stock}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom tab bar */}
                  <div className="bg-white border-t border-slate-100 flex items-center justify-around px-2 pt-2 pb-1 mt-1.5">
                    {[
                      { label: "Home",     active: false },
                      { label: "Products", active: true  },
                      { label: "POS",      active: false },
                      { label: "More",     active: false },
                    ].map((t) => (
                      <div key={t.label} className="flex flex-col items-center gap-0.5">
                        <div className={`w-3.5 h-3.5 rounded-[3px] ${t.active ? "bg-primary" : "bg-slate-200"}`} />
                        <span className={`text-[7px] font-medium ${t.active ? "text-primary" : "text-slate-300"}`}>{t.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Home indicator */}
                  <div className="bg-white flex justify-center pb-1.5 pt-0.5">
                    <div className="w-14 h-[3px] bg-black/20 rounded-full" />
                  </div>

                </div>
              </div>
            </div>

            {/* Floating notification — left side, overlapping phone */}
            <div className="absolute left-0 top-20 z-20 flex items-center gap-2 bg-white rounded-[12px] px-2.5 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.14)] border border-slate-100" style={{ width: "148px" }}>
              <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 text-white text-[11px] font-extrabold">!</span>
              <div>
                <div className="text-[10px] font-bold text-slate-900 leading-tight">Low stock alert</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Chiffon Roll · 1 left</div>
              </div>
            </div>

            {/* Floating badge — top right */}
            <div className="absolute -top-3 right-4 z-20 w-10 h-10 rounded-full bg-blue-500 shadow-[0_4px_14px_rgba(59,130,246,0.45)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-[#F3F0FF] rounded-[24px] px-5 pt-8 pb-8">
          <span className="inline-block bg-purple-100 text-purple-700 text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full mb-4">Invoices</span>
          <h2 className="text-[26px] font-extrabold text-slate-900 leading-tight mb-3">Send an invoice. Get paid today.</h2>
          <p className="text-[14px] text-slate-500 leading-relaxed mb-5">Create professional invoices in 30 seconds, share a payment link, and know exactly who owes what.</p>
          <Link href="/register" className="inline-flex items-center gap-1 text-[13px] font-semibold text-purple-700 mb-8">Get started →</Link>
          {/* 3D framed mockup */}
          <div className="relative" style={{ perspective: "1000px" }}>
            <div className="absolute inset-0 rounded-[18px] bg-purple-400/20" style={{ transform: "translateX(10px) translateY(10px) rotate(1deg)" }} />
            <div className="relative rounded-[14px] overflow-hidden border-[3px] border-purple-500 shadow-[0_12px_40px_rgba(168,85,247,0.2)]"
              style={{ transform: "perspective(900px) rotateX(4deg) rotateY(-7deg)", willChange: "transform" }}>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#F3F0FF]">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-purple-300/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500/80" />
                <span className="flex-1 ml-2 bg-white/60 rounded-[4px] text-[9px] text-slate-400 px-2 py-0.5 text-center">stokka.shop · Invoice #0042</span>
              </div>
              <div className="bg-white p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Invoice #0042</div>
                    <div className="text-[24px] font-extrabold text-slate-900 leading-none">₦85,000</div>
                  </div>
                  <span className="bg-green-50 text-green-700 text-[11px] font-bold px-3 py-1 rounded-[8px]">PAID</span>
                </div>
                <div className="text-[12px] text-slate-500 mb-3">To: <span className="font-semibold text-slate-700">Amaka Chukwu</span></div>
                <div className="space-y-1.5 text-[12px] border-t border-slate-100 pt-3 mb-3">
                  {[
                    { item: "Ankara set ×3", amount: "₦45,000",  img: "https://images.unsplash.com/photo-1768212566108-4ce4f329e4d2?w=56&h=56&fit=crop&crop=center&auto=format" },
                    { item: "Delivery",       amount: "₦5,000",  img: null },
                    { item: "Discount",       amount: "-₦5,000", img: null },
                  ].map(({ item, amount, img }) => (
                    <div key={item} className="flex items-center gap-2 text-slate-600">
                      {img
                        ? <img src={img} alt={item} className="w-7 h-7 rounded-[5px] object-cover flex-shrink-0" />
                        : <span className="w-7 h-7 flex-shrink-0" />}
                      <span className="flex-1">{item}</span>
                      <span className="font-semibold text-slate-800">{amount}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-purple-50 rounded-[8px] px-3 py-2 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Paid via</span>
                  <span className="text-[11px] font-semibold text-purple-700">Bank Transfer</span>
                </div>
              </div>
            </div>
            {/* Floating notification */}
            <div className="absolute -bottom-3 -left-1 z-10 flex items-center gap-2 bg-white rounded-[12px] px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <div>
                <div className="text-[11px] font-bold text-slate-900 leading-tight">Payment received!</div>
                <div className="text-[10px] text-slate-400">₦85,000 · Bank Transfer</div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -top-3 -right-1 z-10 w-10 h-10 rounded-full bg-purple-500 shadow-[0_4px_12px_rgba(168,85,247,0.4)] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-[#FFF8EC] rounded-[24px] px-5 pt-8 pb-8">
          <span className="inline-block bg-amber-100 text-amber-700 text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full mb-4">Customers</span>
          <h2 className="text-[26px] font-extrabold text-slate-900 leading-tight mb-3">Your best customers, always remembered.</h2>
          <p className="text-[14px] text-slate-500 leading-relaxed mb-5">Build a customer database, track purchase history, manage credit balances, and keep people coming back.</p>
          <Link href="/register" className="inline-flex items-center gap-1 text-[13px] font-semibold text-amber-700 mb-8">Get started →</Link>
          {/* 3D framed mockup */}
          <div className="relative" style={{ perspective: "1000px" }}>
            <div className="absolute inset-0 rounded-[18px] bg-amber-400/20" style={{ transform: "translateX(10px) translateY(10px) rotate(1deg)" }} />
            <div className="relative rounded-[14px] overflow-hidden border-[3px] border-amber-500 shadow-[0_12px_40px_rgba(245,158,11,0.2)]"
              style={{ transform: "perspective(900px) rotateX(4deg) rotateY(-7deg)", willChange: "transform" }}>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#FFF8EC]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="flex-1 ml-2 bg-white/60 rounded-[4px] text-[9px] text-slate-400 px-2 py-0.5 text-center">stokka.shop · Customers</span>
              </div>
              <div className="bg-white">
                <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-primary-soft flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-extrabold text-primary">AC</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate-900">Amaka Chukwu</div>
                    <div className="text-[11px] text-slate-400">12 purchases · ₦340,000</div>
                  </div>
                  <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">VIP</span>
                </div>
                <div className="px-4 py-3 space-y-2.5">
                  {[
                    { action: "Bought Ankara set", time: "2d ago",  img: "https://images.unsplash.com/photo-1790943780822-9918073fe9f1?w=56&h=56&fit=crop&crop=center&auto=format" },
                    { action: "Paid Invoice #0042", time: "1w ago",  img: null },
                    { action: "First purchase",     time: "3mo ago", img: null },
                  ].map((a) => (
                    <div key={a.action} className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2 text-slate-600">
                        {a.img
                          ? <img src={a.img} alt={a.action} className="w-6 h-6 rounded-[5px] object-cover flex-shrink-0" />
                          : <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                        {a.action}
                      </div>
                      <span className="text-slate-400 flex-shrink-0 ml-2">{a.time}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-3">
                  <span className="bg-[#FFF6EC] text-primary text-[11px] font-semibold px-3 py-1.5 rounded-[8px]">₦5,000 credit balance</span>
                </div>
              </div>
            </div>
            {/* Floating notification */}
            <div className="absolute -bottom-3 -left-1 z-10 flex items-center gap-2 bg-white rounded-[12px] px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <div>
                <div className="text-[11px] font-bold text-slate-900 leading-tight">New purchase!</div>
                <div className="text-[10px] text-slate-400">Amaka Chukwu · ₦45,000</div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -top-3 -right-1 z-10 w-10 h-10 rounded-full bg-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.4)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
        </div>

      </div>

      {/* ── Final CTA — Bumpa "Your Business Bestfriend" style ── */}
      <section className="bg-primary mx-4 mt-2 mb-4 rounded-[20px] px-6 py-10 text-center">
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
