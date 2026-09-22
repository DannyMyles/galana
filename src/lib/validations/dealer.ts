import { z } from "zod"

export const createDealerSchema = z.object({
  name: z.string().min(1, "Dealer name is required"),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  settlementAccount: z.string().optional(),
})

export type CreateDealerInput = z.infer<typeof createDealerSchema>
