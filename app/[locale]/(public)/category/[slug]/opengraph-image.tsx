import { ImageResponse } from "next/og"
import { OgCard, OG_SIZE, OG_TYPE, BLOB, photoDataUri } from "@/lib/og-card"
import { db } from "@/db/client"
import { sql } from "drizzle-orm"

export const alt = "Lompoc businesses by category — Lompoc Locals"
export const size = OG_SIZE
export const contentType = OG_TYPE

// Regenerate hourly. This card counts businesses and borrows a member photo,
// both of which change; without it the card is frozen at build time.
export const revalidate = 3600

export default async function Image({ params }: { params: { locale: string; slug: string } }) {
  const es = params.locale === "es"
  const r = await db
    .execute(sql`select c.name, count(b.id)::int as n,
        (select coalesce(b2.cover_url, b2.photos_json->>0) from businesses b2 where b2.category_id = c.id and b2.status = 'approved' and coalesce(b2.cover_url, b2.photos_json->>0) is not null order by b2.sponsor_exclusive desc, b2.id limit 1) as photo
      from categories c left join businesses b on b.category_id = c.id and b.status = 'approved'
      where c.slug = ${params.slug} group by c.id`)
    .catch(() => ({ rows: [] as Record<string, unknown>[] }))
  const row = r.rows[0] as { name?: string; n?: number; photo?: string | null } | undefined
  const name = row?.name || "Lompoc"
  const n = Number(row?.n ?? 0)
  const photo = (await photoDataUri(row?.photo)) ?? (await photoDataUri(`${BLOB}/news-covers/lompoc-city-pines.jpg`))
  return new ImageResponse(
    <OgCard photo={photo} kicker={es ? "Directorio" : "Directory"} title={es ? `${name} en Lompoc` : `${name} in Lompoc`} subtitle={n > 0 ? (es ? `${n} negocios locales · horarios, ofertas y cómo llegar` : `${n} local businesses · hours, deals and directions`) : undefined} url={`lompoclocals.com/category/${params.slug}`} />,
    { ...OG_SIZE }
  )
}
