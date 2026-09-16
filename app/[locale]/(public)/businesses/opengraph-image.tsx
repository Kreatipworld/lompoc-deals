import { ImageResponse } from "next/og"
import { OgCard, OG_SIZE, OG_TYPE, BLOB, photoDataUri } from "@/lib/og-card"

import { db } from "@/db/client"
import { sql } from "drizzle-orm"
export const alt = "Find any business in Lompoc — Lompoc Locals"
export const size = OG_SIZE
export const contentType = OG_TYPE

export default async function Image({ params }: { params: { locale: string } }) {
  const es = params.locale === "es"
  const photo = await photoDataUri(`${BLOB}/news-covers/lompoc-city-pines.jpg`)
  const r = await db.execute(sql`select count(*)::int as n from businesses where status = 'approved'`).catch(() => ({ rows: [{ n: 450 }] }))
  const count = Number((r.rows[0] as { n?: number })?.n ?? 450)
  return new ImageResponse(
    <OgCard photo={photo} kicker={es ? "Directorio" : "Directory"} title={es ? "Encuentra cualquier negocio en Lompoc" : "Find any business in Lompoc"} subtitle={es ? `${count} negocios locales, horarios, ofertas y cómo llegar` : `${count} local businesses, hours, deals and directions`} url="lompoclocals.com/businesses" />,
    { ...OG_SIZE }
  )
}
