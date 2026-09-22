"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { UserActionsMenu } from "@/components/administration/user-actions-menu"
import type { UserListRow } from "@/lib/data/users"
import { ROLE_LABELS, type Role } from "@/lib/rbac/roles"

const columns: ColumnDef<UserListRow>[] = [
  { header: "Name", accessorKey: "name" },
  { header: "Email", accessorKey: "email" },
  {
    header: "Roles",
    cell: ({ row }) =>
      row.original.roles.map((userRole) => ROLE_LABELS[userRole.role.name as Role]).join(", ") || "—",
  },
  { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  {
    header: "Actions",
    cell: ({ row }) => <UserActionsMenu userId={row.original.id} status={row.original.status} />,
  },
]

export function UsersTable({ users }: { users: UserListRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={users}
      emptyTitle="No users yet"
      emptyDescription="Add a user to grant them access to the portal."
    />
  )
}
