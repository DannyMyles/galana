import { ListPageSkeleton } from "@/components/shared/skeletons"

export default function Loading() {
  return <ListPageSkeleton kpis={3} filters={false} rows={7} cols={6} />
}
