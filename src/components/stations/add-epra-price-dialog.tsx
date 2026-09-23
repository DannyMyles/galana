"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "@/components/icons"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createEpraPriceSchema, type CreateEpraPriceInput } from "@/lib/validations/epra-price"
import { createEpraPrice } from "@/app/(portal)/stations/epra-prices/actions"

interface ProductOption {
  id: string
  name: string
}

export function AddEpraPriceDialog({ products }: { products: ProductOption[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const form = useForm({
    resolver: zodResolver(createEpraPriceSchema),
    defaultValues: {
      productId: "",
      pricePerLitre: 0,
      effectiveFrom: new Date().toISOString().slice(0, 10),
    },
  })

  async function onSubmit(values: CreateEpraPriceInput) {
    try {
      await createEpraPrice(values)
      toast.success("EPRA price updated.")
      form.reset()
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update price.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Update EPRA Price
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update EPRA Price</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pricePerLitre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Litre (KES)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      value={field.value as string}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="effectiveFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective From</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Updating…" : "Update Price"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
