import { and, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { events } from "@/db/schema"
import type { SyncReport } from "@/lib/event-sync"

// Launch Library 2 (thespacedevs) — the structured database behind sites like
// spacelaunchschedule.com. Location 11 = Vandenberg SFB. Free tier: 15 req/hr,
// we make exactly one per sync.
const LL2_URL =
  "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?location__ids=11&limit=20&mode=detailed"

// LL2 status abbrevs that mean the launch is still expected to happen
const UPCOMING_STATUSES = new Set(["Go", "TBC", "TBD", "Hold"])
const CANCELLED_STATUSES = new Set(["Failure", "Partial Failure"])

interface LL2Launch {
  id: string
  name: string // "Falcon 9 Block 5 | Starlink Group 17-39"
  net: string // ISO launch time (No Earlier Than)
  status: { abbrev: string; name: string }
  image?: string | null
  mission?: { name?: string; description?: string | null } | null
  rocket?: { configuration?: { full_name?: string } } | null
  pad?: { name?: string; location?: { name?: string } } | null
}

function launchTitle(l: LL2Launch): string {
  const rocket = l.rocket?.configuration?.full_name ?? l.name.split(" | ")[0]
  const mission = l.mission?.name ?? l.name.split(" | ")[1] ?? l.name
  return `Rocket Launch: ${rocket} — ${mission}`
}

function launchDescription(l: LL2Launch): string {
  const parts: string[] = []
  if (l.mission?.description) parts.push(l.mission.description)
  const pad = [l.pad?.name, l.pad?.location?.name].filter(Boolean).join(", ")
  if (pad) parts.push(`Launching from ${pad}.`)
  parts.push(
    "Launch times shift often — check back for updates. Visible from much of Lompoc; popular viewing spots include Ocean Ave west of town and Surf Beach (when open)."
  )
  return parts.join("\n\n").slice(0, 2000)
}

/**
 * Sync upcoming Vandenberg SFB launches into the events table.
 * Unlike one-shot event sources, launch dates slip constantly, so existing
 * rows are UPDATED (time, title, description, image) rather than skipped.
 */
export async function syncVandenbergLaunches(): Promise<SyncReport> {
  let inserted = 0
  let skipped = 0
  let errors = 0

  let launches: LL2Launch[]
  try {
    const res = await fetch(LL2_URL, { cache: "no-store" })
    if (!res.ok) throw new Error(`LL2 ${res.status}`)
    const data = (await res.json()) as { results?: LL2Launch[] }
    launches = data.results ?? []
  } catch {
    return { inserted: 0, skipped: 0, errors: 1, source: "launch-library" }
  }

  for (const launch of launches) {
    try {
      const cancelled = CANCELLED_STATUSES.has(launch.status.abbrev)
      const upcoming = UPCOMING_STATUSES.has(launch.status.abbrev)
      // "Success" = already flew; leave whatever row exists as history
      if (!upcoming && !cancelled) {
        skipped++
        continue
      }

      const values = {
        title: launchTitle(launch).slice(0, 300),
        description: launchDescription(launch),
        location: "Vandenberg Space Force Base",
        imageUrl: launch.image?.slice(0, 1000) ?? null,
        category: "community" as const,
        startsAt: new Date(launch.net),
        status: cancelled ? ("cancelled" as const) : ("approved" as const),
        source: "launch-library",
        externalId: launch.id,
      }

      const existing = await db
        .select({ id: events.id })
        .from(events)
        .where(
          and(
            eq(events.source, "launch-library"),
            eq(events.externalId, launch.id)
          )
        )
        .limit(1)

      if (existing.length > 0) {
        await db.update(events).set(values).where(eq(events.id, existing[0].id))
        skipped++
      } else if (upcoming) {
        await db.insert(events).values(values)
        inserted++
      }
    } catch {
      errors++
    }
  }

  return { inserted, skipped, errors, source: "launch-library" }
}
