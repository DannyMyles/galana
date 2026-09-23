import { CardSkeleton, HeaderSkeleton } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <HeaderSkeleton actions={false} />
      <div className="mx-auto max-w-2xl"><CardSkeleton lines={6} /></div>
    </div>
  )
}
