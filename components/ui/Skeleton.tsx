import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3", className)} />;
}

export function SkeletonCard({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-5", className)}>
      {children}
    </div>
  );
}

// TopBar skeleton — mirrors the real TopBar height + structure
export function TopBarSkeleton({ title }: { title: string }) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0">
      <div className="w-8 h-8 lg:hidden" /> {/* hamburger placeholder */}
      <p className="text-base font-bold text-[#0F172A] flex-1">{title}</p>
      <Skeleton className="hidden sm:block h-8 w-28" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
    </header>
  );
}

// A single table row skeleton
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-50"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2.5 w-20 opacity-60" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

// A list-page header (title + search + add button)
export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48 opacity-60" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}
