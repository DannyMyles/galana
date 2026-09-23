"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { PosDeviceStatusMenu } from "@/components/stations/pos-device-status-menu"
import type { PosDeviceListRow } from "@/lib/data/pos-devices"

const ONLINE_WINDOW_MS = 15 * 60_000

function ago(date: Date | string) {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`
  return `${Math.round(mins / 1440)} d ago`
}

export function PosDevicesTable({ devices, approvedVersions, canManage }: { devices: PosDeviceListRow[]; approvedVersions: string[]; canManage: boolean }) {
  const columns: ColumnDef<PosDeviceListRow>[] = [
    { header: "Device ID", cell: ({ row }) => <span className="font-semibold">{row.original.deviceId}</span> },
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
    ...(canManage ? [{ header: "Actions", cell: ({ row }: { row: { original: PosDeviceListRow } }) => <PosDeviceStatusMenu deviceId={row.original.id} status={row.original.status} /> } as ColumnDef<PosDeviceListRow>] : []),
  ]

  return <DataTable columns={columns} data={devices} emptyTitle="No POS devices registered" emptyDescription="Register a device to authorise it for ticket redemption." />
}
