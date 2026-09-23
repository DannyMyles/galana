import { Skeleton } from "@/components/ui/skeleton"

export default function PortalLoading() {
  return (
    <div className="w-full" aria-busy="true" aria-label="Loading">
      <div className="pb-7">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full rounded-lg" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-2xl" />
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl xl:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
