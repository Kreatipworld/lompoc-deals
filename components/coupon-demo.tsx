"use client"

import { useEffect, useState } from "react"
import {
  Tag,
  Ticket,
  Clock,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Heart,
} from "lucide-react"

// Storyboard version of the coupon demo (same mechanics as MerchantDemo):
// three scenes — claim → show at register → done — that auto-advance with
// clickable step cards and a progress bar, while every button stays tappable
// so visitors can drive it themselves. Manual taps pause the autoplay.
// Honors prefers-reduced-motion (no auto-advance, no floating icons).
export type CouponDemoLabels = {
  scenes: Array<{ title: string; body: string }>
  panelLabels: [string, string, string]
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

const SCENE_MS = 4400

export function CouponDemo({ labels }: { labels: CouponDemoLabels }) {
  const [scene, setScene] = useState(0)
  const [paused, setPaused] = useState(false)
  const [manual, setManual] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  // Auto-advance unless reduced motion, hovered, or the visitor took over.
  useEffect(() => {
    if (reducedMotion || paused || manual) return
    const id = setInterval(() => setScene((s) => (s + 1) % 3), SCENE_MS)
    return () => clearInterval(id)
  }, [reducedMotion, paused, manual])

  function goTo(next: number, byUser = false) {
    if (byUser) setManual(true)
    setScene(next)
  }

  const showProgress = !reducedMotion && !paused && !manual

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1.05fr]"
    >
      {/* Scene selector — clickable step cards */}
      <ol className="space-y-3">
        {labels.scenes.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => goTo(i, true)}
              aria-pressed={scene === i}
              className={`w-full rounded-2xl border p-4 text-left transition-all ${
                scene === i
                  ? "border-primary/40 bg-primary/5 shadow-sm"
                  : "bg-card opacity-70 hover:opacity-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    scene === i ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="font-display font-semibold">{s.title}</span>
              </span>
              <span className="mt-1.5 block pl-11 text-sm text-muted-foreground">{s.body}</span>
              {scene === i && showProgress && (
                <span className="ml-11 mt-3 block h-1 overflow-hidden rounded-full bg-primary/10">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ animation: `demo-progress ${SCENE_MS}ms linear forwards` }}
                  />
                </span>
              )}
            </button>
          </li>
        ))}
      </ol>

      {/* Stage — mock phone panel */}
      <div className="mx-auto w-full max-w-sm">
        <div className="overflow-hidden rounded-3xl border-2 border-primary/15 bg-card shadow-xl">
          {/* Mock top bar */}
          <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-gold/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/30" />
            <span className="ml-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {labels.panelLabels[scene]}
            </span>
          </div>

          <div className="min-h-[330px]">
            {/* Scene 1 — the deal card */}
            {scene === 0 && (
              <div className="animate-fade-up p-5">
                <div className="relative flex h-32 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-gold/15 to-success/10">
                  <Tag className="h-10 w-10 text-primary/30" strokeWidth={1.25} />
                  <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-sm font-bold text-gold-foreground shadow">
                    {labels.dealDiscount}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                    {labels.demoChip}
                  </span>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-primary">
                  {labels.businessName}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold leading-snug">
                  {labels.dealTitle}
                </h3>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {labels.expires}
                </p>
                <button
                  type="button"
                  onClick={() => goTo(1, true)}
                  className="mt-4 inline-flex h-10 w-full animate-pulse items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98]"
                >
                  {labels.claimCta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Scene 2 — the coupon */}
            {scene === 1 && (
              <div className="animate-fade-up">
                <div className="border-b bg-primary/5 px-5 py-3 text-center">
                  <p className="font-display text-base font-semibold text-primary">
                    {labels.businessName}
                  </p>
                </div>
                <div className="px-5 py-6 text-center">
                  <p className="font-display text-3xl font-extrabold tracking-tight text-primary">
                    {labels.dealDiscount}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold">{labels.dealTitle}</h3>
                  <div
                    className="mx-auto mt-5 w-fit rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-7 py-3 animate-fade-up"
                    style={{ animationDelay: "180ms" }}
                  >
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
                    onClick={() => goTo(2, true)}
                    className="inline-flex h-10 w-full items-center justify-center rounded-full border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    {labels.usedCta}
                  </button>
                </div>
              </div>
            )}

            {/* Scene 3 — done, with celebration */}
            {scene === 2 && (
              <div className="relative flex min-h-[330px] animate-fade-up flex-col items-center justify-center overflow-hidden bg-success/5 px-6 text-center">
                {!reducedMotion &&
                  [0, 1, 2, 3].map((n) => (
                    <span
                      key={n}
                      aria-hidden
                      className="absolute opacity-0"
                      style={{
                        left: `${18 + n * 20}%`,
                        bottom: "2.5rem",
                        animation: `demo-heart 2.4s ease-out ${n * 0.4}s infinite`,
                      }}
                    >
                      {n % 2 === 0 ? (
                        <Heart className="h-5 w-5 fill-primary text-primary" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-gold" />
                      )}
                    </span>
                  ))}
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </span>
                <p className="mt-4 font-display text-xl font-semibold">{labels.usedTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">{labels.usedBody}</p>
                <button
                  type="button"
                  onClick={() => goTo(0, true)}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/40"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {labels.playAgain}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* local keyframes (shared names with merchant-demo; identical definitions) */}
      <style>{`
        @keyframes demo-progress { from { width: 0% } to { width: 100% } }
        @keyframes demo-heart {
          0% { opacity: 0; transform: translateY(0) scale(0.7); }
          15% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-84px) scale(1.15); }
        }
      `}</style>
    </div>
  )
}
