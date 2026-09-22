import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/rbac/roles"
import { PageHeader } from "@/components/shared/page-header"
import { WalletSubNav } from "@/components/wallet/wallet-subnav"
import { TopupRequestForm } from "@/components/wallet/topup-request-form"
import { getFundingAccountOptions, getPrimaryWallet } from "@/lib/data/wallet"

export default async function TopupRequestPage() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "wallet:topup:create")) {
    redirect("/funding-wallet")
  }

  const [wallet, fundingAccounts] = await Promise.all([getPrimaryWallet(), getFundingAccountOptions()])

  return (
    <div>
      <PageHeader title="Create Fuel Wallet Top-up Request" />
      <WalletSubNav />
      <TopupRequestForm fundingAccounts={fundingAccounts} walletBalance={Number(wallet.balance)} />
    </div>
  )
}
