import { ImageResponse } from "next/og"
import { OgCard, OG_SIZE, OG_TYPE, BLOB, photoDataUri } from "@/lib/og-card"
import { getAllRealEstateListings } from "@/lib/queries"
export const alt = "Lompoc's homes market is open — Lompoc Locals"
export const size = OG_SIZE
export const contentType = OG_TYPE

export default async function Image({ params }: { params: { locale: string } }) {
  const es = params.locale === "es"
  const [first] = await getAllRealEstateListings(undefined, 1).catch(() => [])
  const photo = (await photoDataUri(first?.imageUrl)) ?? (await photoDataUri(`${BLOB}/news-covers/lompoc-city-pines.jpg`))
  return new ImageResponse(
    <OgCard photo={photo} kicker={es ? "Para agentes de Lompoc" : "For Lompoc realtors"} title={es ? "El mercado de casas de Lompoc está abierto" : "Lompoc's homes market is open"} subtitle={es ? "Pon tus propiedades donde el pueblo ya mira · Plus $99.99/mes, cancela cuando quieras" : "Put your listings where the town already looks · Plus $99.99/mo, cancel anytime"} url="lompoclocals.com/realtors" />,
    { ...OG_SIZE }
  )
}
