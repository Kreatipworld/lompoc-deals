import { and, eq, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { businesses, events } from "@/db/schema"
import { findSameDayDuplicate } from "@/lib/event-dedup"
import type { SyncReport } from "@/lib/event-sync"
import { eventCoverUrl, writeEventBlurb } from "@/lib/event-copy"

// Two more community calendars, so the site carries every public event in town without a
// hand sweep (owner, Oct 9 2026: "We need to have all the events in town").
//
//  - California State Parks publishes its events as an open ArcGIS FeatureServer. Layer 0 is
//    the event, layer 1 every occurrence (joined on parentglobalid). Park 513 = La Purísima.
//  - The Lompoc Record's community calendar runs on evvnt, whose discovery API returns JSON.
//    It is the only machine-readable copy of the Lompoc Library calendar (the city site
//    blocks bots).
//
// FACTS ONLY, same as the explorelompoc sync: title, time, venue, category. Descriptions
// are written in our words (lib/event-copy), covers are our own topic photos.

type EventCategory = typeof events.category._.data

const WINDOW_DAYS = 45
// Each new row costs one blurb call; stay well inside the cron's 120 s budget. Whatever is
// left over is picked up on the next morning's run.
const MAX_NEW_PER_SOURCE = 20

// Never promote alcohol (standing rule, Oct 7 2026), and keep government meetings and launch
// copies out of the community calendar (launches belong to the launch-library feed).
const SKIP_TITLE = /\b(wine|beer|brew|brewery|cocktail|happy hour|tasting|pub crawl|whisk(e)?y|tequila|margarita|council meeting|commission meeting|board meeting|rocket launch|starlink|falcon)\b/i
const LOMPOC_ZIPS = new Set(["93436", "93437", "93438"])

// Feed venue names that differ from our listing's name.
const VENUE_ALIASES: Record<string, string> = {
  "lompoc library": "lompoc public library",
  "la purisima mission state historic park": "mission la purísima",
}

async function businessIdForVenue(raw: string | null | undefined): Promise<number | null> {
  if (!raw) return null
  const key = raw.trim().toLowerCase()
  const name = VENUE_ALIASES[key] ?? key
  const rows = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.status, "approved"), sql`lower(trim(${businesses.name})) = ${name}`))
    .limit(1)
  return rows[0]?.id ?? null
}

/** Insert one occurrence unless it (or the same event from another feed) is already there. */
async function upsert(
  source: string,
  externalId: string,
  facts: { title: string; location: string; category: EventCategory; startsAt: Date; endsAt: Date | null },
  sourceText: string | null,
  businessId: number | null
): Promise<"updated" | "duplicate" | "inserted"> {
  const existing = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.source, source), eq(events.externalId, externalId)))
    .limit(1)
  if (existing.length > 0) {
    // Times and titles shift; keep our description and cover.
    await db.update(events).set(facts).where(eq(events.id, existing[0].id))
    return "updated"
  }
  if (await findSameDayDuplicate(facts.title, facts.startsAt, facts.location)) return "duplicate"
  const description = await writeEventBlurb({ ...facts, sourceText })
  await db.insert(events).values({
    ...facts,
    description,
    imageUrl: eventCoverUrl(facts.category),
    businessId,
    status: "approved",
    source,
    externalId,
  })
  return "inserted"
}

// ── California State Parks (La Purísima Mission) ──────────────────────────────────────────

const CSP = "https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/CSP_Events_v1.2_Public/FeatureServer"
const LA_PURISIMA_UNIT = 513
const LA_PURISIMA_LOCATION = "La Purísima Mission State Historic Park, 2295 Purisima Rd, Lompoc"

type CspEvent = {
  globalid: string
  event_title: string
  event_description: string | null
  event_category: string | null
  activity_type: string | null
  event_costType: string | null
  event_cost: number | null
  parking_cost: number | null
}
type CspOccurrence = { globalid: string; parentglobalid: string; event_date_start: number; event_date_end: number | null; status: string | null }

async function arcgis<T>(layer: number, params: Record<string, string>): Promise<T[]> {
  const url = new URL(`${CSP}/${layer}/query`)
  for (const [k, v] of Object.entries({ f: "json", outFields: "*", ...params })) url.searchParams.set(k, v)
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`state parks ${res.status}`)
  const data = (await res.json()) as { features?: { attributes: T }[]; error?: { message: string } }
  if (data.error) throw new Error(`state parks: ${data.error.message}`)
  return (data.features ?? []).map((f) => f.attributes)
}

