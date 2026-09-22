import { z } from "zod"

export const stationStatusValues = ["ACTIVE", "SUSPENDED", "DEACTIVATED"] as const

export const createStationSchema = z.object({
  name: z.string().min(1, "Station name is required"),
  code: z
    .string()
    .min(1, "Station code is required")
    .toUpperCase()
    .regex(/^[A-Z0-9-]+$/, "Use letters, numbers and hyphens only"),
  region: z.string().min(1, "Region is required"),
  county: z.string().min(1, "County is required"),
  address: z.string().optional(),
  dealerId: z.string().min(1, "Dealer is required"),
  productIds: z.array(z.string()).min(1, "Select at least one product"),
})

export type CreateStationInput = z.infer<typeof createStationSchema>

export const stationFiltersSchema = z.object({
  search: z.string().optional(),
  region: z.string().optional(),
  status: z.enum(stationStatusValues).optional(),
  page: z.coerce.number().int().min(0).default(0),
})

export type StationFilters = z.infer<typeof stationFiltersSchema>
