import { ImageResponse } from "next/og"
import { OgCard, OG_SIZE, OG_TYPE, photoDataUri } from "@/lib/og-card"
import { siteUrl } from "@/lib/seo"
export const alt = "Things to do in Lompoc — Lompoc Locals"
export const size = OG_SIZE
export const contentType = OG_TYPE

export default async function Image({ params }: { params: { locale: string } }) {
  const es = params.locale === "es"
  const photo = await photoDataUri(`${siteUrl}/activities/la-purisima-mission.jpg`)
  return new ImageResponse(
    <OgCard photo={photo} kicker={es ? "Qué hacer" : "Things to do"} title={es ? "Qué hacer en Lompoc" : "Things to do in Lompoc"} subtitle={es ? "Viñedos, playas, senderos, murales y más" : "Wine country, beaches, trails, murals and more"} url="lompoclocals.com/things-to-do" />,
    { ...OG_SIZE }
  )
}
