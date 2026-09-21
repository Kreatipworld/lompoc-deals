import { ImageResponse } from "next/og"
import { OgCard, OG_SIZE, OG_TYPE, BLOB, photoDataUri } from "@/lib/og-card"
import { db } from "@/db/client"
import { sql } from "drizzle-orm"

export const alt = "The businesses behind Lompoc Locals — Official Partners"
export const size = OG_SIZE
export const contentType = OG_TYPE

// Regenerate hourly. The card counts members and borrows a member photo, both
// of which change; without this the share card is frozen at build time.
export const revalidate = 3600

export default async function Image({ params }: { params: { locale: string } }) {
  const es = params.locale === "es"
  // Members = plan override or an active/trialing subscription — the same rule
  // lib/queries.ts tierRank and lib/member-tier.ts use.
  const r = await db
    .execute(sql`select count(distinct b.id)::int as n,
        min(coalesce(b.cover_url, b.photos_json->>0)) filter (where coalesce(b.cover_url, b.photos_json->>0) is not null) as photo
      from businesses b
      left join subscriptions s on s.user_id = b.owner_user_id
      where b.status = 'approved'
        and (b.plan_override in ('standard','premium')
             or (s.status in ('active','trialing') and s.tier in ('standard','premium')))`)
    .catch(() => ({ rows: [] as Record<string, unknown>[] }))
  const row = r.rows[0] as { n?: number; photo?: string | null } | undefined
  const n = Number(row?.n ?? 0)
  const photo =
    (await photoDataUri(row?.photo)) ?? (await photoDataUri(`${BLOB}/news-covers/lompoc-city-pines.jpg`))
  return new ImageResponse(
    <OgCard
      photo={photo}
      kicker={es ? "Socios oficiales" : "Official Partners"}
      title={es ? "Los negocios detrás de Lompoc Locals" : "The businesses behind Lompoc Locals"}
      subtitle={
        n > 0
          ? es
            ? `${n} negocios locales que sostienen la plataforma`
            : `${n} local businesses that keep this town's feed running`
          : undefined
      }
      url="lompoclocals.com/members"
    />,
    { ...OG_SIZE }
  )
}
