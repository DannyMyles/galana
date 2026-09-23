import { CardSkeleton, HeaderSkeleton, KpiSkeletons, TableSkeleton } from "@/components/shared/skeletons"

export default function PortalLoading() {
  return (
    <div className="w-full" aria-busy="true" aria-label="Loading">
      <HeaderSkeleton actions={false} />
      <KpiSkeletons count={4} />
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <CardSkeleton className="h-80 xl:col-span-2" lines={6} />
        <CardSkeleton className="h-80" lines={5} />
      </div>
      <div className="mt-5"><TableSkeleton rows={4} cols={5} /></div>
    </div>
  )
}
