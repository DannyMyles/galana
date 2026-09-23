import { Plus } from "@/components/icons"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { AdministrationSubNav } from "@/components/administration/administration-subnav"
import { UserFormDialog } from "@/components/administration/user-form-dialog"
import { UsersTable } from "@/components/administration/users-table"
import { getUsers } from "@/lib/data/users"
import { requirePermission } from "@/lib/rbac/guard"
import { prisma } from "@/lib/db/client"

export default async function UsersPage() {
  const admin = await requirePermission("users:manage")
  const [users, stations] = await Promise.all([getUsers(), prisma.station.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })])

  return (
    <div>
      <PageHeader
        title="Administration"
        description="Manage portal users, roles and access."
        actions={<UserFormDialog stations={stations} trigger={<Button />} triggerContent={<><Plus className="size-4" />Add user</>} />}
      />
      <AdministrationSubNav />
      <UsersTable users={users} stations={stations} currentUserId={admin.id} />
    </div>
  )
}
