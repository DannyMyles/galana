import { z } from "zod"

export const createEpraPriceSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  pricePerLitre: z.coerce.number().positive("Enter a valid price"),
  effectiveFrom: z.string().min(1, "Effective date is required"),
})

export type CreateEpraPriceInput = z.infer<typeof createEpraPriceSchema>
