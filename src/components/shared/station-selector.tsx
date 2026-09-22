"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface StationOption {
  id: string
  name: string
  code: string
}

export function StationSelector({
  stations,
  value,
  onChange,
  placeholder = "Select a station",
  disabled,
}: {
  stations: StationOption[]
  value?: string
  onChange: (stationId: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <Select
      value={value}
      onValueChange={(newValue) => newValue && onChange(newValue)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {stations.map((station) => (
          <SelectItem key={station.id} value={station.id}>
            {station.name} ({station.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
