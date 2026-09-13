"use client"

import { Printer } from "lucide-react"

// Print / save-as-PDF for documentation pages. Print styles live on the page
// (`.print-hide`) so the printed copy is just the guide body.
export function GuidePrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print-hide inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  )
}
