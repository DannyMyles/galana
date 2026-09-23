import { z } from "zod"
import { ROLES } from "@/lib/rbac/roles"

export const userSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  roleNames: z.array(z.enum(ROLES)).min(1, "Assign at least one role"),
  stationId: z.string().optional(),
})

export type UserInput = z.input<typeof userSchema>
