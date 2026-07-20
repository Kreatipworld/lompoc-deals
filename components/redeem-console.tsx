"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, AlertTriangle, Ticket } from "lucide-react"
import { lookupCoupon, redeemCoupon, type CouponLookup } from "@/lib/coupon-redeem-actions"

type Labels = Record<
  | "codeLabel" | "check" | "checking" | "markRedeemed" | "redeeming" | "valid" | "notFound"
  | "alreadyRedeemed" | "expiredCoupon" | "voided" | "claimedBy" | "claimedOn" | "redeemedOn"
  | "done" | "another" | "error",
  string
>

export function RedeemConsole({ labels, locale }: { labels: Labels; locale: string }) {
  const [input, setInput] = useState("")
  const [result, setResult] = useState<CouponLookup | null>(null)
  const [redeemed, setRedeemed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // React 18: useTransition's `pending` flag does not await an async transition
  // callback, so it clears before the request finishes. Track submitting state
  // explicitly instead — set before the await, cleared in `finally`. (Same bug
  // already found and fixed in Task 5.)
  const [checking, setChecking] = useState(false)
  const [redeeming, setRedeeming] = useState(false)

  const fmt = (d: Date) =>
    new Date(d).toLocaleString(locale === "es" ? "es-US" : "en-US", {
      dateStyle: "medium", timeStyle: "short", timeZone: "America/Los_Angeles",
    })

  const reset = () => { setInput(""); setResult(null); setRedeemed(false); setError(null) }

  if (redeemed) {
    return (
      <div className="rounded-2xl border-2 border-success/40 bg-success/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <p className="mt-3 text-xl font-semibold">{labels.done}</p>
        <button
          onClick={reset}
          className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground"
        >
          {labels.another}
        </button>
      </div>
    )
  }

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setChecking(true)
    try {
      setResult(await lookupCoupon(input))
    } catch {
      setError(labels.error)
    } finally {
      setChecking(false)
    }
  }

  const handleRedeem = async () => {
    if (!result?.ok) return
    setError(null)
    setRedeeming(true)
    try {
      const res = await redeemCoupon(result.claimId)
      if (res.ok) setRedeemed(true)
      else setError(res.reason === "expired" ? labels.expiredCoupon : labels.error)
    } catch {
      setError(labels.error)
    } finally {
      setRedeeming(false)
    }
  }

  const submitting = checking || redeeming

  return (
    <div className="space-y-5">
      <form onSubmit={handleCheck} className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="coupon-code">{labels.codeLabel}</label>
        <input
          id="coupon-code"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="7K2F9P"
          className="h-14 flex-1 rounded-xl border-2 bg-background px-4 text-center font-mono text-2xl font-bold uppercase tracking-[0.25em] focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting || !input.trim()}
          className="h-14 rounded-xl bg-primary px-7 text-base font-semibold text-primary-foreground disabled:opacity-50"
        >
          {checking ? labels.checking : labels.check}
        </button>
      </form>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      {result && !result.ok && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-destructive/30 bg-destructive/5 p-5">
          <XCircle className="h-7 w-7 shrink-0 text-destructive" />
          <p className="font-semibold">{labels.notFound}</p>
        </div>
      )}

      {result?.ok && (
        <div className="rounded-2xl border-2 p-5">
          {result.status === "redeemed" ? (
            <p className="mb-3 inline-flex items-center gap-2 font-semibold text-amber-600">
              <AlertTriangle className="h-5 w-5" /> {labels.alreadyRedeemed}
              {result.redeemedAt ? ` · ${fmt(result.redeemedAt)}` : ""}
            </p>
          ) : result.status === "void" ? (
            <p className="mb-3 inline-flex items-center gap-2 font-semibold text-destructive">
              <XCircle className="h-5 w-5" /> {labels.voided}
            </p>
          ) : result.expired ? (
            <p className="mb-3 inline-flex items-center gap-2 font-semibold text-destructive">
              <XCircle className="h-5 w-5" /> {labels.expiredCoupon}
            </p>
          ) : (
            <p className="mb-3 inline-flex items-center gap-2 font-semibold text-success">
              <CheckCircle2 className="h-5 w-5" /> {labels.valid}
            </p>
          )}

          <p className="text-lg font-bold">
            {result.discountText ? `${result.discountText} · ` : ""}{result.dealTitle}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.customerName ? `${labels.claimedBy} ${result.customerName} · ` : ""}
            {labels.claimedOn} {fmt(result.claimedAt)}
          </p>

          {result.status === "claimed" && !result.expired && (
            <button
              disabled={submitting}
              onClick={handleRedeem}
              className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Ticket className="h-5 w-5" /> {redeeming ? labels.redeeming : labels.markRedeemed}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
