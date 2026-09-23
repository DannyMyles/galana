"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, actionsColumn } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, CheckCircle2, X as Ban } from "@/components/icons"
import type { POSStatus } from "@prisma/client"
import { RowActions } from "@/components/shared/row-actions"
import { setPosDeviceStatus } from "@/app/(portal)/stations/pos-devices/actions"
import type { PosDeviceListRow } from "@/lib/data/pos-devices"

const POS_TRANSITIONS: Record<POSStatus, { label: string; next: POSStatus }[]> = {
  ACTIVE: [{ label: "Mark inactive", next: "INACTIVE" }, { label: "Decommission", next: "DECOMMISSIONED" }],
  INACTIVE: [{ label: "Reactivate", next: "ACTIVE" }, { label: "Decommission", next: "DECOMMISSIONED" }],
  DECOMMISSIONED: [{ label: "Reactivate", next: "ACTIVE" }],
}

const ONLINE_WINDOW_MS = 15 * 60_000

function ago(date: Date | string) {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`
  return `${Math.round(mins / 1440)} d ago`
}

export function PosDevicesTable({ devices, approvedVersions, canManage }: { devices: PosDeviceListRow[]; approvedVersions: string[]; canManage: boolean }) {
  const router = useRouter()
  const columns: ColumnDef<PosDeviceListRow>[] = [
    { header: "Device ID", cell: ({ row }) => <Link href={`/stations/pos-devices/${row.original.id}`} className="font-semibold hover:text-[#1226AA] hover:underline">{row.original.deviceId}</Link> },
    { header: "Station", cell: ({ row }) => `${row.original.station.name} (${row.original.station.code})` },
    {
      header: "Software",
      cell: ({ row }) => {
        const v = row.original.softwareVersion
        const approved = v ? approvedVersions.includes(v) : false
        return (
          <div className="flex items-center gap-2">
            <span>{v ?? "—"}</span>
            {v && (approved ? <StatusBadge status="APPROVED" /> : <StatusBadge status="REJECTED" className="!bg-[#F5C400]/20 !text-[#8A6A00]" />)}
          </div>
        )
      },
    },
    {
      header: "Connectivity",
      cell: ({ row }) => {
        const seen = row.original.lastSeenAt
        const online = seen ? Date.now() - new Date(seen).getTime() < ONLINE_WINDOW_MS : false
        return (
          <div>
            <StatusBadge status={online ? "ONLINE" : "OFFLINE"} />
            <p className="mt-0.5 text-xs text-muted-foreground">{seen ? `Seen ${ago(seen)}` : "Never seen"}</p>
          </div>
        )
      },
    },
    { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    actionsColumn<PosDeviceListRow>((d) => (
      <RowActions
        actions={[
          { label: "View device", icon: Eye, href: `/stations/pos-devices/${d.id}` },
          ...(canManage ? POS_TRANSITIONS[d.status as POSStatus] : []).map((t) => ({
            label: t.label,
            icon: t.next === "ACTIVE" ? CheckCircle2 : Ban,
            destructive: t.next === "DECOMMISSIONED",
            menuOnly: true,
            onSelect: async () => {
              await setPosDeviceStatus(d.id, t.next)
              router.refresh()
            },
          })),
        ]}
      />
    )),
  ]

  return <DataTable columns={columns} data={devices} emptyTitle="No POS devices registered" emptyDescription="Register a device to authorise it for ticket redemption." />
}
