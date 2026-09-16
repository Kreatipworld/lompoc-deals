import type { ReactElement } from "react"

/**
 * One social-share cover per page ("all the links we create have the same cover —
 * let's create a cover for each page", owner Sep 16 2026). A real photo of the
 * subject, a dark scrim, the page's own headline, the mark, the URL.
 * Used by every app/**\/opengraph-image.tsx; each route fetches its photo as a
 * data URI (satori's own remote fetch is the usual reason OG routes 500).
 */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_TYPE = "image/png"
export const BLOB = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com"

const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 136 314 402">' +
  '<path fill="#efc618" fill-rule="evenodd" d="M257,161.4c-10-17.2-32.1-23.1-49.4-13.1-17.2,10-23.1,32.1-13.1,49.4,10,17.2,32.1,23.1,49.4,13.1,17.2-10,23.1-32.1,13.1-49.4"/>' +
  '<path fill="#0b992f" d="M217.6,334.1c40.9-41.5,89.3-69.6,151.4-52.3-49.4-64.1-103.3-64.5-154.4-36.9,5.2,27.4,5.5,58.1,3.1,89.2"/>' +
  '<path fill="#ffffff" d="M250.9,465.7h0s-72.8,0-72.8,0c21.8-102.6,83.4-304.7-107.3-296.1,108.1,59.5,27.8,259.1,6.6,359.2h244v-63.1h-70.5Z"/>' +
  "</svg>"
export const MARK_URI = `data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`

/** Fetch a JPEG/PNG/WebP and inline it; null on anything odd so the card still renders. */
export async function photoDataUri(url: string | null | undefined, maxBytes = 8_000_000): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    const ct = res.headers.get("content-type") ?? ""
    if (!res.ok || !/^image\/(jpeg|png|webp)/.test(ct)) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > maxBytes) return null
    return `data:${ct.split(";")[0]};base64,${buf.toString("base64")}`
  } catch {
    return null
  }
}

export function OgCard({
  photo,
  kicker,
  title,
  subtitle,
  url = "lompoclocals.com",
  accent = "#EFC618",
}: {
  photo: string | null
  kicker: string
  title: string
  subtitle?: string
  url?: string
  accent?: string
}): ReactElement {
  return (
    <div style={{ height: "100%", width: "100%", display: "flex", position: "relative", backgroundColor: "#2c0736", color: "white", fontFamily: "sans-serif" }}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }} />
      ) : (
        <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, backgroundImage: "radial-gradient(60% 55% at 85% 0%, rgba(239,198,24,0.28) 0%, transparent 60%), radial-gradient(55% 55% at 0% 100%, rgba(11,153,47,0.30) 0%, transparent 60%), linear-gradient(135deg, #4a0857, #650C75 55%, #37043f)" }} />
      )}
      <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, backgroundImage: "linear-gradient(to top, rgba(20,6,24,0.92) 0%, rgba(20,6,24,0.55) 45%, rgba(20,6,24,0.15) 100%)" }} />
      <div style={{ position: "absolute", top: 44, left: 56, display: "flex", alignItems: "center", gap: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK_URI} width={54} height={69} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>Lompoc Locals</div>
          <div style={{ fontSize: 16, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>Lompoc, California</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 56, right: 56, bottom: 56, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex" }}>
          <div style={{ display: "flex", backgroundColor: accent, color: "#241629", fontSize: 20, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", padding: "8px 18px", borderRadius: 999 }}>{kicker}</div>
        </div>
        <div style={{ marginTop: 20, fontSize: title.length > 42 ? 58 : 70, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, textShadow: "0 4px 24px rgba(0,0,0,0.45)" }}>{title}</div>
        {subtitle && <div style={{ marginTop: 16, fontSize: 30, color: "rgba(255,255,255,0.9)", lineHeight: 1.3 }}>{subtitle}</div>}
        <div style={{ marginTop: 22, fontSize: 22, color: accent, fontWeight: 700, letterSpacing: 1 }}>{url}</div>
      </div>
    </div>
  )
}
