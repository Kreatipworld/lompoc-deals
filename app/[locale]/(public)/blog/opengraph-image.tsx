import { ImageResponse } from "next/og"
import { OgCard, OG_SIZE, OG_TYPE, BLOB, photoDataUri } from "@/lib/og-card"

export const alt = "Local news, guides and stories from Lompoc — Lompoc Locals"
export const size = OG_SIZE
export const contentType = OG_TYPE

export default async function Image({ params }: { params: { locale: string } }) {
  const es = params.locale === "es"
  const photo = await photoDataUri(`${BLOB}/news-covers/lompoc-city-pines.jpg`)
  return new ImageResponse(
    <OgCard photo={photo} kicker="Lompoc Locals" title={es ? "Noticias, guías e historias de Lompoc" : "Lompoc news, guides & stories"} subtitle={es ? "Escrito aquí, para Lompoc" : "Written here, for Lompoc"} url="lompoclocals.com/blog" />,
    { ...OG_SIZE }
  )
}
