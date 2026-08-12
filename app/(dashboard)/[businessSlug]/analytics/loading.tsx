import { Skeleton, SkeletonCard, TopBarSkeleton } from "@/components/ui/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#F7F9FC]">
      <TopBarSkeleton title="Analytics" />
      <div className="flex-1 p-4 sm:p-6 max-w-screen-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i}>
              <Skeleton className="h-2.5 w-20 mb-3 opacity-60" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-5 w-16 rounded-full mt-2" />
            </SkeletonCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonCard className="lg:col-span-2">
            <Skeleton className="h-4 w-36 mb-4" />
            <Skeleton className="h-[280px] w-full rounded-lg" />
          </SkeletonCard>
          <SkeletonCard>
            <Skeleton className="h-4 w-28 mb-4" />
            <Skeleton className="h-[280px] w-full rounded-lg" />
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}
