"use client"

import { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import type { TierKey } from "@/lib/stripe"

type Props =
  | { hasSubscription: boolean; mode: "manage" }
  | { hasSubscription: boolean; mode: "subscribe"; tier: TierKey; label: string }

export default function BillingActions(props: Props) {
  const [loading, setLoading] = useState(false)
  // Inline instead of alert(): alerts are jarring on mobile and get suppressed
  // by some in-app browsers, which made failures look like dead buttons.
  const [error, setError] = useState<string | null>(null)

  async function post(path: string, body?: object) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(path, {
        method: "POST",
        ...(body
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error ?? "Something went wrong. Please try again.")
    } catch {
      setError("Connection problem — check your signal and try again.")
    }
    setLoading(false)
  }

  const errorBox = error && (
    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-left text-xs leading-relaxed text-destructive">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {error}
    </p>
  )

  if (props.mode === "manage") {
    return (
      <div className="shrink-0">
        <button
          onClick={() => post("/api/stripe/portal")}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Opening…" : "Manage subscription"}
        </button>
        {errorBox}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => post("/api/stripe/checkout", { tier: props.tier })}
        disabled={loading}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Opening secure checkout…" : props.label}
      </button>
      {errorBox}
    </div>
  )
}
