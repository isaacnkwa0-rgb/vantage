"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Popper() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Confetti pieces */}
      <rect x="108" y="18" width="8" height="8" rx="2" fill="#1a9c38" transform="rotate(20 108 18)" />
      <rect x="130" y="38" width="6" height="6" rx="1.5" fill="#0f6624" transform="rotate(-15 130 38)" />
      <rect x="118" y="55" width="5" height="10" rx="2" fill="#1a9c38" transform="rotate(40 118 55)" />
      <circle cx="140" cy="28" r="4" fill="#1a9c38" opacity="0.7" />
      <circle cx="125" cy="14" r="3" fill="#0f6624" opacity="0.8" />
      <rect x="92" y="10" width="7" height="4" rx="2" fill="#1a9c38" transform="rotate(-30 92 10)" />
      <rect x="145" y="60" width="5" height="5" rx="1" fill="#1a9c38" transform="rotate(60 145 60)" />
      <circle cx="150" cy="45" r="3" fill="#0f6624" />

      {/* Squiggly lines (confetti streamers) */}
      <path d="M100 22 Q108 16 104 10" stroke="#1a9c38" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M128 48 Q136 40 132 32" stroke="#0f6624" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M142 70 Q150 62 146 54" stroke="#1a9c38" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Dots */}
      <circle cx="86" cy="22" r="3" fill="#1a9c38" opacity="0.5" />
      <circle cx="155" cy="75" r="3.5" fill="#1a9c38" opacity="0.6" />

      {/* Party popper body */}
      <g transform="translate(20, 50) rotate(-30, 55, 70)">
        {/* Cone */}
        <path
          d="M10 110 L80 40 L100 60 L30 130 Z"
          fill="none"
          stroke="#1e293b"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Inner cone detail */}
        <path
          d="M45 95 L75 50"
          stroke="#1e293b"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.3"
        />
        {/* Explosion burst */}
        <path
          d="M80 40 Q90 20 105 30"
          stroke="#1a9c38"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M100 60 Q120 55 115 38"
          stroke="#1a9c38"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M90 50 Q100 35 95 20"
          stroke="#0f6624"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Burst dot */}
        <circle cx="92" cy="32" r="5" fill="none" stroke="#1a9c38" strokeWidth="3" />
      </g>
    </svg>
  );
}

function SuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const slug = params.get("slug") ?? "";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Illustration */}
        <div className="mb-8">
          <Popper />
        </div>

        {/* Heading */}
        <h1 className="text-[22px] font-bold text-slate-900 leading-snug mb-3">
          Congratulations! You&apos;ve Activated a 14 Day Free Trial.
        </h1>

        {/* Subtext */}
        <p className="text-slate-500 text-[14px] leading-relaxed mb-10">
          Your trial account has been set up &amp; you&apos;re a few steps away from launching your business.
        </p>

        {/* Primary button */}
        <button
          onClick={() => router.push(`/${slug}/dashboard`)}
          className="w-full h-12 bg-[#1a9c38] hover:bg-green-700 text-white font-bold rounded-[4px] text-[15px] transition mb-3"
        >
          Start Exploring
        </button>

        {/* Secondary button */}
        <button
          onClick={() => router.push(`/${slug}/dashboard`)}
          className="w-full h-12 border border-[#1a9c38] rounded-[4px] text-[15px] font-semibold text-[#1a9c38] hover:bg-[#ecf7f1] transition"
        >
          Explore The App
        </button>
      </div>
    </div>
  );
}

export default function SuccessPageWrapper() {
  return (
    <Suspense>
      <SuccessPage />
    </Suspense>
  );
}
