import { ImageResponse } from "next/og"
import { OgCard, OG_SIZE, OG_TYPE, BLOB, photoDataUri } from "@/lib/og-card"

export const alt = "Every Lompoc business on one map — Lompoc Locals"
export const size = OG_SIZE
export const contentType = OG_TYPE

export default async function Image({ params }: { params: { locale: string } }) {
  const es = params.locale === "es"
  const photo = await photoDataUri(`${BLOB}/news-covers/lompoc-valley-harris-grade.jpg`)
  return new ImageResponse(
    <OgCard photo={photo} kicker={es ? "Mapa interactivo" : "Interactive map"} title={es ? "Todos los negocios de Lompoc en un mapa" : "Every Lompoc business on one map"} subtitle={es ? "Restaurantes, tiendas, servicios, casas y ofertas · toca un pin" : "Restaurants, shops, services, homes and deals · tap a pin"} url="lompoclocals.com/map" />,
    { ...OG_SIZE }
  )
}
