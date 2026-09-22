import { z } from "zod"

export const createTopUpRequestSchema = z.object({
  fundingAccount: z.string().min(1, "Funding account is required"),
  amount: z.coerce.number().positive("Enter a valid amount"),
  reference: z.string().min(1, "Reference is required"),
  remarks: z.string().optional(),
})

export type CreateTopUpRequestInput = z.infer<typeof createTopUpRequestSchema>

export const rejectTopUpSchema = z.object({
  reason: z.string().min(1, "A reason is required to reject a request"),
})
