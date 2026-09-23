"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { createPosDeviceSchema, type CreatePosDeviceInput } from "@/lib/validations/pos-device"
import { createPosDevice } from "@/app/(portal)/stations/pos-devices/actions"
import { LoadingButton } from "@/components/shared/loading-button"
import { AddButton } from "@/components/shared/add-button"

interface StationOption {
  id: string
  name: string
  code: string
}

export function AddPosDeviceDialog({ stations }: { stations: StationOption[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const form = useForm<CreatePosDeviceInput>({
    resolver: zodResolver(createPosDeviceSchema),
    defaultValues: { deviceId: "", stationId: "", softwareVersion: "" },
  })

  async function onSubmit(values: CreatePosDeviceInput) {
    try {
      await createPosDevice(values)
      toast.success(`Device ${values.deviceId} was registered.`)
      form.reset()
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to register device.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<AddButton label="Register POS device" />} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register POS Device</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="deviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device ID</FormLabel>
                  <FormControl>
                    <Input placeholder="SW-POS-008" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Station</FormLabel>
                  <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select station" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stations.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          {station.name} ({station.code})
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
              name="softwareVersion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Software Version</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. GTK-V2.4" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <LoadingButton type="submit" disabled={form.formState.isSubmitting} loading={form.formState.isSubmitting} loadingText="Registering…">
                {"Register"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
