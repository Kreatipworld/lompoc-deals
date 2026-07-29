import { ImageResponse } from "next/og"
import { getBusinessBySlug } from "@/lib/queries"

// Per-business branded social share cover — the business name WITH the Lompoc
// Locals logo, so every shared business link carries our brand.
export const alt = "Lompoc Locals business"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 136 314 402">' +
  '<path fill="#efc618" fill-rule="evenodd" d="M257,161.4c-10-17.2-32.1-23.1-49.4-13.1-17.2,10-23.1,32.1-13.1,49.4,10,17.2,32.1,23.1,49.4,13.1,17.2-10,23.1-32.1,13.1-49.4"/>' +
  '<path fill="#0b992f" d="M217.6,334.1c40.9-41.5,89.3-69.6,151.4-52.3-49.4-64.1-103.3-64.5-154.4-36.9,5.2,27.4,5.5,58.1,3.1,89.2"/>' +
  '<path fill="#ffffff" d="M250.9,465.7h0s-72.8,0-72.8,0c21.8-102.6,83.4-304.7-107.3-296.1,108.1,59.5,27.8,259.1,6.6,359.2h244v-63.1h-70.5Z"/>' +
  "</svg>"

export default async function BizOpengraphImage({
  params,
}: {
  params: { slug: string }
}) {
  const data = await getBusinessBySlug(params.slug).catch(() => null)
  const name = data?.business.name ?? "A local business"
  const category = data?.business.category?.name ?? null
  const mark = `data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`

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
        }}
      >
        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={46} height={59} alt="" />
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>Lompoc Locals</div>
        </div>

        {/* business name */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {category ? (
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "#EFC618",
                marginBottom: 14,
              }}
            >
              {category}
            </div>
          ) : null}
          <div style={{ fontSize: 82, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            {name}
          </div>
        </div>

        {/* footer */}
        <div style={{ fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
          Find them on lompoclocals.com
        </div>
      </div>
    ),
    { ...size }
  )
}
