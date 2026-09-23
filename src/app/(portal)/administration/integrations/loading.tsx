import { ListPageSkeleton } from "@/components/shared/skeletons"

export default function Loading() {
  return <ListPageSkeleton kpis={3} filters={false} rows={6} cols={4} actions={false} />
}
