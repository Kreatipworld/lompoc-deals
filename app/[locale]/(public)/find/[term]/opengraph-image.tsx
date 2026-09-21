import { ImageResponse } from "next/og"
import { findTermBySlug } from "@/lib/find-terms"

// Share card for the curated search-word pages (/find/pizza …): brand field + the page title.
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Regenerate hourly. These cards are built from database rows, and without
// this the card is rendered once at build time and frozen there: a member
// uploads a new logo, their page updates, and every link they share keeps
// showing the old card. revalidateBusinessSurfaces busts the page route, not
// this one.
export const revalidate = 3600

const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 136 314 402">' +
  '<path fill="#efc618" fill-rule="evenodd" d="M257,161.4c-10-17.2-32.1-23.1-49.4-13.1-17.2,10-23.1,32.1-13.1,49.4,10,17.2,32.1,23.1,49.4,13.1,17.2-10,23.1-32.1,13.1-49.4"/>' +
  '<path fill="#0b992f" d="M217.6,334.1c40.9-41.5,89.3-69.6,151.4-52.3-49.4-64.1-103.3-64.5-154.4-36.9,5.2,27.4,5.5,58.1,3.1,89.2"/>' +
  '<path fill="#ffffff" d="M250.9,465.7h0s-72.8,0-72.8,0c21.8-102.6,83.4-304.7-107.3-296.1,108.1,59.5,27.8,259.1,6.6,359.2h244v-63.1h-70.5Z"/>' +
  "</svg>"

function loc(locale: string): "en" | "es" {
  return locale === "es" ? "es" : "en"
}

export default async function FindTermOpengraphImage({ params }: { params: Promise<{ locale: string; term: string }> }) {
  const { locale, term } = await params
  const t = findTermBySlug(term)
  const l = loc(locale)
  const title = t ? t.title[l] : "Lompoc Locals"
  const intro = t ? t.intro[l] : ""
  const sub = intro.length > 110 ? intro.slice(0, 110).replace(/\s+\S*$/, "") + "…" : intro
  const eyebrow = l === "es" ? "Encuéntralo en Lompoc" : "Find it in Lompoc"
  const mark = `data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`
  const big = title.length > 26 ? 64 : 88
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#650C75",
          backgroundImage:
            "radial-gradient(60% 55% at 88% 0%, rgba(239,198,24,0.26) 0%, transparent 60%), radial-gradient(55% 55% at 0% 100%, rgba(11,153,47,0.30) 0%, transparent 60%), linear-gradient(135deg, #4a0857, #650C75 55%, #37043f)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={46} height={59} alt="" />
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>Lompoc Locals</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#EFC618", marginBottom: 14 }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: big, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>{title}</div>
          {sub ? (
            <div style={{ fontSize: 30, fontWeight: 500, marginTop: 18, color: "rgba(255,255,255,0.9)", lineHeight: 1.3 }}>{sub}</div>
          ) : null}
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{`lompoclocals.com/find/${term}`}</div>
      </div>
    ),
    { ...size }
  )
}
