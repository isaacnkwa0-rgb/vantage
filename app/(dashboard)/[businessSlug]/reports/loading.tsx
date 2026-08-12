import { Skeleton, SkeletonCard, TopBarSkeleton } from "@/components/ui/Skeleton";

export default function ReportsLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#F7F9FC]">
      <TopBarSkeleton title="Reports" />
      <div className="flex-1 p-4 sm:p-6 max-w-screen-2xl mx-auto w-full">
        {/* Period selector */}
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i}>
              <Skeleton className="h-2.5 w-24 mb-3 opacity-60" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-2.5 w-20 mt-2 opacity-50" />
            </SkeletonCard>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonCard key={i}>
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-[220px] w-full rounded-lg" />
            </SkeletonCard>
          ))}
        </div>

        {/* Table */}
        <SkeletonCard>
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
                <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-100">
                  <div className="skeleton h-full rounded-full" style={{ width: `${60 - i * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}
