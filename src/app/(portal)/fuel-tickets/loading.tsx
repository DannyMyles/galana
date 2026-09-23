import { ListPageSkeleton } from "@/components/shared/skeletons"

export default function Loading() {
  return <ListPageSkeleton rows={8} cols={6} actions={false} />
}
