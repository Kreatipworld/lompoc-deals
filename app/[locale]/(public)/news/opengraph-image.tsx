import { ImageResponse } from "next/og"
import { OgCard, OG_SIZE, OG_TYPE, BLOB, photoDataUri } from "@/lib/og-card"

export const alt = "Your source for Lompoc news — Lompoc Locals"
export const size = OG_SIZE
export const contentType = OG_TYPE

export default async function Image({ params }: { params: { locale: string } }) {
  const es = params.locale === "es"
  const photo = await photoDataUri(`${BLOB}/news-covers/lompoc-civic-center.jpg`)
  return new ImageResponse(
    <OgCard photo={photo} kicker={es ? "Lompoc Locals News" : "Lompoc Locals News"} title={es ? "Tu fuente de noticias de Lompoc" : "Your source for Lompoc news"} subtitle={es ? "Lompoc informado, mejor Lompoc" : "Informed Lompoc, better Lompoc"} url="lompoclocals.com/news" />,
    { ...OG_SIZE }
  )
}
