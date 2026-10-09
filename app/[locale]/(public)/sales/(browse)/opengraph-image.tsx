import { ImageResponse } from "next/og"
import { OgCard, OG_SIZE, OG_TYPE, BLOB, photoDataUri } from "@/lib/og-card"

export const alt = "Lompoc Sales — garage sales, used cars and things for sale by neighbors"
export const size = OG_SIZE
export const contentType = OG_TYPE

export default async function Image({ params }: { params: { locale: string } }) {
  const es = params.locale === "es"
  const photo = await photoDataUri(`${BLOB}/news-covers/lompoc-city-pines.jpg`)
  return new ImageResponse(
    <OgCard photo={photo} kicker="Lompoc Sales" title={es ? "Ventas de garaje, autos y más" : "Garage sales, used cars & more"} subtitle={es ? "De vecinos de Lompoc y Vandenberg" : "From neighbors in Lompoc and Vandenberg"} url="lompoclocals.com/sales" />,
    { ...OG_SIZE }
  )
}
