import { ImageResponse } from "next/og"
import { getBusinessBySlug } from "@/lib/queries"

// Per-business social share cover. A shared business link has to preview THAT business —
// their own cover photo and their own logo — not our house card (owner, Sep 19 2026:
// "the plumbing company is showing just the cover of the local Lompoc"). We stay as a small
// presenter strip at the bottom. Falls back to the branded card when a listing has no photo.
export const alt = "Lompoc Locals business"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 136 314 402">' +
  '<path fill="#efc618" fill-rule="evenodd" d="M257,161.4c-10-17.2-32.1-23.1-49.4-13.1-17.2,10-23.1,32.1-13.1,49.4,10,17.2,32.1,23.1,49.4,13.1,17.2-10,23.1-32.1,13.1-49.4"/>' +
  '<path fill="#0b992f" d="M217.6,334.1c40.9-41.5,89.3-69.6,151.4-52.3-49.4-64.1-103.3-64.5-154.4-36.9,5.2,27.4,5.5,58.1,3.1,89.2"/>' +
  '<path fill="#ffffff" d="M250.9,465.7h0s-72.8,0-72.8,0c21.8-102.6,83.4-304.7-107.3-296.1,108.1,59.5,27.8,259.1,6.6,359.2h244v-63.1h-70.5Z"/>' +
  "</svg>"

// satori cannot fetch remote images itself reliably (timeouts, HEIC, redirects, huge files),
// so every image is fetched here, type-checked and size-capped, then inlined as a data URI.
async function inline(url: string | null | undefined, maxBytes = 3_000_000): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    const ct = (res.headers.get("content-type") ?? "").split(";")[0]
    if (!res.ok || !/^image\/(jpeg|png|webp)$/.test(ct)) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > maxBytes) return null
    return `data:${ct};base64,${buf.toString("base64")}`
  } catch {
    return null
  }
}

export default async function BizOpengraphImage({ params }: { params: { slug: string } }) {
  const data = await getBusinessBySlug(params.slug).catch(() => null)
  const b = data?.business
  const name = b?.name ?? "A local business"
  const category = b?.category?.name ?? null
  const mark = `data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`

  const [photo, logo] = await Promise.all([
    inline(b?.coverUrl ?? (Array.isArray(b?.photosJson) ? (b.photosJson[0] as string) : null)),
    inline(b?.logoUrl ?? null, 1_500_000),
  ])

  const nameSize = name.length > 34 ? 56 : name.length > 22 ? 68 : 80

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#650C75",
          backgroundImage:
            "radial-gradient(60% 55% at 88% 0%, rgba(239,198,24,0.26) 0%, transparent 60%), linear-gradient(135deg, #4a0857, #650C75 55%, #37043f)",
          color: "white",
        }}
      >
        {/* their photo fills the card */}
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover" }}
          />
        ) : null}
        {/* legibility scrim under the type */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: photo
              ? "linear-gradient(90deg, rgba(20,10,23,0.94) 0%, rgba(20,10,23,0.80) 46%, rgba(20,10,23,0.18) 100%)"
              : "linear-gradient(90deg, rgba(20,10,23,0.30) 0%, rgba(20,10,23,0.10) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
            width: 820,
          }}
        >
          {/* their logo leads */}
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                width={104}
                height={104}
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 20,
                  objectFit: "contain",
                  backgroundColor: "#ffffff",
                  padding: 8,
                }}
              />
            ) : null}
            {category ? (
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "#EFC618",
                }}
              >
                {category}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: nameSize, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
              {name}
            </div>
            {b?.address ? (
              <div style={{ marginTop: 14, fontSize: 27, fontWeight: 600, color: "rgba(255,255,255,0.86)" }}>
                {b.address.split(",")[0]} · Lompoc, CA
              </div>
            ) : null}
          </div>

          {/* presenter strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mark} width={30} height={38} alt="" />
            <div style={{ fontSize: 24, fontWeight: 600, color: "rgba(255,255,255,0.82)" }}>
              on Lompoc Locals
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
