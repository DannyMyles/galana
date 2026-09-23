import { ListPageSkeleton } from "@/components/shared/skeletons"

export default function Loading() {
  return <ListPageSkeleton kpis={3} rows={6} cols={5} actions={false} />
}
