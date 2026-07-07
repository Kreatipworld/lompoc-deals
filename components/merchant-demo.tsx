"use client"

import { useEffect, useRef, useState } from "react"
import { Tag, Heart, Eye, Ticket, CheckCircle2, TrendingUp, Send } from "lucide-react"

// Auto-playing 3-scene storyboard of the merchant journey:
// post a deal → locals claim it → stats grow. All copy arrives from the
// server page (serializable props). Honors prefers-reduced-motion by
// disabling auto-advance and the typing effect.
export type MerchantDemoLabels = {
  scenes: Array<{ title: string; body: string }>
  dealTitleTyped: string
  formLabel: string
  publish: string
  published: string
  feedHeader: string
  demoBizName: string
  demoDiscount: string
  claimsLabel: string
  viewsLabel: string
  redeemsLabel: string
  statsHeader: string
  liveChip: string
}

const SCENE_MS = 4400
const TARGETS = { views: 132, claims: 7, redeems: 5 }

export function MerchantDemo({ labels }: { labels: MerchantDemoLabels }) {
  const [scene, setScene] = useState(0)
  const [typed, setTyped] = useState("")
  const [claims, setClaims] = useState(0)
  const [stats, setStats] = useState({ views: 0, claims: 0, redeems: 0 })
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const timers = useRef<ReturnType<typeof setInterval>[]>([])

  // Detect reduced-motion once on mount.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  // Auto-advance.
  useEffect(() => {
    if (reducedMotion || paused) return
    const id = setInterval(() => setScene((s) => (s + 1) % 3), SCENE_MS)
    return () => clearInterval(id)
  }, [reducedMotion, paused])

  // Per-scene effects.
  useEffect(() => {
    timers.current.forEach(clearInterval)
    timers.current = []

    if (scene === 0) {
      if (reducedMotion) {
        setTyped(labels.dealTitleTyped)
        return
      }
      setTyped("")
      let i = 0
      const id = setInterval(() => {
        i++
        setTyped(labels.dealTitleTyped.slice(0, i))
        if (i >= labels.dealTitleTyped.length) clearInterval(id)
      }, 55)
      timers.current.push(id)
    }

    if (scene === 1) {
      if (reducedMotion) {
        setClaims(TARGETS.claims)
        return
      }
      setClaims(0)
      const id = setInterval(() => {
        setClaims((c) => {
          if (c >= TARGETS.claims) {
            clearInterval(id)
            return c
          }
          return c + 1
        })
      }, 420)
      timers.current.push(id)
    }

    if (scene === 2) {
      if (reducedMotion) {
        setStats(TARGETS)
        return
      }
      setStats({ views: 0, claims: 0, redeems: 0 })
      const steps = 30
      let n = 0
      const id = setInterval(() => {
        n++
        const f = Math.min(1, n / steps)
        // ease-out cubic
        const e = 1 - Math.pow(1 - f, 3)
        setStats({
          views: Math.round(TARGETS.views * e),
          claims: Math.round(TARGETS.claims * e),
          redeems: Math.round(TARGETS.redeems * e),
        })
        if (n >= steps) clearInterval(id)
      }, 60)
      timers.current.push(id)
    }

    return () => {
      timers.current.forEach(clearInterval)
      timers.current = []
    }
  }, [scene, reducedMotion, labels.dealTitleTyped])

  const typingDone = typed.length >= labels.dealTitleTyped.length

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* Scene selector — the three steps as clickable captions */}
        <ol className="space-y-3">
          {labels.scenes.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => setScene(i)}
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
                {/* progress bar for the active scene */}
                {scene === i && !reducedMotion && !paused && (
                  <span className="mt-3 ml-11 block h-1 overflow-hidden rounded-full bg-primary/10">
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

        {/* Stage — mock panel */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="overflow-hidden rounded-3xl border-2 border-primary/15 bg-card shadow-xl">
            {/* Mock top bar */}
            <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-gold/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/30" />
              <span className="ml-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {scene === 0 ? labels.formLabel : scene === 1 ? labels.feedHeader : labels.statsHeader}
              </span>
            </div>

            <div className="min-h-[290px] p-5">
              {/* Scene 1 — post the deal */}
              {scene === 0 && (
                <div className="animate-fade-up space-y-4">
                  <div className="rounded-xl border bg-background p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {labels.formLabel}
                    </p>
                    <p className="mt-2 min-h-[1.75rem] font-display text-lg font-semibold">
                      {typed}
                      {!typingDone && <span className="animate-pulse text-primary">|</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`pointer-events-none inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors ${
                      typingDone
                        ? "animate-pulse bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Send className="h-4 w-4" />
                    {labels.publish}
                  </button>
                  {typingDone && (
                    <p className="inline-flex items-center gap-1.5 text-sm font-medium text-success animate-fade-up">
                      <CheckCircle2 className="h-4 w-4" />
                      {labels.published}
                    </p>
                  )}
                </div>
              )}

              {/* Scene 2 — locals see it */}
              {scene === 1 && (
                <div className="animate-fade-up">
                  <div className="relative overflow-visible rounded-2xl border bg-background shadow-sm">
                    <div className="flex h-24 items-center justify-center rounded-t-2xl bg-gradient-to-br from-primary/15 via-gold/10 to-success/10">
                      <Tag className="h-8 w-8 text-primary/30" />
                      <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-gold-foreground">
                        {labels.demoDiscount}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                        {labels.demoBizName}
                      </p>
                      <p className="font-display text-base font-semibold">{labels.dealTitleTyped}</p>
                    </div>
                    {/* floating hearts */}
                    {!reducedMotion &&
                      [0, 1, 2].map((n) => (
                        <Heart
                          key={n}
                          aria-hidden
                          className="absolute right-4 h-5 w-5 fill-primary text-primary opacity-0"
                          style={{
                            bottom: "1rem",
                            animation: `demo-heart 2.2s ease-out ${n * 0.55}s infinite`,
                          }}
                        />
                      ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl border bg-background px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-sm font-medium">
                      <Ticket className="h-4 w-4 text-primary" />
                      {labels.claimsLabel}
                    </span>
                    <span className="font-display text-2xl font-bold text-primary tabular-nums">
                      {claims}
                    </span>
                  </div>
                </div>
              )}

              {/* Scene 3 — stats grow */}
              {scene === 2 && (
                <div className="animate-fade-up space-y-4">
                  {(
                    [
                      { label: labels.viewsLabel, value: stats.views, target: TARGETS.views, icon: <Eye className="h-4 w-4" />, bar: "bg-primary" },
                      { label: labels.claimsLabel, value: stats.claims, target: TARGETS.claims, icon: <Ticket className="h-4 w-4" />, bar: "bg-gold" },
                      { label: labels.redeemsLabel, value: stats.redeems, target: TARGETS.redeems, icon: <CheckCircle2 className="h-4 w-4" />, bar: "bg-success" },
                    ] as const
                  ).map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2 font-medium">
                          <span className="text-primary">{row.icon}</span>
                          {row.label}
                        </span>
                        <span className="font-display text-lg font-bold tabular-nums">{row.value}</span>
                      </div>
                      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${row.bar} transition-[width] duration-200`}
                          style={{ width: `${(row.value / row.target) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-success">
                    <TrendingUp className="h-4 w-4" />
                    {labels.liveChip}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* local keyframes for the demo only */}
      <style>{`
        @keyframes demo-progress { from { width: 0% } to { width: 100% } }
        @keyframes demo-heart {
          0% { opacity: 0; transform: translateY(0) scale(0.7); }
          15% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-72px) scale(1.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes demo-progress { from { width: 100% } to { width: 100% } }
        }
      `}</style>
    </div>
  )
}
