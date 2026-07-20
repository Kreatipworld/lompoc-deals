"use client"

import { useState, useTransition } from "react"
import { Link } from "@/i18n/navigation"
import { Ticket, LogIn } from "lucide-react"
import { claimCoupon } from "@/lib/coupon-actions"

type Labels = {
  signIn: string; signInWhy: string; getCode: string; yourCode: string
  codeIsYours: string; showAtRegister: string
  expired: string; paused: string; soldOut: string; dailyLimit: string; error: string
}

/**
 * The only part of a deal that requires an account. Everything else about the
 * offer — including the discount — stays public, so discovery and SEO are
 * untouched and the sign-in ask lands at the moment of real intent.
 */
export function CouponCodeBlock({
  dealId, isSignedIn, existingCode, labels,
}: { dealId: number; isSignedIn: boolean; existingCode: string | null; labels: Labels }) {
  const [code, setCode] = useState(existingCode)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const reasonLabel = (r: string) =>
    r === "expired" ? labels.expired
    : r === "paused" ? labels.paused
    : r === "sold_out" ? labels.soldOut
    : r === "daily_limit" ? labels.dailyLimit
    : labels.error

  if (code) {
    return (
      <div className="mt-6">
        <div className="mx-auto w-fit rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-8 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {labels.yourCode}
          </p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-foreground">{code}</p>
        </div>
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium">
          <Ticket className="h-4 w-4 text-primary" /> {labels.showAtRegister}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{labels.codeIsYours}</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="mt-6">
        <Link
          href={`/login?from=/deals/${dealId}/claim`}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <LogIn className="h-4 w-4" /> {labels.signIn}
        </Link>
        <p className="mt-2 text-xs text-muted-foreground">{labels.signInWhy}</p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null)
            const res = await claimCoupon(dealId)
            if (res.ok) setCode(res.code)
            else setError(reasonLabel(res.reason))
          })
        }
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        <Ticket className="h-4 w-4" /> {labels.getCode}
      </button>
      {error && <p className="mt-2 text-sm font-medium text-destructive">{error}</p>}
    </div>
  )
}
