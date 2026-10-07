import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { PageHeader } from "@/components/shared/page-header"
import { MiniTable } from "@/components/shared/mini-table"
import { MoneyDisplay } from "@/components/shared/money-display"
import { ApprovalActions } from "@/components/wallet/approval-actions"
import { listTopUps, type TopUpRow } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"

export const dynamic = "force-dynamic"

export default async function ApprovalsPage() {
  const session = await auth()
  const roles = (session?.user?.roles ?? []) as string[]
  if (!roles.includes("FINANCE_CHECKER") && !roles.includes("SYSTEM_ADMIN")) redirect("/funding-wallet")
  const rows = toPlain(await listTopUps(session!.user!.email as string, "Pending Approval"))
  return (
    <div>
      <PageHeader title="Top-up approvals" description="Requests waiting for a decision. You cannot decide a request you made." />
      <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
        <MiniTable<TopUpRow>
          rows={rows}
          empty="No requests are waiting for approval."
          columns={[
            { header: "Reference", cell: (r) => <span className="font-semibold">{r.reference}</span> },
            { header: "Customer", cell: (r) => r.customer },
            { header: "Amount", cell: (r) => <MoneyDisplay amount={r.amount} /> },
            { header: "Requested by", cell: (r) => r.requestedBy },
            { header: "Remarks", cell: (r) => r.remarks ?? "—" },
            { header: "Decision", cell: (r) => (r.requestedBy === session!.user!.email ? <span className="text-xs text-muted-foreground">Your request</span> : <ApprovalActions requestId={r.id} />) },
          ]}
        />
      </div>
    </div>
  )
}
