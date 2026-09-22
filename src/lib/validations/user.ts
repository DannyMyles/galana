import { z } from "zod"
import { ROLES } from "@/lib/rbac/roles"

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  roleName: z.enum(ROLES),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
