import { PageHeader } from "@/components/shared/page-header"
import { AdministrationSubNav } from "@/components/administration/administration-subnav"
import { AddUserDialog } from "@/components/administration/add-user-dialog"
import { UsersTable } from "@/components/administration/users-table"
import { getUsers } from "@/lib/data/users"

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div>
      <PageHeader
        title="Administration"
        description="Manage portal users, roles, and access"
        actions={<AddUserDialog />}
      />
      <AdministrationSubNav />
      <UsersTable users={users} />
    </div>
  )
}
