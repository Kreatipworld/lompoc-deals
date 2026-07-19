import { gt, lt, asc, and, eq, desc, sql, inArray } from "drizzle-orm"
import { db } from "@/db/client"
import { deals, businesses, events, categories } from "@/db/schema"
import type { DealCardData } from "@/lib/queries"
import { getFeaturedActivities } from "@/lib/queries"

// ─── Themed weekly digest ────────────────────────────────────────────────
// One email per week, four a month, each with its own theme so the community
// always has a fresh reason to open (see docs/marketing/digest-email-plan.md).
export type DigestTheme = "events" | "deals" | "thingsToDo" | "partners"

/** Which theme this Monday's digest uses, by week-of-month (1st→events … 4th→partners). */
export function digestThemeForDate(d: Date): DigestTheme {
  const weekIdx = Math.floor((d.getDate() - 1) / 7) // 0-based week of the month
  const order: DigestTheme[] = ["events", "deals", "thingsToDo", "partners"]
  return order[Math.min(weekIdx, order.length - 1)]
}

/**
 * The deals that go into the weekly digest: top 10 active deals created in
 * the past 7 days from approved businesses. Shared by the Saturday cron
 * (app/api/cron/digest) and the admin comms hub preview/test-send.
 */
export async function getDigestDeals(): Promise<DealCardData[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const rows = await db
    .select({
      id: deals.id,
      type: deals.type,
      title: deals.title,
      description: deals.description,
      imageUrl: deals.imageUrl,
      discountText: deals.discountText,
      expiresAt: deals.expiresAt,
      bizId: businesses.id,
      bizName: businesses.name,
      bizSlug: businesses.slug,
      bizLogoUrl: businesses.logoUrl,
      bizCoverUrl: businesses.coverUrl,
    })
    .from(deals)
    .innerJoin(businesses, eq(deals.businessId, businesses.id))
    .where(
      and(
        gt(deals.expiresAt, sql`now()`),
        gt(deals.createdAt, sevenDaysAgo),
        eq(businesses.status, "approved")
      )
    )
    .orderBy(desc(deals.createdAt))
    .limit(10)

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    imageUrl: r.imageUrl,
    discountText: r.discountText,
    terms: null,
    expiresAt: r.expiresAt,
    featured: false,
    business: {
      id: r.bizId,
      name: r.bizName,
      slug: r.bizSlug,
      logoUrl: r.bizLogoUrl,
      coverUrl: r.bizCoverUrl,
      categoryName: null,
      categorySlug: null,
      address: null,
      phone: null,
    },
  }))
}

/** Shape of an event row rendered in the weekly digest email. */
export type DigestEvent = {
  id: number
  title: string
  location: string | null
  startsAt: Date
  imageUrl: string | null
}

/**
 * Upcoming approved events for the Monday digest: everything happening in
 * the next 7 days, soonest first. Rocket launches and city events land here
 * via the daily sync-events cron.
 */
export async function getDigestEvents(days = 7, limit = 8): Promise<DigestEvent[]> {
  const sevenDaysAhead = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  // DISTINCT ON title: recurring series (weekly markets, daily gallery shows)
  // collapse to their next occurrence instead of filling every digest slot
  const rows = await db
    .selectDistinctOn([events.title], {
      id: events.id,
      title: events.title,
      location: events.location,
      startsAt: events.startsAt,
      imageUrl: events.imageUrl,
    })
    .from(events)
    .where(
      and(
        eq(events.status, "approved"),
        gt(events.startsAt, sql`now()`),
        lt(events.startsAt, sevenDaysAhead)
      )
    )
    .orderBy(asc(events.title), asc(events.startsAt))

  return rows
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .slice(0, limit)
}

/** A "things to do" item (featured activity) for the Week-3 digest. */
export type DigestThing = {
  title: string
  href: string
  imageUrl: string | null
  subtitle: string | null
}

export async function getDigestThingsToDo(limit = 6): Promise<DigestThing[]> {
  const acts = await getFeaturedActivities(limit)
  return acts.map((a) => ({
    title: a.title,
    href: `/activities/${a.slug}`,
    imageUrl: a.imageUrl,
    subtitle: a.category ?? null,
  }))
}

