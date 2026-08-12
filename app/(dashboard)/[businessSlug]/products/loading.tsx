import { Skeleton, TopBarSkeleton, PageHeaderSkeleton } from "@/components/ui/Skeleton";

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <Skeleton className="h-2 w-12 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2.5 w-20 opacity-60" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export default function ProductsLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#F7F9FC]">
      <TopBarSkeleton title="Products" />
      <div className="flex-1 p-4 sm:p-6 max-w-screen-2xl mx-auto w-full">
        <PageHeaderSkeleton />

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg" />
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
