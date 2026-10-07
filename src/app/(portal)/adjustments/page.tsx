import { auth } from "@/auth"
import { PageHeader } from "@/components/shared/page-header"
import { MiniTable } from "@/components/shared/mini-table"
import { StatusBadge, type PortalStatus } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { AdjustmentActions } from "@/components/adjustments/adjustment-actions"
import { AdjustmentRequestForm } from "@/components/adjustments/adjustment-request-form"
import { requirePermission } from "@/lib/rbac/guard"
import { listAdjustments, listGalanaCustomerNames, type AdjustmentRow } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"

export const dynamic = "force-dynamic"

const STATUS: Record<AdjustmentRow["status"], PortalStatus> = { "Pending Approval": "PENDING_APPROVAL", Approved: "APPROVED", Rejected: "REJECTED" }

export default async function AdjustmentsPage() {
  await requirePermission(["adjustments:view"])
  const session = await auth()
  const email = session!.user!.email as string
  const roles = (session?.user?.roles ?? []) as string[]
  const isMaker = roles.includes("FINANCE_MAKER") || roles.includes("SYSTEM_ADMIN")
  const isChecker = roles.includes("FINANCE_CHECKER") || roles.includes("SYSTEM_ADMIN")
  const rows = toPlain(await listAdjustments(email))
  const customers = isMaker ? await listGalanaCustomerNames() : []

  return (
    <div>
      <PageHeader title="Manual Adjustments" description="Wallet credits and debits, raised by a Finance Maker and decided by a Finance Checker. An approved credit adds to Jaguar's fuel wallet, and an approved debit takes from it." />
      {isMaker && <div className="mb-6"><AdjustmentRequestForm customers={customers} /></div>}
      <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
        <MiniTable<AdjustmentRow>
          rows={rows}
          empty="No adjustments yet."
          columns={[
            { header: "Reason", cell: (r) => r.reason },
            { header: "Customer", cell: (r) => r.customer },
            { header: "Direction", cell: (r) => r.direction },
            { header: "Amount", cell: (r) => <MoneyDisplay amount={r.amount} /> },
            { header: "Requested by", cell: (r) => r.requestedBy },
            { header: "Status", cell: (r) => <StatusBadge status={STATUS[r.status]} /> },
            {
              header: "Decision",
              cell: (r) =>
                isChecker && r.status === "Pending Approval" && r.requestedBy !== email ? <AdjustmentActions requestId={r.id} /> : (
                  <span className="text-xs text-muted-foreground">{r.status === "Pending Approval" ? "Waiting for a checker" : r.decidedBy ?? "—"}</span>
                ),
            },
          ]}
        />
      </div>
    </div>
  )
}
