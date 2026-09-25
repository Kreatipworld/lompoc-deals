"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"

/** Native share sheet where there is one (phones), copy-link everywhere else. */
export function SaleShareButton({ title, label, copiedLabel }: { title: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // user dismissed the sheet — nothing to do
    }
  }
  return (
    <button type="button" onClick={share} className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-4 py-2.5 text-sm font-semibold hover:bg-accent">
      {copied ? <Check className="h-4 w-4 text-success" /> : <Share2 className="h-4 w-4" />}
      {copied ? copiedLabel : label}
    </button>
  )
}
