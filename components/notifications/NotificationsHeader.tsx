"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  businessSlug: string;
}

export function NotificationsHeader({ businessSlug }: Props) {
  const router = useRouter();
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0 relative">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-ember via-green-400 to-transparent pointer-events-none" />
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="flex items-center gap-0.5 text-primary text-[15px] font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>
      <h2 className="text-base font-bold text-[#0F172A] flex-1 min-w-0 truncate">Notifications</h2>
    </header>
  );
}
