"use client"

import { useState } from "react"
import type { TierKey } from "@/lib/stripe"

type Props =
  | { hasSubscription: boolean; mode: "manage" }
  | { hasSubscription: boolean; mode: "subscribe"; tier: TierKey; label: string }

export default function BillingActions(props: Props) {
  const [loading, setLoading] = useState(false)

  async function handleManage() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? "Could not open billing portal. Please try again.")
        setLoading(false)
      }
    } catch {
      alert("Could not open billing portal. Please try again.")
      setLoading(false)
    }
  }

  async function handleSubscribe(tier: TierKey) {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? "Could not start checkout. Please try again.")
        setLoading(false)
      }
    } catch {
      alert("Could not start checkout. Please try again.")
      setLoading(false)
    }
  }

  if (props.mode === "manage") {
    return (
      <button
        onClick={handleManage}
        disabled={loading}
        className="shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
      >
        {loading ? "Loading…" : "Manage subscription"}
      </button>
    )
  }

  return (
    <button
      onClick={() => handleSubscribe(props.tier)}
      disabled={loading}
      className="w-full rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
    >
      {loading ? "Loading…" : props.label}
    </button>
  )
}
