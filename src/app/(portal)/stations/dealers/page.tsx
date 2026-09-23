import { Plus } from "@/components/icons"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { StationsSubNav } from "@/components/stations/stations-subnav"
import { DealerFormDialog } from "@/components/stations/dealer-form-dialog"
import { DealersTable } from "@/components/stations/dealers-table"
import { getDealers } from "@/lib/data/dealers"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"

export default async function DealersPage() {
  const user = await requirePermission(["stations:monitor", "dealers:manage"])
  const dealers = await getDealers()
  const canManage = hasPermission(user.roles, "dealers:manage")

  return (
    <div>
      <PageHeader
        title="Dealers"
        description="Station ownership and settlement information."
        actions={canManage ? <DealerFormDialog trigger={<Button />} triggerContent={<><Plus className="size-4" />Add dealer</>} /> : undefined}
      />
      <StationsSubNav />
      <DealersTable dealers={dealers} canManage={canManage} />
    </div>
  )
}
