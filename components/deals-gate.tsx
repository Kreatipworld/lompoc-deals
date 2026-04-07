import Link from "next/link"
import { Lock, ArrowRight, Sparkles } from "lucide-react"

export function DealsGate({
  count,
  fromPath = "/",
}: {
  count: number
  fromPath?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-accent to-background p-8 sm:p-14">
      <div
        aria-hidden
        className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-md text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
          <Lock className="h-6 w-6" />
        </div>

        <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {count > 0
            ? `${count} fresh ${count === 1 ? "deal" : "deals"} waiting for you`
            : "Sign up to unlock the deals"}
        </h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Lompoc Deals is free for locals. Sign up in 30 seconds to see every
          coupon, special, and announcement from local businesses.
        </p>

        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/signup?from=${encodeURIComponent(fromPath)}`}
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:w-auto"
          >
            <Sparkles className="h-4 w-4" />
            Create free account
          </Link>
          <Link
            href={`/login?from=${encodeURIComponent(fromPath)}`}
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border bg-background px-5 text-sm font-medium hover:bg-accent sm:w-auto"
          >
            I have an account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Free forever. No credit card. No spam.
        </p>
      </div>
    </div>
  )
}
