import { ListPageSkeleton } from "@/components/shared/skeletons"

export default function Loading() {
  return <ListPageSkeleton tabs={true} filters={false} rows={4} cols={3} />
}
