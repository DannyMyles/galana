import { requirePermission } from "@/lib/rbac/guard"
import { PageHeader } from "@/components/shared/page-header"
import { CustomersTable } from "@/components/customers/customers-table"
import { getCustomers } from "@/lib/data/customers"

export default async function CustomersPage() {
  await requirePermission(["reports:jaguar", "reports:finance"])
  const customers = await getCustomers()

  return (
    <div>
      <PageHeader title="Customers" description="Jaguar fleet customers funded through the portal" />
      <CustomersTable customers={customers} />
    </div>
  )
}
