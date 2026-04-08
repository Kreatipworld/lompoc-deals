import { and, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { events } from "@/db/schema"

// Lompoc, CA coordinates
const LOMPOC_LAT = 34.6391
const LOMPOC_LNG = -120.4579
const SEARCH_RADIUS = "25mi"

// Map Eventbrite category IDs to our event categories
// https://www.eventbrite.com/platform/api#/reference/category/list/list-categories
const EVENTBRITE_CATEGORY_MAP: Record<string, typeof events.category._.data> =
  {
    "103": "festival", // Music
    "110": "food", // Food & Drink
    "105": "arts", // Arts
    "106": "arts", // Film & Media
    "111": "sports", // Sports & Fitness
    "113": "community", // Community & Culture
    "114": "community", // Charity & Causes
    "108": "market", // Hobbies & Interests
    "116": "market", // Business & Professional
    "115": "festival", // Seasonal & Holiday
    "117": "community", // Home & Lifestyle
    "118": "other", // Government & Politics
    "119": "other", // Fashion & Beauty
    "120": "other", // Health & Wellness
    "121": "other", // Science & Technology
    "122": "other", // Travel & Outdoor
    "123": "other", // Auto, Boat & Air
    "199": "other", // Other
  }

interface EventbriteVenue {
  address?: {
    localized_address_display?: string
    city?: string
    region?: string
  }
}

interface EventbriteEvent {
  id: string
  name: { text: string }
  description?: { text?: string | null }
  start: { utc: string }
  end?: { utc?: string }
  logo?: { url?: string; original?: { url?: string } } | null
  venue?: EventbriteVenue
  category_id?: string | null
}

interface EventbriteResponse {
  events: EventbriteEvent[]
  pagination: {
    has_more_items: boolean
    continuation?: string
  }
}

export type SyncReport = {
  inserted: number
  skipped: number
  errors: number
  source: string
}

export async function syncEventbriteEvents(): Promise<SyncReport> {
  const token = process.env.EVENTBRITE_PRIVATE_TOKEN
  if (!token) {
    return { inserted: 0, skipped: 0, errors: 0, source: "eventbrite" }
  }

  const now = new Date().toISOString()
  const baseUrl = new URL("https://www.eventbriteapi.com/v3/events/search/")
  baseUrl.searchParams.set("location.latitude", String(LOMPOC_LAT))
  baseUrl.searchParams.set("location.longitude", String(LOMPOC_LNG))
  baseUrl.searchParams.set("location.within", SEARCH_RADIUS)
  baseUrl.searchParams.set("start_date.range_start", now)
  baseUrl.searchParams.set("expand", "venue,logo,category")
  baseUrl.searchParams.set("page_size", "50")

  let inserted = 0
  let skipped = 0
  let errors = 0
  let continuation: string | undefined

  do {
    const url = new URL(baseUrl.toString())
    if (continuation) url.searchParams.set("continuation", continuation)

    let data: EventbriteResponse
    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (!res.ok) break
      data = (await res.json()) as EventbriteResponse
    } catch {
      break
    }

    for (const evt of data.events) {
      try {
        // Check for existing record to avoid duplicates
        const existing = await db
          .select({ id: events.id })
          .from(events)
          .where(
            and(
              eq(events.source, "eventbrite"),
              eq(events.externalId, evt.id)
            )
          )
          .limit(1)

        if (existing.length > 0) {
          skipped++
          continue
        }

        const location =
          evt.venue?.address?.localized_address_display ??
          (evt.venue?.address?.city && evt.venue?.address?.region
            ? `${evt.venue.address.city}, ${evt.venue.address.region}`
            : "Lompoc, CA")

        const imageUrl =
          evt.logo?.original?.url ?? evt.logo?.url ?? null

        const category =
          EVENTBRITE_CATEGORY_MAP[evt.category_id ?? ""] ?? "other"

        await db.insert(events).values({
          title: evt.name.text.slice(0, 300),
          description: evt.description?.text?.slice(0, 2000) ?? null,
          location: location.slice(0, 500),
          imageUrl: imageUrl?.slice(0, 1000) ?? null,
          category,
          startsAt: new Date(evt.start.utc),
          endsAt: evt.end?.utc ? new Date(evt.end.utc) : null,
          status: "approved",
          source: "eventbrite",
          externalId: evt.id,
        })
        inserted++
      } catch {
        errors++
      }
    }

    continuation = data.pagination.has_more_items
      ? data.pagination.continuation
      : undefined
  } while (continuation)

  return { inserted, skipped, errors, source: "eventbrite" }
}
