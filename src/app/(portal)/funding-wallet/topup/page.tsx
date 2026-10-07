import { PageHeader } from "@/components/shared/page-header"
import { TopUpRequestForm } from "@/components/wallet/topup-request-form"
import { requirePermission } from "@/lib/rbac/guard"
import { listGalanaCustomerNames } from "@/lib/integrations/fuel-card-partner"

export default async function NewTopUpPage() {
  await requirePermission(["wallet:view"])
  const customers = await listGalanaCustomerNames()
  return (
    <div>
      <PageHeader title="New top-up request" description="A Finance Maker requests the top-up. A Finance Checker, other than you, approves it, and the approval credits the customer's fuel wallet." />
      <TopUpRequestForm customers={customers} />
    </div>
  )
}
