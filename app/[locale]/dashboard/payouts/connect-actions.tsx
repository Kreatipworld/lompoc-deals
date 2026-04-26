"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function ConnectStripeButton({ labels }: { labels: { connect: string; redirecting: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    setLoading(true)
    const res = await fetch("/api/stripe/connect/create-account", { method: "POST" })
    const data = await res.json()
    if (data.alreadyConnected) {
      router.refresh()
      return
    }
    if (data.url) {
      router.push(data.url)
    } else {
      alert(data.error ?? "Could not start Stripe Connect. Please try again.")
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
    >
      {loading ? labels.redirecting : labels.connect}
    </button>
  )
}

export function StripeExpressDashboardButton({ accountId, labels }: { accountId: string; labels: { loading: string; open: string } }) {
  const [loading, setLoading] = useState(false)

  async function openDashboard() {
    setLoading(true)
    const res = await fetch("/api/stripe/connect/dashboard-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    })
    const data = await res.json()
    if (data.url) {
      window.open(data.url, "_blank")
    } else {
      alert("Could not open Stripe dashboard. Please try again.")
    }
    setLoading(false)
  }

  return (
    <button
      onClick={openDashboard}
      disabled={loading}
      className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
    >
      {loading ? labels.loading : labels.open}
    </button>
  )
}
