import Link from "next/link"
import { Plus, Wallet, Clock, CheckCircle2 } from "@/components/icons"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/rbac/roles"
import { PageHeader } from "@/components/shared/page-header"
import { WalletSubNav } from "@/components/wallet/wallet-subnav"
import { KpiCard } from "@/components/shared/kpi-card"
import { Button } from "@/components/ui/button"
import { MoneyDisplay } from "@/components/shared/money-display"
import { FundingHistoryTable } from "@/components/wallet/funding-history-table"
import { getPrimaryWallet, getTopUpRequests } from "@/lib/data/wallet"

export default async function FundingWalletPage() {
  const session = await auth()
  const [wallet, requests] = await Promise.all([getPrimaryWallet(), getTopUpRequests()])

  const canCreate = session?.user ? hasPermission(session.user.roles, "wallet:topup:create") : false

  return (
    <div>
      <PageHeader
        title="Funding & Wallet"
        description={`${wallet.customer.name} fuel wallet`}
        actions={
          canCreate ? (
            <Button render={<Link href="/funding-wallet/topup" />} nativeButton={false}>
              <Plus className="size-4" />
              Top up Request
            </Button>
          ) : undefined
        }
      />
      <WalletSubNav />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Fuel Wallet Balance"
          value={<MoneyDisplay amount={Number(wallet.balance)} />}
          icon={Wallet}
          iconTint="blue"
        />
        <KpiCard
          label="Pending Requests"
          value={requests.filter((r) => r.status === "PENDING_APPROVAL").length.toString()}
          icon={Clock}
          iconTint="amber"
        />
        <KpiCard
          label="Approved (All Time)"
          value={requests.filter((r) => r.status === "APPROVED").length.toString()}
          icon={CheckCircle2}
          iconTint="emerald"
        />
      </div>

      <FundingHistoryTable rows={requests} />
    </div>
  )
}
