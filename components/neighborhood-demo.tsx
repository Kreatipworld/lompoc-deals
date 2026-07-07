"use client"

import { useEffect, useRef, useState } from "react"
import { Send, CheckCircle2, Heart, Eye, MessagesSquare, Tag } from "lucide-react"

// Storyboard for the neighborhood feed (same family as CouponDemo /
// MerchantDemo): post it → neighbors see it → you connect. Auto-advances
// with clickable step cards; manual clicks take over; honors
// prefers-reduced-motion.
export type NeighborhoodDemoLabels = {
  scenes: Array<{ title: string; body: string }>
  panelLabels: [string, string, string]
  formLabel: string
  postTyped: string
  publish: string
  published: string
  postChip: string
  seenLabel: string
  chatMsg1: string
  chatMsg2: string
  chatMsg3: string
  doneChip: string
}

const SCENE_MS = 4400
const SEEN_TARGET = 23

export function NeighborhoodDemo({ labels }: { labels: NeighborhoodDemoLabels }) {
  const [scene, setScene] = useState(0)
  const [typed, setTyped] = useState("")
  const [seen, setSeen] = useState(0)
  const [bubbles, setBubbles] = useState(0)
  const [paused, setPaused] = useState(false)
  const [manual, setManual] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const timers = useRef<ReturnType<typeof setInterval>[]>([])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    if (reducedMotion || paused || manual) return
    const id = setInterval(() => setScene((s) => (s + 1) % 3), SCENE_MS)
    return () => clearInterval(id)
  }, [reducedMotion, paused, manual])

  useEffect(() => {
    timers.current.forEach(clearInterval)
    timers.current = []

    if (scene === 0) {
      if (reducedMotion) {
        setTyped(labels.postTyped)
        return
      }
      setTyped("")
      let i = 0
      const id = setInterval(() => {
        i++
        setTyped(labels.postTyped.slice(0, i))
        if (i >= labels.postTyped.length) clearInterval(id)
      }, 50)
      timers.current.push(id)
    }

    if (scene === 1) {
      if (reducedMotion) {
        setSeen(SEEN_TARGET)
        return
      }
      setSeen(0)
      const id = setInterval(() => {
        setSeen((c) => {
          if (c >= SEEN_TARGET) {
            clearInterval(id)
            return c
          }
          return c + 1
        })
      }, 120)
      timers.current.push(id)
    }

    if (scene === 2) {
      if (reducedMotion) {
        setBubbles(3)
        return
      }
      setBubbles(0)
      let n = 0
      const id = setInterval(() => {
        n++
        setBubbles(n)
        if (n >= 3) clearInterval(id)
      }, 900)
      timers.current.push(id)
    }

    return () => {
      timers.current.forEach(clearInterval)
      timers.current = []
    }
  }, [scene, reducedMotion, labels.postTyped])

  function goTo(next: number, byUser = false) {
    if (byUser) setManual(true)
    setScene(next)
  }

  const typingDone = typed.length >= labels.postTyped.length
  const showProgress = !reducedMotion && !paused && !manual

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1.05fr]"
    >
      {/* Scene selector */}
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

      {/* Stage */}
      <div className="mx-auto w-full max-w-sm">
        <div className="overflow-hidden rounded-3xl border-2 border-primary/15 bg-card shadow-xl">
          <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-gold/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/30" />
            <span className="ml-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {labels.panelLabels[scene]}
            </span>
          </div>

          <div className="min-h-[300px] p-5">
            {/* Scene 1 — write the post */}
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

            {/* Scene 2 — neighbors see it */}
            {scene === 1 && (
              <div className="animate-fade-up">
                <div className="relative overflow-visible rounded-2xl border bg-background shadow-sm">
                  <div className="flex h-20 items-center justify-center rounded-t-2xl bg-gradient-to-br from-gold/15 via-primary/10 to-success/10">
                    <Tag className="h-7 w-7 text-primary/30" />
                    <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">
                      {labels.postChip}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="font-display text-base font-semibold">{labels.postTyped}</p>
                  </div>
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
                    <Eye className="h-4 w-4 text-primary" />
                    {labels.seenLabel}
                  </span>
                  <span className="font-display text-2xl font-bold text-primary tabular-nums">{seen}</span>
                </div>
              </div>
            )}

            {/* Scene 3 — the conversation */}
            {scene === 2 && (
              <div className="animate-fade-up space-y-3">
                {bubbles >= 1 && (
                  <div className="max-w-[85%] animate-fade-up rounded-2xl rounded-tl-md border bg-background px-4 py-2.5 text-sm">
                    {labels.chatMsg1}
                  </div>
                )}
                {bubbles >= 2 && (
                  <div className="ml-auto max-w-[85%] animate-fade-up rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {labels.chatMsg2}
                  </div>
                )}
                {bubbles >= 3 && (
                  <div className="max-w-[85%] animate-fade-up rounded-2xl rounded-tl-md border bg-background px-4 py-2.5 text-sm">
                    {labels.chatMsg3}
                  </div>
                )}
                {bubbles >= 3 && (
                  <p className="inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-success animate-fade-up">
                    <MessagesSquare className="h-4 w-4" />
                    {labels.doneChip}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes demo-progress { from { width: 0% } to { width: 100% } }
        @keyframes demo-heart {
          0% { opacity: 0; transform: translateY(0) scale(0.7); }
          15% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-72px) scale(1.15); }
        }
      `}</style>
    </div>
  )
}
