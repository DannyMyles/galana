import { ListPageSkeleton } from "@/components/shared/skeletons"

export default function Loading() {
  return <ListPageSkeleton tabs={true} rows={9} cols={6} actions={false} />
}
