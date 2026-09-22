import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/rbac/roles"
import { PageHeader } from "@/components/shared/page-header"
import { WalletSubNav } from "@/components/wallet/wallet-subnav"
import { PendingApprovalsTable } from "@/components/wallet/pending-approvals-table"
import { getTopUpRequests } from "@/lib/data/wallet"

export default async function TopupApprovalsPage() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "wallet:topup:approve")) {
    redirect("/funding-wallet")
  }

  const requests = await getTopUpRequests("PENDING_APPROVAL")

  return (
    <div>
      <PageHeader
        title="Pending Top-up Requests"
        description="Review and approve wallet funding submitted by Finance Makers"
      />
      <WalletSubNav />
      <PendingApprovalsTable rows={requests} currentUserId={session.user.id} />
    </div>
  )
}
