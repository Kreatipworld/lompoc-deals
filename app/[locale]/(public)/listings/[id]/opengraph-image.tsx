import { ImageResponse } from "next/og"
import { getListingById } from "@/lib/queries"
import { formatListingFacts, formatListingPriceShort, homeTypeLinePlain } from "@/lib/listing-utils"

// Per-home social share card: the home's own cover photo with the price, facts,
// address and agent, so a shared listing link previews the house, not the site.
export const alt = "Home for sale or rent in Lompoc on Lompoc Locals"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 136 314 402">' +
  '<path fill="#efc618" fill-rule="evenodd" d="M257,161.4c-10-17.2-32.1-23.1-49.4-13.1-17.2,10-23.1,32.1-13.1,49.4,10,17.2,32.1,23.1,49.4,13.1,17.2-10,23.1-32.1,13.1-49.4"/>' +
  '<path fill="#0b992f" d="M217.6,334.1c40.9-41.5,89.3-69.6,151.4-52.3-49.4-64.1-103.3-64.5-154.4-36.9,5.2,27.4,5.5,58.1,3.1,89.2"/>' +
  '<path fill="#ffffff" d="M250.9,465.7h0s-72.8,0-72.8,0c21.8-102.6,83.4-304.7-107.3-296.1,108.1,59.5,27.8,259.1,6.6,359.2h244v-63.1h-70.5Z"/>' +
  "</svg>"

const HOUSE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>'

export default async function ListingOpengraphImage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10)
  const listing = isNaN(id) ? null : await getListingById(id).catch(() => null)
  const mark = `data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`
  const house = `data:image/svg+xml;base64,${Buffer.from(HOUSE).toString("base64")}`

  // Embed the cover as a data URI: satori's own remote fetch is the usual reason a
  // per-item OG route 500s (timeouts, HEIC/oversized sources, redirects).
  let photo: string | null = null
  if (listing?.imageUrl) {
    try {
      const res = await fetch(listing.imageUrl, { signal: AbortSignal.timeout(6000) })
      const ct = res.headers.get("content-type") ?? ""
      if (res.ok && /^image\/(jpeg|png|webp)/.test(ct)) {
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length < 8_000_000) photo = `data:${ct.split(";")[0]};base64,${buf.toString("base64")}`
      }
    } catch {
      photo = null
    }
  }
  const price = listing ? formatListingPriceShort(listing.priceCents, listing.type) : ""
  const facts = listing ? formatListingFacts(listing.beds, listing.baths, listing.sqft) : ""
  const typeLine = listing ? homeTypeLinePlain(listing.homeType, listing.type) : ""
  const address = listing?.address ?? "Lompoc, CA"
  const agent = listing?.business.name ?? ""

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#2c0736",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: "linear-gradient(135deg, #4a0857, #650C75 55%, #37043f)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={house} width={160} height={160} alt="" style={{ opacity: 0.7 }} />
          </div>
        )}

        {/* bottom gradient so the type reads on any photo */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            backgroundImage:
              "linear-gradient(to top, rgba(20,6,26,0.94) 0%, rgba(20,6,26,0.72) 32%, rgba(20,6,26,0.05) 62%, rgba(20,6,26,0.0) 100%)",
          }}
        />

        {/* brand row */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 56,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "10px 18px 10px 12px",
            borderRadius: 999,
            backgroundColor: "rgba(20,6,26,0.62)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={30} height={38} alt="" />
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>lompoclocals.com/homes</div>
        </div>

        {/* status chip */}
        {listing ? (
          <div
            style={{
              position: "absolute",
              top: 44,
              right: 56,
              padding: "8px 16px",
              borderRadius: 999,
              backgroundColor: listing.type === "for-rent" ? "#0B992F" : "#EFC618",
              color: listing.type === "for-rent" ? "#ffffff" : "#241629",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {listing.type === "for-rent" ? "For rent" : "For sale"}
          </div>
        ) : null}

        {/* home block */}
        <div style={{ position: "absolute", left: 56, right: 56, bottom: 44, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>{price || "Homes in Lompoc"}</div>
          <div style={{ fontSize: 30, fontWeight: 600, marginTop: 14, color: "rgba(255,255,255,0.95)" }}>
            {[facts, typeLine].filter(Boolean).join("  ·  ")}
          </div>
          <div style={{ fontSize: 26, marginTop: 8, color: "rgba(255,255,255,0.85)" }}>{address}</div>
          {agent ? (
            <div style={{ fontSize: 22, marginTop: 14, color: "#EFC618", fontWeight: 700 }}>Listed by {agent}</div>
          ) : null}
        </div>
      </div>
    ),
    { ...size }
  )
}
