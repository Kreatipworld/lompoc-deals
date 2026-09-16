import { ImageResponse } from "next/og"
import { OgCard, OG_SIZE, OG_TYPE, BLOB, photoDataUri } from "@/lib/og-card"

export const alt = "Braves & Conqs, every game — Lompoc Locals"
export const size = OG_SIZE
export const contentType = OG_TYPE

export default async function Image({ params }: { params: { locale: string } }) {
  const es = params.locale === "es"
  const photo = await photoDataUri(`${BLOB}/news-covers/huyck-stadium.jpg`)
  return new ImageResponse(
    <OgCard photo={photo} kicker={es ? "Fútbol americano de Lompoc" : "Lompoc Football"} title={es ? "Braves y Conqs, cada partido" : "Braves & Conqs, every game"} subtitle={es ? "Marcadores, calendarios, día de partido en Huyck Stadium" : "Scores, schedules, game day at Huyck Stadium"} url="lompoclocals.com/football" />,
    { ...OG_SIZE }
  )
}