/** An Official Partner spotlight (+ their current offer) for the Week-4 digest. */
export type DigestPartner = {
  name: string
  slug: string
  coverUrl: string | null
  categoryName: string | null
  dealTitle: string | null
  discountText: string | null
}

export async function getDigestPartners(limit = 6): Promise<DigestPartner[]> {
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      coverUrl: businesses.coverUrl,
      categoryName: categories.name,
    })
    .from(businesses)
    .leftJoin(categories, eq(categories.id, businesses.categoryId))
    .where(and(eq(businesses.status, "approved"), eq(businesses.planOverride, "premium")))
    .orderBy(businesses.name)
    .limit(limit)

  if (rows.length === 0) return []

  // Attach each partner's soonest-expiring live coupon
  const ids = rows.map((r) => r.id)
  const dealRows = await db
    .select({
      businessId: deals.businessId,
      title: deals.title,
      discountText: deals.discountText,
      expiresAt: deals.expiresAt,
    })
    .from(deals)
    .where(and(inArray(deals.businessId, ids), eq(deals.paused, false), gt(deals.expiresAt, sql`now()`)))
    .orderBy(asc(deals.expiresAt))

  const dealByBiz = new Map<number, { title: string; discountText: string | null }>()
  for (const d of dealRows) {
    if (!dealByBiz.has(d.businessId)) dealByBiz.set(d.businessId, { title: d.title, discountText: d.discountText })
  }

  return rows.map((r) => ({
    name: r.name,
    slug: r.slug,
    coverUrl: r.coverUrl,
    categoryName: r.categoryName,
    dealTitle: dealByBiz.get(r.id)?.title ?? null,
    discountText: dealByBiz.get(r.id)?.discountText ?? null,
  }))
}

/** Everything a themed digest needs; only the active theme's field is populated. */
export type ThemedDigestContent = {
  theme: DigestTheme
  events: DigestEvent[]
  deals: DealCardData[]
  things: DigestThing[]
  partners: DigestPartner[]
}

/** Gather the content for a given theme (events pull a 30-day window for the monthly recap). */
export async function getThemedDigestContent(theme: DigestTheme): Promise<ThemedDigestContent> {
  const empty = { theme, events: [], deals: [], things: [], partners: [] }
  if (theme === "events") return { ...empty, events: await getDigestEvents(30, 10) }
  if (theme === "deals") return { ...empty, deals: await getDigestDeals() }
  if (theme === "thingsToDo") return { ...empty, things: await getDigestThingsToDo() }
  return { ...empty, partners: await getDigestPartners() }
}

/** True when the themed digest has enough to send. */
export function themedDigestHasContent(c: ThemedDigestContent): boolean {
  return c.events.length + c.deals.length + c.things.length + c.partners.length > 0
}

/** All four content types for the magazine-style master digest. */
export type MasterDigestContent = {
  events: DigestEvent[]
  deals: DealCardData[]
  things: DigestThing[]
  partners: DigestPartner[]
}

export async function getMasterDigestContent(): Promise<MasterDigestContent> {
  const [events, deals, things, partners] = await Promise.all([
    getDigestEvents(21, 6),
    getDigestDeals(),
    getDigestThingsToDo(6),
    getDigestPartners(6),
  ])
  return { events, deals: deals.slice(0, 6), things, partners }
}

/** The front-page lead: soonest event, else top deal, else nothing. */
export type DigestLead =
  | { kind: "event"; event: DigestEvent }
  | { kind: "deal"; deal: DealCardData }
  | null

export function selectLead(c: MasterDigestContent): DigestLead {
  if (c.events.length > 0) return { kind: "event", event: c.events[0] }
  if (c.deals.length > 0) return { kind: "deal", deal: c.deals[0] }
  return null
}

/** True when the master digest has enough content across all four sections to send. */
export function hasMasterDigestContent(c: MasterDigestContent): boolean {
  return c.events.length + c.deals.length + c.things.length + c.partners.length > 0
}
