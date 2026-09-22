import { z } from "zod"

export const createPosDeviceSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  stationId: z.string().min(1, "Station is required"),
  softwareVersion: z.string().optional(),
})

export type CreatePosDeviceInput = z.infer<typeof createPosDeviceSchema>
