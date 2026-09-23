"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Download, Upload } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LoadingButton } from "@/components/shared/loading-button"

export interface BulkResult {
  created: number
  errors: { line: number; message: string }[]
}

/** CSV bulk upload: valid rows are processed, invalid rows are reported with their line number. */
export function BulkUploadDialog({
  title,
  description,
  templateName,
  template,
  onUpload,
}: {
  title: string
  description: string
  templateName: string
  template: string
  onUpload: (csv: string) => Promise<BulkResult>
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [fileName, setFileName] = useState("")
  const [csv, setCsv] = useState("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<BulkResult | null>(null)

  function reset() {
    setFileName("")
    setCsv("")
    setResult(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function submit() {
    setBusy(true)
    try {
      const r = await onUpload(csv)
      setResult(r)
      if (r.created > 0) {
        toast.success(`${r.created} row${r.created > 1 ? "s" : ""} processed.`)
        router.refresh()
      }
      if (r.created === 0 && r.errors.length === 0) toast.info("The file contained no data rows.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Upload className="size-4" />
        Bulk upload
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(template)}`}
          download={templateName}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-[#1226AA] hover:underline"
        >
          <Download className="size-4" />
          Download CSV template
        </a>

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#DADCEB] px-4 py-8 text-center transition-colors hover:border-[#1226AA]/50 hover:bg-[#F6F7FD]">
          <Upload className="size-6 text-[#1226AA]" />
          <span className="text-sm font-medium">{fileName || "Choose a .csv file"}</span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setResult(null)
              setFileName(file.name)
              setCsv(await file.text())
            }}
          />
        </label>

        {result && (
          <div className="max-h-48 overflow-y-auto rounded-xl bg-[#F6F7FB] p-4 text-sm">
            <p className="font-medium">
              {result.created} processed · {result.errors.length} with errors
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 text-xs text-[#D01A2F]">
                {result.errors.map((err, i) => (
                  <li key={i}>Line {err.line}: {err.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <LoadingButton disabled={!csv || busy} onClick={submit} loading={busy} loadingText="Processing…">{"Upload & process"}</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
