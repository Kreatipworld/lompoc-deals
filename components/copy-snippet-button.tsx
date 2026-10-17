"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

/** Copies a text snippet (e.g. badge HTML) to the clipboard and flashes a "Copied" state. */
export function CopySnippetButton({
  text,
  label,
  copiedLabel,
}: {
  text: string
  label: string
  copiedLabel: string
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard blocked — the snippet is still selectable in the box
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 text-xs font-semibold transition hover:bg-accent"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? copiedLabel : label}
    </button>
  )
}
