import { Skeleton, SkeletonCard, SkeletonText, TopBarSkeleton } from "@/components/ui/Skeleton";

function KpiCardSkeleton() {
  return (
    <SkeletonCard>
      <div className="flex items-start justify-between mb-3">
        <SkeletonText className="w-28" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-7 w-32 mt-1" />
      <SkeletonText className="w-24 mt-2 opacity-60" />
    </SkeletonCard>
  );
}

function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-50">
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-2.5 w-16 opacity-60" />
      </div>
      <Skeleton className="hidden sm:block h-5 w-14 rounded-full" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="hidden sm:block h-3 w-10 opacity-60" />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#F7F9FC]">
      <TopBarSkeleton title="Dashboard" />

      <div className="flex-1 p-4 sm:p-6 space-y-5 max-w-screen-2xl mx-auto w-full">
        {/* Header */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-36 opacity-60" />
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-3 w-52 opacity-60" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="hidden sm:block h-9 w-32" />
            <Skeleton className="hidden sm:block h-9 w-32" />
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>

        {/* Revenue chart */}
        <SkeletonCard>
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1.5">
              <SkeletonText className="w-28 opacity-60" />
              <Skeleton className="h-7 w-36" />
              <SkeletonText className="w-20 opacity-50" />
            </div>
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </SkeletonCard>

        {/* Health + Inventory row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard>
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20 opacity-60" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <SkeletonText className="w-28" />
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-2.5 w-24 opacity-60" />
                  </div>
                </div>
              ))}
            </div>
          </SkeletonCard>

          <SkeletonCard>
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-24 opacity-60" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>

        {/* Transactions + Products */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2.5 w-24 opacity-60" />
              </div>
              <Skeleton className="h-3 w-16 opacity-60" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => <TransactionRowSkeleton key={i} />)}
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-14 opacity-60" />
            </div>
            <div className="divide-y divide-slate-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-1 w-full rounded-full opacity-40" />
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-2.5 w-10 opacity-60" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
