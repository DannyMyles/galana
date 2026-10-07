import Link from "next/link"
import { auth } from "@/auth"
import { PageHeader } from "@/components/shared/page-header"
import { MiniTable } from "@/components/shared/mini-table"
import { StatusBadge, type PortalStatus } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { requirePermission } from "@/lib/rbac/guard"
import { listTopUps, type TopUpRow } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"
import { ApprovalActions } from "@/components/wallet/approval-actions"

export const dynamic = "force-dynamic"

const STATUS: Record<TopUpRow["status"], PortalStatus> = { "Pending Approval": "PENDING_APPROVAL", Approved: "APPROVED", Rejected: "REJECTED" }

export default async function FundingWalletPage() {
  await requirePermission(["wallet:view"])
  const session = await auth()
  const roles = (session?.user?.roles ?? []) as string[]
  const rows = toPlain(await listTopUps(session!.user!.email as string))
  const isMaker = roles.includes("FINANCE_MAKER") || roles.includes("SYSTEM_ADMIN")
  const isChecker = roles.includes("FINANCE_CHECKER") || roles.includes("SYSTEM_ADMIN")

  return (
    <div>
      <PageHeader
        title="Funding Wallet"
        description="Top-up requests for Jaguar's prepaid account. An approved top-up credits Jaguar's fuel wallet."
        actions={
          <div className="flex gap-2">
            {isMaker && <Link href="/funding-wallet/topup" className="rounded-lg bg-[#1226AA] px-4 py-2 text-sm font-medium text-white">New request</Link>}
            {isChecker && <Link href="/funding-wallet/approvals" className="rounded-lg border px-4 py-2 text-sm font-medium">Approvals</Link>}
          </div>
        }
      />
      <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
        <MiniTable<TopUpRow>
          rows={rows}
          empty="No top-up requests yet."
          columns={[
            { header: "Reference", cell: (r) => <Link href={`/funding-wallet/${r.id}`} className="font-semibold text-[#1226AA] hover:underline">{r.reference}</Link> },
            { header: "Customer", cell: (r) => r.customer },
            { header: "Amount", cell: (r) => <MoneyDisplay amount={r.amount} /> },
            { header: "Requested by", cell: (r) => r.requestedBy },
            { header: "Requested", cell: (r) => r.requestedAt.slice(0, 16) },
            { header: "Status", cell: (r) => <StatusBadge status={STATUS[r.status]} /> },
            {
              header: "Decision",
              cell: (r) =>
                isChecker && r.status === "Pending Approval" && r.requestedBy !== session!.user!.email ? (
                  <ApprovalActions requestId={r.id} />
                ) : r.status === "Pending Approval" ? (
                  <span className="text-xs text-muted-foreground">Waiting for a checker</span>
                ) : (
                  <span className="text-xs text-muted-foreground">{r.decidedBy ?? "—"}</span>
                ),
            },
          ]}
        />
      </div>
    </div>
  )
}
