"use client"

import { useState } from "react"
import { Tag, Ticket, Clock, CheckCircle2, RotateCcw, ArrowRight, Sparkles } from "lucide-react"

// All copy arrives from the server page (next-intl is server-side there);
// this component is a self-contained, no-network demo of the claim flow.
export type CouponDemoLabels = {
  demoChip: string
  businessName: string
  dealTitle: string
  dealDiscount: string
  dealTerms: string
  expires: string
  claimCta: string
  code: string
  showAtRegister: string
  usedCta: string
  usedTitle: string
  usedBody: string
  playAgain: string
}

type Stage = "card" | "coupon" | "used"

export function CouponDemo({ labels }: { labels: CouponDemoLabels }) {
  const [stage, setStage] = useState<Stage>("card")

  return (
    <div className="mx-auto w-full max-w-sm">
      {stage === "card" && (
        <article className="overflow-hidden rounded-2xl border-2 border-primary/20 bg-card shadow-lg">
          {/* Media area — brand gradient, no fake photo */}
          <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-primary/20 via-gold/15 to-success/10">
            <Tag className="h-12 w-12 text-primary/30" strokeWidth={1.25} />
            <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-sm font-bold text-gold-foreground shadow">
              {labels.dealDiscount}
            </span>
            <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
              {labels.demoChip}
            </span>
          </div>
          <div className="flex flex-col gap-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {labels.businessName}
            </p>
            <h3 className="font-display text-lg font-semibold leading-snug">{labels.dealTitle}</h3>
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {labels.expires}
            </p>
            <button
              type="button"
              onClick={() => setStage("coupon")}
              className="mt-2 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98]"
            >
              {labels.claimCta}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </article>
      )}

      {stage === "coupon" && (
        <div className="overflow-hidden rounded-2xl border-2 border-primary/20 bg-card shadow-lg animate-fade-up">
          <div className="border-b bg-primary/5 px-5 py-3 text-center">
            <p className="font-display text-base font-semibold text-primary">{labels.businessName}</p>
          </div>
          <div className="px-5 py-6 text-center">
            <p className="font-display text-3xl font-extrabold tracking-tight text-primary">
              {labels.dealDiscount}
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold">{labels.dealTitle}</h3>

            <div className="mx-auto mt-5 w-fit rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-7 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {labels.code}
              </p>
              <p className="mt-0.5 font-mono text-xl font-bold tracking-widest">LOMPOC-DEMO</p>
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium">
              <Ticket className="h-4 w-4 text-primary" />
              {labels.showAtRegister}
            </p>
            <p className="mt-2 text-xs italic text-muted-foreground">{labels.dealTerms}</p>
          </div>
          <div className="border-t bg-muted/30 px-5 py-4">
            <button
              type="button"
              onClick={() => setStage("used")}
              className="inline-flex h-10 w-full items-center justify-center rounded-full border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {labels.usedCta}
            </button>
          </div>
        </div>
      )}

      {stage === "used" && (
        <div className="flex flex-col items-center rounded-2xl border-2 border-success/30 bg-success/5 px-6 py-10 text-center shadow-lg animate-fade-up">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </span>
          <p className="mt-4 font-display text-xl font-semibold">{labels.usedTitle}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            {labels.usedBody}
          </p>
          <button
            type="button"
            onClick={() => setStage("card")}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {labels.playAgain}
          </button>
        </div>
      )}
    </div>
  )
}
