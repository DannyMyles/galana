import { ListPageSkeleton } from "@/components/shared/skeletons"

export default function Loading() {
  return <ListPageSkeleton filters={false} rows={5} cols={4} actions={false} />
}
