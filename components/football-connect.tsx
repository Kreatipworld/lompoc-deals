"use client"

import { track } from "@vercel/analytics"
import { useState, type ReactNode } from "react"
import { Bell, Camera, Check, Share2 } from "lucide-react"

function Instagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function Facebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.4H7.4V14h2.8v8h3.3z" />
    </svg>
  )
}

type Action = "alerts" | "follow" | "share" | "photos" | "calendar"

/**
 * Records a "stay connected" action on the football page. Same contract as OutboundLink: the
 * click always does its job; analytics never gets in the way.
 */
export function recordConnect(action: Action, detail?: string) {
  const props = { action, ...(detail ? { detail } : {}) }
  try {
    track("football_connect", props)
  } catch {}
  try {
    const body = JSON.stringify({ name: "football_connect", props })
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/track/event", new Blob([body], { type: "application/json" }))
    } else {
      void fetch("/api/track/event", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {})
    }
  } catch {}
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.5 3c.3 2.4 1.8 3.9 4.2 4.1v3.1c-1.6 0-3-.5-4.2-1.3v6.4a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.2a2.5 2.5 0 1 0 1.6 2.3V3h3.1z" />
    </svg>
  )
}

function Tile({ icon, title, body, children }: { icon: ReactNode; title: string; body: string; children?: ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/80 bg-card p-4">
      <div className="flex items-center gap-2 text-primary">{icon}<h3 className="text-sm font-bold text-foreground">{title}</h3></div>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
      <div className="mt-auto pt-3">{children}</div>
    </div>
  )
}

export function FootballConnect({
  labels,
  pageUrl,
  social,
}: {
  labels: {
    heading: string
    alertsTitle: string
    alertsBody: string
    alertsCta: string
    followTitle: string
    followBody: string
    shareTitle: string
    shareBody: string
    shareCta: string
    shareCopied: string
    shareText: string
    photosTitle: string
    photosBody: string
    photosCta: string
  }
  pageUrl: string
  social: { instagram: string; tiktok: string; facebook: string }
}) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    recordConnect("share")
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: labels.shareText, url: pageUrl })
        return
      }
    } catch {
      // user dismissed the sheet — fall through to the copy path only if nothing was shared
      return
    }
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const btn = "inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition"
  const round = "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-background text-foreground transition hover:border-primary hover:text-primary"

  return (
    <section aria-labelledby="football-connect" className="mt-8">
      <h2 id="football-connect" className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{labels.heading}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon={<Bell className="h-4 w-4" />} title={labels.alertsTitle} body={labels.alertsBody}>
          <a href="#alerts" onClick={() => recordConnect("alerts")} className={`${btn} bg-primary text-white hover:bg-primary/90`}>{labels.alertsCta}</a>
        </Tile>
        <Tile icon={<Instagram className="h-4 w-4" />} title={labels.followTitle} body={labels.followBody}>
          <div className="flex gap-2">
            <a href={social.instagram} target="_blank" rel="noopener" aria-label="Instagram" onClick={() => recordConnect("follow", "instagram")} className={round}><Instagram className="h-4 w-4" /></a>
            <a href={social.tiktok} target="_blank" rel="noopener" aria-label="TikTok" onClick={() => recordConnect("follow", "tiktok")} className={round}><TikTokIcon className="h-4 w-4" /></a>
            <a href={social.facebook} target="_blank" rel="noopener" aria-label="Facebook" onClick={() => recordConnect("follow", "facebook")} className={round}><Facebook className="h-4 w-4" /></a>
          </div>
        </Tile>
        <Tile icon={<Share2 className="h-4 w-4" />} title={labels.shareTitle} body={labels.shareBody}>
          <button type="button" onClick={share} className={`${btn} border border-primary text-primary hover:bg-primary/5`} aria-live="polite">
            {copied ? <><Check className="h-3.5 w-3.5" /> {labels.shareCopied}</> : <><Share2 className="h-3.5 w-3.5" /> {labels.shareCta}</>}
          </button>
        </Tile>
        <Tile icon={<Camera className="h-4 w-4" />} title={labels.photosTitle} body={labels.photosBody}>
          <a href="mailto:hello@lompoclocals.com?subject=Lompoc%20football%20photos" onClick={() => recordConnect("photos")} className={`${btn} border border-border text-foreground hover:border-primary hover:text-primary`}>{labels.photosCta}</a>
        </Tile>
      </div>
    </section>
  )
}

/** A plain link that records the calendar action (server pages can render it). */
export function CalendarLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} onClick={() => recordConnect("calendar")} className={className}>
      {children}
    </a>
  )
}
