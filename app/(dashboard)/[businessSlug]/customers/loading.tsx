import { Skeleton, SkeletonRow, TopBarSkeleton, PageHeaderSkeleton } from "@/components/ui/Skeleton";

export default function CustomersLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#F7F9FC]">
      <TopBarSkeleton title="Customers" />
      <div className="flex-1 p-4 sm:p-6 max-w-screen-2xl mx-auto w-full">
        <PageHeaderSkeleton />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <Skeleton className="h-2.5 w-24 opacity-60" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
            <Skeleton className="h-8 w-52 rounded-lg" />
            <div className="ml-auto">
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
          {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} cols={4} />)}
        </div>
      </div>
    </div>
  );
}