export async function syncStateParksEvents(): Promise<SyncReport> {
  let inserted = 0, skipped = 0, errors = 0
  const parents = await arcgis<CspEvent>(0, { where: `park_unit_num=${LA_PURISIMA_UNIT}` })
  if (parents.length === 0) return { inserted, skipped, errors, source: "stateparks" }
  const byId = new Map(parents.map((p) => [p.globalid, p]))

  const ts = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ")
  const from = new Date(), to = new Date(Date.now() + WINDOW_DAYS * 86_400_000)
  const ids = parents.map((p) => `'${p.globalid}'`).join(",")
  const occurrences = await arcgis<CspOccurrence>(1, {
    where: `parentglobalid IN (${ids}) AND event_date_start >= timestamp '${ts(from)}' AND event_date_start < timestamp '${ts(to)}'`,
    orderByFields: "event_date_start",
  })

  const businessId = await businessIdForVenue("La Purisima Mission State Historic Park")
  for (const o of occurrences) {
    if (inserted >= MAX_NEW_PER_SOURCE) break
    const p = byId.get(o.parentglobalid)
    if (!p || (o.status && o.status.toLowerCase() !== "active")) { skipped++; continue }
    try {
      // "at La Purísima Mission" ties the feed's generic titles ("Junior Ranger Program") to the
      // place, and lines them up with hand-curated rows for the dedup check.
      const title = `${p.event_title.trim()} at La Purísima Mission`.slice(0, 300)
      if (SKIP_TITLE.test(title)) { skipped++; continue }
      const cost = p.event_costType === "Free" ? "Free" : p.event_cost ? `$${p.event_cost}` : null
      const sourceText = [
        p.event_description,
        cost ? `Cost: ${cost}.` : null,
        p.parking_cost ? `Parking: $${p.parking_cost} per vehicle.` : null,
        p.event_category ? `Format: ${p.event_category}.` : null,
      ].filter(Boolean).join("\n")
      const outcome = await upsert(
        "stateparks",
        o.globalid,
        {
          title,
          location: LA_PURISIMA_LOCATION,
          category: /concert|music|art/i.test(`${p.event_title} ${p.activity_type ?? ""}`) ? "arts" : "community",
          startsAt: new Date(o.event_date_start),
          endsAt: o.event_date_end ? new Date(o.event_date_end) : null,
        },
        sourceText,
        businessId
      )
      if (outcome === "inserted") inserted++
      else skipped++
    } catch {
      errors++
    }
  }
  return { inserted, skipped, errors, source: "stateparks" }
}

// ── Lompoc Record community calendar (evvnt) ──────────────────────────────────────────────

const EVVNT = "https://discovery.evvnt.com/api/publisher/5310/home_page_events?hitsPerPage=1000"

type EvvntEvent = {
  objectID: string
  title: string
  summary?: string | null
  description?: string | null
  category_name?: string | null
  start_time: string // ISO with offset
  end_time?: string | null
  prices?: Record<string, unknown>
  venue?: { name?: string | null; address_1?: string | null; town?: string | null; post_code?: string | null }
}

function evvntCategory(e: EvvntEvent): EventCategory {
  const c = `${e.category_name ?? ""} ${e.title}`.toLowerCase()
  if (/music|concert|art|theat|film|comedy|dance|gallery/.test(c)) return "arts"
  if (/market|craft fair|vendor|book sale/.test(c)) return "market"
  if (/sport|run|race|fitness|golf|swim/.test(c)) return "sports"
  if (/festival|parade|holiday|halloween|trick or treat/.test(c)) return "festival"
  if (/food|dinner|breakfast|bbq/.test(c)) return "food"
  return "community"
}

export async function syncEvvntEvents(): Promise<SyncReport> {
  let inserted = 0, skipped = 0, errors = 0
  const res = await fetch(EVVNT, { cache: "no-store" })
  if (!res.ok) throw new Error(`evvnt ${res.status}`)
  const data = (await res.json()) as { rawEvents?: EvvntEvent[] }
  const now = Date.now(), horizon = now + WINDOW_DAYS * 86_400_000

  for (const e of data.rawEvents ?? []) {
    if (inserted >= MAX_NEW_PER_SOURCE) break
    const v = e.venue ?? {}
    const inTown = /lompoc|vandenberg/i.test(v.town ?? "") || LOMPOC_ZIPS.has((v.post_code ?? "").trim())
    if (!inTown) continue
    const startsAt = new Date(e.start_time)
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < now || startsAt.getTime() > horizon) continue
    const title = e.title.replace(/\s*\|\s*/g, ", ").replace(/\s+/g, " ").trim().slice(0, 300)
    if (SKIP_TITLE.test(`${title} ${e.summary ?? ""}`)) { skipped++; continue }
    try {
      const location = [v.name, v.address_1, "Lompoc"].filter(Boolean).join(", ").slice(0, 500)
      const outcome = await upsert(
        "evvnt",
        e.objectID,
        {
          title,
          location,
          category: evvntCategory(e),
          startsAt,
          endsAt: e.end_time ? new Date(e.end_time) : null,
        },
        [e.summary, e.description].filter(Boolean).join("\n").slice(0, 2000) || null,
        await businessIdForVenue(v.name)
      )
      if (outcome === "inserted") inserted++
      else skipped++
    } catch {
      errors++
    }
  }
  return { inserted, skipped, errors, source: "evvnt" }
}
