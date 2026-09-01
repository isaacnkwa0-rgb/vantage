"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  businessSlug: string;
}

export function NotificationsHeader({ businessSlug }: Props) {
  const router = useRouter();
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0 relative">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 via-green-400 to-transparent pointer-events-none" />
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="p-2 -ml-1 rounded-lg text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 transition"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h2 className="text-base font-bold text-[#0F172A] flex-1 min-w-0 truncate">Notifications</h2>
    </header>
  );
}
