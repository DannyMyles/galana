"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useTransition } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { stationStatusValues } from "@/lib/validations/station"

export function StationsFilters({ regions }: { regions: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [, startTransition] = useTransition()

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search stations..."
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") updateParam("search", search || null)
          }}
          onBlur={() => updateParam("search", search || null)}
        />
      </div>
      <Select
        value={searchParams.get("region") ?? undefined}
        onValueChange={(value) => updateParam("region", value)}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="All Regions" />
        </SelectTrigger>
        <SelectContent>
          {regions.map((region) => (
            <SelectItem key={region} value={region}>
              {region}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("status") ?? undefined}
        onValueChange={(value) => updateParam("status", value)}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          {stationStatusValues.map((status) => (
            <SelectItem key={status} value={status}>
              {status[0] + status.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
