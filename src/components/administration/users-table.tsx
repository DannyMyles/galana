"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Pencil } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { UserActionsMenu } from "@/components/administration/user-actions-menu"
import { UserFormDialog } from "@/components/administration/user-form-dialog"
import type { UserListRow } from "@/lib/data/users"
import { ROLE_LABELS, type Role } from "@/lib/rbac/roles"

export function UsersTable({ users, stations, currentUserId }: { users: UserListRow[]; stations: { id: string; name: string }[]; currentUserId: string }) {
  const stationName = (id: string | null) => stations.find((s) => s.id === id)?.name

  const columns: ColumnDef<UserListRow>[] = [
    {
      header: "User",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}{row.original.phone ? ` · ${row.original.phone}` : ""}</p>
        </div>
      ),
    },
    {
      header: "Roles",
      cell: ({ row }) => (
        <div className="flex max-w-[280px] flex-wrap gap-1">
          {row.original.roles.map((r) => (
            <span key={r.role.name} className="rounded-full bg-[#1226AA]/[0.08] px-2.5 py-0.5 text-xs font-medium text-[#1226AA]">{ROLE_LABELS[r.role.name as Role]}</span>
          ))}
        </div>
      ),
    },
    { header: "Station", cell: ({ row }) => stationName(row.original.stationId) ?? "—" },
    { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <UserFormDialog
            stations={stations}
            trigger={<Button variant="ghost" size="icon-sm" aria-label={`Edit ${row.original.name}`} />}
            triggerContent={<Pencil className="size-4" />}
            user={{
              id: row.original.id,
              name: row.original.name,
              email: row.original.email,
              phone: row.original.phone ?? "",
              status: row.original.status,
              roleNames: row.original.roles.map((r) => r.role.name as Role),
              stationId: row.original.stationId ?? "",
            }}
          />
          {row.original.id !== currentUserId && <UserActionsMenu userId={row.original.id} status={row.original.status} />}
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={users} emptyTitle="No users yet" emptyDescription="Add a user to grant them access to the portal." />
}
