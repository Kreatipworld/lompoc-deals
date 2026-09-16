import { ImageResponse } from "next/og"
import { OgCard, OG_SIZE, OG_TYPE, BLOB, photoDataUri } from "@/lib/og-card"
import { getAllRealEstateListings } from "@/lib/queries"
export const alt = "Your listings, on the map the whole town uses — Lompoc Locals"
export const size = OG_SIZE
export const contentType = OG_TYPE

export default async function Image({ params }: { params: { locale: string } }) {
  const es = params.locale === "es"
  const [first] = await getAllRealEstateListings(undefined, 1).catch(() => [])
  const photo = (await photoDataUri(first?.imageUrl)) ?? (await photoDataUri(`${BLOB}/news-covers/lompoc-city-pines.jpg`))
  return new ImageResponse(
    <OgCard photo={photo} kicker={es ? "Para agentes de Lompoc" : "For Lompoc realtors"} title={es ? "Tus propiedades, en el mapa que usa todo el pueblo" : "Your listings, on the map the whole town uses"} subtitle={es ? "Membresía Plus · $99.99/mes · interesados directo a tu correo" : "Plus membership · $99.99/mo · leads straight to your inbox"} url="lompoclocals.com/realtors" />,
    { ...OG_SIZE }
  )
}
