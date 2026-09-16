import { ImageResponse } from "next/og"
import { OgCard, OG_SIZE, OG_TYPE, BLOB, photoDataUri } from "@/lib/og-card"

export const alt = "This week in Lompoc — Lompoc Locals"
export const size = OG_SIZE
export const contentType = OG_TYPE

export default async function Image({ params }: { params: { locale: string } }) {
  const es = params.locale === "es"
  const photo = await photoDataUri(`${BLOB}/news-covers/lompoc-city-pines.jpg`)
  return new ImageResponse(
    <OgCard photo={photo} kicker={es ? "Esta Semana" : "This Week"} title={es ? "Esta semana en Lompoc" : "This week in Lompoc"} subtitle={es ? "Clima, partidos, eventos, ofertas y lo nuevo en el pueblo" : "Weather, games, events, deals and what's new in town"} url="lompoclocals.com/this-week" />,
    { ...OG_SIZE }
  )
}
