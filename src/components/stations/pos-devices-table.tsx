"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { StatusBadge } from "@/components/shared/status-badge"
import { PosDeviceStatusMenu } from "@/components/stations/pos-device-status-menu"
import type { PosDeviceListRow } from "@/lib/data/pos-devices"

const columns: ColumnDef<PosDeviceListRow>[] = [
  { header: "Device ID", accessorKey: "deviceId" },
  { header: "Station", cell: ({ row }) => `${row.original.station.name} (${row.original.station.code})` },
  { header: "Software Version", cell: ({ row }) => row.original.softwareVersion ?? "—" },
  {
    header: "Last Seen",
    cell: ({ row }) => (row.original.lastSeenAt ? <DateTimeDisplay value={row.original.lastSeenAt} /> : "Never"),
  },
  { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  {
    header: "Actions",
    cell: ({ row }) => <PosDeviceStatusMenu deviceId={row.original.id} status={row.original.status} />,
  },
]

export function PosDevicesTable({ devices }: { devices: PosDeviceListRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={devices}
      emptyTitle="No POS devices registered"
      emptyDescription="Register a device to authorise it for ticket redemption."
    />
  )
}
