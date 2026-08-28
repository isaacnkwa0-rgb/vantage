"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AnimatedPopper() {
  return (
    <>
      <style>{`
        @keyframes pop-in {
          0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
          65%  { transform: scale(1.18) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes fly1 {
          0%   { transform: translate(0,0) rotate(0deg) scale(0); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translate(22px,-38px) rotate(50deg) scale(1); opacity: 0.85; }
        }
        @keyframes fly2 {
          0%   { transform: translate(0,0) rotate(0deg) scale(0); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translate(-18px,-42px) rotate(-35deg) scale(1); opacity: 0.85; }
        }
        @keyframes fly3 {
          0%   { transform: translate(0,0) scale(0); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translate(38px,-20px) rotate(70deg) scale(1); opacity: 0.8; }
        }
        @keyframes fly4 {
          0%   { transform: translate(0,0) scale(0); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translate(-32px,-16px) rotate(-55deg) scale(1); opacity: 0.8; }
        }
        @keyframes fly5 {
          0%   { transform: translate(0,0) scale(0); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translate(8px,-52px) rotate(20deg) scale(1); opacity: 0.9; }
        }
        @keyframes float-loop {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-7px); }
        }
        .popper-body { animation: pop-in 0.55s cubic-bezier(.34,1.56,.64,1) 0.1s both; }
        .float-loop  { animation: float-loop 3s ease-in-out 0.8s infinite; }
        .c1 { animation: fly1 0.7s ease-out 0.35s both; }
        .c2 { animation: fly2 0.7s ease-out 0.42s both; }
        .c3 { animation: fly3 0.7s ease-out 0.30s both; }
        .c4 { animation: fly4 0.7s ease-out 0.48s both; }
        .c5 { animation: fly5 0.7s ease-out 0.38s both; }
        .c6 { animation: fly1 0.7s ease-out 0.55s both; }
        .c7 { animation: fly4 0.7s ease-out 0.50s both; }
        .c8 { animation: fly3 0.7s ease-out 0.45s both; }
      `}</style>

      <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g className="c1"><rect x="120" y="38" width="9" height="9" rx="2" fill="#1a9c38" transform="rotate(20 120 38)" /></g>
        <g className="c2"><rect x="52" y="30" width="7" height="7" rx="1.5" fill="#0f6624" transform="rotate(-15 52 30)" /></g>
        <g className="c3"><rect x="138" y="62" width="6" height="12" rx="2" fill="#1a9c38" transform="rotate(40 138 62)" /></g>
        <g className="c4"><circle cx="42" cy="55" r="5" fill="#1a9c38" opacity="0.8" /></g>
        <g className="c5"><circle cx="105" cy="18" r="4" fill="#0f6624" opacity="0.9" /></g>
        <g className="c6"><rect x="155" y="48" width="6" height="6" rx="1" fill="#1a9c38" transform="rotate(60 155 48)" /></g>
        <g className="c7"><circle cx="35" cy="80" r="4" fill="#0f6624" opacity="0.7" /></g>
        <g className="c8"><path d="M50 42 Q40 32 44 22" stroke="#0f6624" strokeWidth="2.5" strokeLinecap="round" fill="none" /></g>
        <g className="c1" style={{ animationDelay: "0.45s" }}>
          <path d="M115 28 Q125 18 120 8" stroke="#1a9c38" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>

        <g className="popper-body float-loop" transform="translate(30, 55)">
          <path d="M10 110 L80 40 L100 60 L30 130 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="4" strokeLinejoin="round" />
          <path d="M45 95 L75 50" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
          <path d="M80 40 Q92 18 108 28" stroke="#1a9c38" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M100 60 Q122 54 117 36" stroke="#0f6624" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M90 50 Q102 32 97 16" stroke="#1a9c38" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="95" cy="30" r="6" fill="none" stroke="#1a9c38" strokeWidth="3" />
        </g>
      </svg>
    </>
  );
}

function SuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const slug = params.get("slug") ?? "";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center">

        <div className="mb-4">
          <AnimatedPopper />
        </div>

        <h1 className="text-[22px] font-bold text-slate-900 leading-snug mb-3">
          Congratulations! You&apos;ve Activated a 14 Day Free Trial.
        </h1>

        <p className="text-slate-500 text-[14px] leading-relaxed mb-10">
          Your account is set up and ready. Start managing your business smarter with Vantage.
        </p>

        <button
          onClick={() => router.push(`/${slug}/dashboard`)}
          className="w-full h-11 bg-[#1a9c38] hover:bg-green-700 text-white font-bold rounded-[4px] text-[15px] transition"
        >
          Start Exploring
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
