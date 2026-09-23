import { Plug } from "@/components/icons"
import { PageHeader } from "@/components/shared/page-header"
import { StationsSubNav } from "@/components/stations/stations-subnav"
import { AddPosDeviceDialog } from "@/components/stations/add-pos-device-dialog"
import { PosDevicesTable } from "@/components/stations/pos-devices-table"
import { SoftwareVersionsDialog } from "@/components/stations/software-versions-dialog"
import { getPosDevices, getStationsForSelect } from "@/lib/data/pos-devices"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"
import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"

export default async function PosDevicesPage() {
  const user = await requirePermission(["stations:monitor", "pos-devices:manage"])
  const [devices, stations, versions] = await Promise.all([getPosDevices(), getStationsForSelect(), prisma.approvedSoftwareVersion.findMany({ orderBy: { version: "asc" } })])
  const canManage = hasPermission(user.roles, "pos-devices:manage")

  return (
    <div>
      <PageHeader
        title="POS Devices"
        description="Unique device IDs, station assignment, approved software and live connectivity."
        actions={canManage ? <><SoftwareVersionsDialog versions={toPlain(versions)} /><AddPosDeviceDialog stations={stations} /></> : undefined}
      />
      <StationsSubNav />
      <p className="mb-5 flex items-start gap-2 rounded-xl bg-[#1226AA]/[0.06] px-4 py-3 text-sm text-[#3B3E63]">
        <Plug className="mt-0.5 size-4 shrink-0 text-[#1226AA]" />
        JPL issues and manages the POS terminals. Registration here is manual until the JPL device feed is connected (US-ADM-006); connectivity is derived from each device&apos;s last check-in.
      </p>
      <PosDevicesTable devices={toPlain(devices)} approvedVersions={versions.map((v) => v.version)} canManage={canManage} />
    </div>
  )
}
