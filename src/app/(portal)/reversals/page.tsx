import { PageHeader } from "@/components/shared/page-header"
import { ReversalsTable } from "@/components/reversals/reversals-table"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"
import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"

export default async function ReversalsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission(["reversals:request", "reversals:approve", "reversals:view"])
  const { status } = await searchParams
  const rows = await prisma.transactionReversal.findMany({
    where: status ? { status: status as "APPROVED" } : undefined,
    include: { transaction: { select: { id: true, reference: true, totalAmount: true } }, requestedBy: { select: { name: true } }, decidedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <PageHeader title="Reversals" description="Approved reversals restore the wallet balance, the ticket entitlement and the dealer settlement (US-TXN-011, US-FIN-005)." />
      <ReversalsTable rows={toPlain(rows)} canApprove={hasPermission(user.roles, "reversals:approve")} currentUserId={user.id} />
    </div>
  )
}
