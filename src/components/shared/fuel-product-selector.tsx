"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface FuelProductOption {
  id: string
  code: "PMS" | "AGO" | "LUBRICANTS" | "OTHER"
  name: string
}

/**
 * Product picker restricted to `products` — the caller is responsible for
 * passing only the products authorised for the current station/ticket
 * (per US-DM-005: "only authorised fuel types are available").
 */
export function FuelProductSelector({
  products,
  value,
  onChange,
  placeholder = "Select product",
  disabled,
}: {
  products: FuelProductOption[]
  value?: string
  onChange: (productId: string) => void
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
        {products.map((product) => (
          <SelectItem key={product.id} value={product.id}>
            {product.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
