import Link from "next/link"
import { Wallet, Clock, CheckCircle2 } from "@/components/icons"
import { PageHeader } from "@/components/shared/page-header"
import { WalletSubNav } from "@/components/wallet/wallet-subnav"
import { KpiCard } from "@/components/shared/kpi-card"
import { QueryTabs } from "@/components/shared/sub-nav"
import { MoneyDisplay } from "@/components/shared/money-display"
import { FundingHistoryTable } from "@/components/wallet/funding-history-table"
import { getPrimaryWallet, getTopUpRequests, type TopUpFilters } from "@/lib/data/wallet"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"
import { AddButton } from "@/components/shared/add-button"

export default async function FundingWalletPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission("wallet:view")
  const { status, search, scope } = await searchParams
  const canCreate = hasPermission(user.roles, "wallet:topup:create")
  const mine = canCreate && scope === "mine"

  const [wallet, requests, all] = await Promise.all([
    getPrimaryWallet(),
    getTopUpRequests({ status: status as TopUpFilters["status"], search, makerId: mine ? user.id : undefined }),
    getTopUpRequests(),
  ])

  return (
    <div>
      <PageHeader
        title="Funding & Wallet"
        description={`${wallet.customer.name} fuel wallet — the full prepaid amount is loaded; discounts are handled separately as credit notes.`}
        actions={canCreate ? <AddButton label="Top up request" render={<Link href="/funding-wallet/topup" />} nativeButton={false} /> : undefined}
      />
      <WalletSubNav />

      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <KpiCard label="Fuel wallet balance" value={<MoneyDisplay amount={Number(wallet.balance)} decimals={0} />} icon={Wallet} iconTint="blue" />
        <KpiCard label="Pending requests" value={all.filter((r) => r.status === "PENDING_APPROVAL").length.toString()} icon={Clock} iconTint="amber" />
        <KpiCard label="Approved (all time)" value={all.filter((r) => r.status === "APPROVED").length.toString()} icon={CheckCircle2} iconTint="emerald" />
      </div>

      {canCreate && <QueryTabs param="scope" tabs={[{ label: "All requests", value: "all" }, { label: "My requests", value: "mine" }]} />}
      <FundingHistoryTable rows={requests} />
    </div>
  )
}
