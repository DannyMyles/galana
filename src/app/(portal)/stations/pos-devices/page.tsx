import { PageHeader } from "@/components/shared/page-header"
import { StationsSubNav } from "@/components/stations/stations-subnav"
import { AddPosDeviceDialog } from "@/components/stations/add-pos-device-dialog"
import { PosDevicesTable } from "@/components/stations/pos-devices-table"
import { getPosDevices, getStationsForSelect } from "@/lib/data/pos-devices"

export default async function PosDevicesPage() {
  const [devices, stations] = await Promise.all([getPosDevices(), getStationsForSelect()])

  return (
    <div>
      <PageHeader
        title="POS Devices"
        description="Devices authorised to validate and redeem fuel tickets at stations"
        actions={<AddPosDeviceDialog stations={stations} />}
      />
      <StationsSubNav />
      <PosDevicesTable devices={devices} />
    </div>
  )
}
