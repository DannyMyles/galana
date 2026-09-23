import { CardSkeleton, HeaderSkeleton, KpiSkeletons } from "@/components/shared/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <HeaderSkeleton actions={false} />
      <Skeleton className="mb-5 h-11 w-96 max-w-full rounded-2xl" />
      <KpiSkeletons count={4} />
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
      </div>
    </div>
  )
}
