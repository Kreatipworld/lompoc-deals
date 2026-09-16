import { ImageResponse } from "next/og"
import { OgCard, OG_SIZE, OG_TYPE, photoDataUri } from "@/lib/og-card"
import { siteUrl } from "@/lib/seo"
export const alt = "Deals from Lompoc businesses — Lompoc Locals"
export const size = OG_SIZE
export const contentType = OG_TYPE

export default async function Image({ params }: { params: { locale: string } }) {
  const es = params.locale === "es"
  const photo = await photoDataUri(`${siteUrl}/lompoc-community.jpg`)
  return new ImageResponse(
    <OgCard photo={photo} kicker={es ? "Ofertas" : "Deals"} title={es ? "Ofertas de negocios de Lompoc" : "Deals from Lompoc businesses"} subtitle={es ? "Cupones y promociones de la gente de tu calle" : "Coupons and specials from the people down the street"} url="lompoclocals.com/deals" />,
    { ...OG_SIZE }
  )
}
