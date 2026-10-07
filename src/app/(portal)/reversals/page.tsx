import { auth } from "@/auth"
import { PageHeader } from "@/components/shared/page-header"
import { MiniTable } from "@/components/shared/mini-table"
import { StatusBadge, type PortalStatus } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { ReversalActions } from "@/components/reversals/reversal-actions"
import { ReversalRequestForm } from "@/components/reversals/reversal-request-form"
import { requirePermission } from "@/lib/rbac/guard"
import { listReversals, type ReversalRow } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"

export const dynamic = "force-dynamic"

const STATUS: Record<ReversalRow["status"], PortalStatus> = { "Pending Approval": "PENDING_APPROVAL", Approved: "APPROVED", Rejected: "REJECTED" }

export default async function ReversalsPage() {
  await requirePermission(["reversals:view"])
  const session = await auth()
  const email = session!.user!.email as string
  const roles = (session?.user?.roles ?? []) as string[]
  const isMaker = roles.some((r) => ["FINANCE_MAKER", "OPS_FUEL_CARD", "SYSTEM_ADMIN"].includes(r))
  const isChecker = roles.includes("FINANCE_CHECKER") || roles.includes("SYSTEM_ADMIN")
  const rows = toPlain(await listReversals(email))

  return (
    <div>
      <PageHeader title="Reversals" description="Requests to reverse a completed fuelling, raised by a maker and decided by a checker. An approved reversal gives the fuelling amount back to Jaguar's fuel wallet." />
      {isMaker && <div className="mb-6"><ReversalRequestForm /></div>}
      <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
        <MiniTable<ReversalRow>
          rows={rows}
          empty="No reversal requests yet."
          columns={[
            { header: "Transaction", cell: (r) => r.transaction },
            { header: "Customer", cell: (r) => r.customer },
            { header: "Amount", cell: (r) => <MoneyDisplay amount={r.amount} /> },
            { header: "Reason", cell: (r) => r.reason },
            { header: "Requested by", cell: (r) => r.requestedBy },
            { header: "Status", cell: (r) => <StatusBadge status={STATUS[r.status]} /> },
            {
              header: "Decision",
              cell: (r) =>
                isChecker && r.status === "Pending Approval" && r.requestedBy !== email ? <ReversalActions requestId={r.id} /> : (
                  <span className="text-xs text-muted-foreground">{r.status === "Pending Approval" ? "Waiting for a checker" : r.decidedBy ?? "—"}</span>
                ),
            },
          ]}
        />
      </div>
    </div>
  )
}
