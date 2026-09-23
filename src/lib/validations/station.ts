import { z } from "zod"

export const stationStatusValues = ["ACTIVE", "SUSPENDED", "DEACTIVATED"] as const

const optionalNumber = (min: number, max: number, label: string) =>
  z
    .string()
    .optional()
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max), `${label} must be between ${min} and ${max}`)

export const stationSchema = z.object({
  name: z.string().trim().min(1, "Station name is required"),
  code: z.string().trim().min(1, "Station code is required").transform((v) => v.toUpperCase()).refine((v) => /^[A-Z0-9-]+$/.test(v), "Use letters, numbers and hyphens only"),
  region: z.string().trim().min(1, "Region is required"),
  county: z.string().trim().min(1, "County is required"),
  address: z.string().trim().optional(),
  latitude: optionalNumber(-90, 90, "Latitude"),
  longitude: optionalNumber(-180, 180, "Longitude"),
  contactName: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  contactEmail: z.string().trim().email("Enter a valid contact email").optional().or(z.literal("")),
  dealerId: z.string().optional(),
  productIds: z.array(z.string()).min(1, "Select at least one product"),
})

export type StationInput = z.input<typeof stationSchema>

export const stationFiltersSchema = z.object({
  search: z.string().optional(),
  region: z.string().optional(),
  status: z.enum(stationStatusValues).optional(),
  page: z.coerce.number().int().min(0).default(0),
})

export type StationFilters = z.infer<typeof stationFiltersSchema>
