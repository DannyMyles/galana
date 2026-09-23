import { PageHeader } from "@/components/shared/page-header"
import { AdjustmentsView } from "@/components/adjustments/adjustments-view"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"
import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"

export default async function AdjustmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission(["adjustments:create", "adjustments:approve", "adjustments:view"])
  const { status } = await searchParams
  const rows = await prisma.manualAdjustment.findMany({
    where: status ? { status: status as "APPROVED" } : undefined,
    include: { maker: { select: { name: true } }, checker: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <PageHeader title="Manual Adjustments" description="Every manual change to the fuel wallet, who requested it, who approved it and why (US-AUD-004)." />
      <AdjustmentsView rows={toPlain(rows)} canCreate={hasPermission(user.roles, "adjustments:create")} canApprove={hasPermission(user.roles, "adjustments:approve")} currentUserId={user.id} />
    </div>
  )
}
