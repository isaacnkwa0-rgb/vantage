import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const FEATURES = ["POS Sales", "Invoices", "Inventory", "Expenses", "Customers", "Analytics"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FFF6EC] flex flex-col items-center px-5 pt-16 pb-14">

      {/* Logo */}
      <Logo size={52} className="mb-8" />

      {/* Hero — Catlog-style two-tone heading */}
      <h1 className="text-[38px] font-extrabold leading-[1.1] tracking-tight text-center text-slate-900 mb-4 max-w-xs">
        Run your business{" "}
        <span className="text-primary underline decoration-primary/40 underline-offset-4">
          like you mean it.
        </span>
      </h1>

      <p className="text-[15px] text-slate-500 text-center leading-relaxed mb-8 max-w-[280px]">
        POS, inventory, invoices, customers &amp; analytics — all in one place.
      </p>

      {/* Feature pills — Bumpa/Catlog-style scrollable chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {FEATURES.map((tag) => (
          <span
            key={tag}
            className="bg-white border border-[#EADFD2] text-[12px] font-medium text-slate-600 px-3 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* CTAs */}
      <div className="w-full max-w-sm space-y-3">
        <Link
          href="/register"
          className="flex w-full h-13 items-center justify-center rounded-[12px] bg-primary"
          style={{ height: "52px" }}
        >
          <span className="text-[15px] font-bold text-white">Get Started — It&apos;s Free</span>
        </Link>
        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-[12px] border border-[#EADFD2] bg-white"
          style={{ height: "52px" }}
        >
          <span className="text-[15px] font-semibold text-slate-700">Sign In</span>
        </Link>
      </div>

      {/* Tagline footer */}
      <p className="mt-10 text-[12px] text-slate-400 text-center">
        Trusted by businesses across Africa
      </p>
    </main>
  );
}
