import { Skeleton, SkeletonRow, TopBarSkeleton, PageHeaderSkeleton } from "@/components/ui/Skeleton";

export default function SalesLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#F7F9FC]">
      <TopBarSkeleton title="Transactions" />
      <div className="flex-1 p-4 sm:p-6 max-w-screen-2xl mx-auto w-full">
        <PageHeaderSkeleton />

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <Skeleton className="h-2.5 w-20 opacity-60" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <div className="ml-auto">
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2 border-b border-slate-50">
            {["Date", "Customer", "Items", "Payment", "Amount"].map((h) => (
              <Skeleton key={h} className="h-2.5 w-16 opacity-40" />
            ))}
          </div>
          {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
        </div>
      </div>
    </div>
  );
}
