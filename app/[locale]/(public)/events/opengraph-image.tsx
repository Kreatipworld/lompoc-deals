import { ImageResponse } from "next/og"
import { OgCard, OG_SIZE, OG_TYPE, BLOB, photoDataUri } from "@/lib/og-card"

export const alt = "What's happening in Lompoc — Lompoc Locals"
export const size = OG_SIZE
export const contentType = OG_TYPE

export default async function Image({ params }: { params: { locale: string } }) {
  const es = params.locale === "es"
  const photo = await photoDataUri(`${BLOB}/news-covers/riverbend-park-soccer.jpg`)
  return new ImageResponse(
    <OgCard photo={photo} kicker={es ? "Eventos" : "Events"} title={es ? "Qué pasa en Lompoc" : "What's happening in Lompoc"} subtitle={es ? "Partidos, mercados, shows y días comunitarios, en un solo calendario" : "Games, markets, shows and community days, all in one calendar"} url="lompoclocals.com/events" />,
    { ...OG_SIZE }
  )
}
