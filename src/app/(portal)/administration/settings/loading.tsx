import { CardSkeleton, HeaderSkeleton } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <HeaderSkeleton actions={false} />
      <div className="grid gap-5 lg:grid-cols-2">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
      </div>
    </div>
  )
}
