import { and, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { events } from "@/db/schema"
import type { SyncReport } from "@/lib/event-sync"

// explorelompoc.com (Lompoc tourism bureau) runs WordPress + The Events
// Calendar, which exposes a public REST API. The official city site
// (cityoflompoc.com) blocks bots, so this is our city/community source.
const TRIBE_API = "https://explorelompoc.com/wp-json/tribe/events/v1/events"
const SYNC_WINDOW_DAYS = 45

interface TribeEvent {
  id: number
  title: string
  description?: string // HTML
  start_date: string // "2026-07-16 11:00:00" local (America/Los_Angeles)
  utc_start_date?: string
  end_date?: string
  utc_end_date?: string
  image?: { url?: string } | false
  venue?: { venue?: string; address?: string; city?: string } | []
  categories?: { name?: string; slug?: string }[]
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&#039;/g, "'")
    .replace(/&#8211;|&#8212;/g, "\u2014")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;/g, " ")
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
}

function toDate(utc: string | undefined, local: string): Date {
  // Prefer the UTC field; fall back to local time with the Lompoc offset
  if (utc) return new Date(utc + "Z")
  return new Date(local.replace(" ", "T"))
}

function mapCategory(cats: TribeEvent["categories"]): typeof events.category._.data {
  const slugs = (cats ?? []).map((c) => (c.slug ?? "").toLowerCase()).join(" ")
  if (/art|gallery|theat|music|film/.test(slugs)) return "arts"
  if (/market|fair|vendor/.test(slugs)) return "market"
  if (/food|wine|beer|taste/.test(slugs)) return "food"
  if (/sport|run|race|fitness/.test(slugs)) return "sports"
  if (/festival|holiday|parade/.test(slugs)) return "festival"
  return "community"
}

/**
 * Sync upcoming events from explorelompoc.com into the events table.
 * Upserts by (source, external_id); updates time/title if the event shifts.
 */
export async function syncExploreLompocEvents(): Promise<SyncReport> {
  let inserted = 0
  let skipped = 0
  let errors = 0

  const start = new Date()
  const end = new Date(Date.now() + SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  let page = 1
  let hasMore = true

  while (hasMore && page <= 5) {
    let data: { events?: TribeEvent[]; total_pages?: number }
    try {
      const url = `${TRIBE_API}?per_page=50&page=${page}&start_date=${fmt(start)}&end_date=${fmt(end)}`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) break
      data = (await res.json()) as typeof data
    } catch {
      errors++
      break
    }

    for (const evt of data.events ?? []) {
      try {
        const venue = Array.isArray(evt.venue) ? undefined : evt.venue
        const location =
          [venue?.venue, venue?.address, venue?.city ?? "Lompoc"]
            .filter(Boolean)
            .join(", ") || "Lompoc, CA"

        const values = {
          title: decodeEntities(evt.title).trim().slice(0, 300),
          description: evt.description
            ? stripHtml(evt.description).slice(0, 2000)
            : null,
          location: location.slice(0, 500),
          imageUrl:
            (evt.image && evt.image.url ? evt.image.url : null)?.slice(0, 1000) ??
            null,
          category: mapCategory(evt.categories),
          startsAt: toDate(evt.utc_start_date, evt.start_date),
          endsAt: evt.end_date
            ? toDate(evt.utc_end_date, evt.end_date)
            : null,
          status: "approved" as const,
          source: "explorelompoc",
          externalId: String(evt.id),
        }

        const existing = await db
          .select({ id: events.id })
          .from(events)
          .where(
            and(
              eq(events.source, "explorelompoc"),
              eq(events.externalId, String(evt.id))
            )
          )
          .limit(1)

        if (existing.length > 0) {
          await db
            .update(events)
            .set(values)
            .where(eq(events.id, existing[0].id))
          skipped++
        } else {
          await db.insert(events).values(values)
          inserted++
        }
      } catch {
        errors++
      }
    }

    hasMore = page < (data.total_pages ?? 1)
    page++
  }

  return { inserted, skipped, errors, source: "explorelompoc" }
}
