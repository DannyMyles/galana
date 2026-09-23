import { ListPageSkeleton } from "@/components/shared/skeletons"

export default function Loading() {
  return <ListPageSkeleton kpis={3} tabs={true} rows={6} cols={6} />
}
