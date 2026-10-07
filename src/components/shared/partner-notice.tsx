import { AlertTriangle, Plug } from "@/components/icons"

/** Shown in place of a Jaguar partner API panel when the service is not configured or failed. */
export function PartnerNotice({ state, message }: { state: "not_configured" | "error"; message?: string }) {
  if (state === "not_configured") {
    return (
      <p className="flex items-start gap-2 rounded-xl bg-[#F6F7FB] px-4 py-3 text-sm text-[#3B3E63]">
        <Plug className="mt-0.5 size-4 shrink-0 text-[#6A6C8C]" />
        The fuel card service is not configured. Set FUEL_CARD_API_URL and the partner credentials to show this.
      </p>
    )
  }
  return (
    <p className="flex items-start gap-2 rounded-xl bg-[#EB2239]/10 px-4 py-3 text-sm text-[#D01A2F]">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      {message ?? "The fuel card service did not respond."}
    </p>
  )
}
