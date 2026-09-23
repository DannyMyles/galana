import Link from "next/link"
import { UsersRound, Pencil } from "@/components/icons"
import { DetailPage, DetailSection, DetailFields } from "@/components/shared/detail"
import { EntityAudit } from "@/components/shared/entity-audit"
import { StatusBadge } from "@/components/shared/status-badge"
import { UserFormDialog } from "@/components/administration/user-form-dialog"
import { Button } from "@/components/ui/button"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { getUserDetail } from "@/lib/data/details"
import { prisma } from "@/lib/db/client"
import { requirePermission } from "@/lib/rbac/guard"
import { ROLE_LABELS, type Role } from "@/lib/rbac/roles"

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("users:manage")
  const { id } = await params
  const [u, stations] = await Promise.all([getUserDetail(id), prisma.station.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })])
  return (
    <DetailPage
      backHref="/administration/users"
      backLabel="Users"
      icon={UsersRound}
      title={u.name}
      subtitle={u.email}
      badge={<StatusBadge status={u.status} />}
      actions={
        <UserFormDialog
          stations={stations}
          trigger={<Button variant="outline" />}
          triggerContent={<><Pencil className="size-4" />Edit user</>}
          user={{ id: u.id, name: u.name, email: u.email, phone: u.phone ?? "", status: u.status, roleNames: u.roles.map((r) => r.role.name as Role), stationId: u.stationId ?? "" }}
        />
      }
      main={<EntityAudit entityType="User" entityId={u.id} />}
      aside={
        <>
          <DetailSection title="Profile">
            <DetailFields columns={1} items={[
              { label: "Phone", value: u.phone },
              { label: "Station", value: u.station ? <Link href={`/stations/${u.station.id}`} className="text-[#1226AA] hover:underline">{u.station.name}</Link> : null },
              { label: "Member since", value: <DateTimeDisplay value={u.createdAt} formatStr="dd MMM yyyy" /> },
            ]} />
          </DetailSection>
          <DetailSection title="Roles">
            <div className="flex flex-wrap gap-1.5">
              {u.roles.map((r) => (
                <span key={r.role.name} className="rounded-full bg-[#1226AA]/[0.08] px-2.5 py-1 text-xs font-medium text-[#1226AA]">{ROLE_LABELS[r.role.name as Role]}</span>
              ))}
            </div>
          </DetailSection>
        </>
      }
    />
  )
}
