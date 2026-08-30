import { gt, lt, asc, and, eq, desc, sql, inArray } from "drizzle-orm"
import { newsCoverUrl } from "./news-cover"
import { db } from "@/db/client"
import { deals, businesses, events, categories, blogPosts } from "@/db/schema"
import type { DealCardData } from "@/lib/queries"
import { getFeaturedActivities } from "@/lib/queries"
import { isChain } from "@/lib/chains"
import { pick, type Locale } from "@/lib/localize"

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
 * the past 7 days from approved businesses. Shared by the Monday cron
 * (app/api/cron/digest) and the admin comms hub preview/test-send.
 */
export async function getDigestDeals(locale: Locale = "en"): Promise<DealCardData[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const rows = await db
    .select({
      id: deals.id,
      type: deals.type,
      title: deals.title,
      description: deals.description,
      imageUrl: deals.imageUrl,
      discountText: deals.discountText,
      titleEs: deals.titleEs,
      descriptionEs: deals.descriptionEs,
      discountTextEs: deals.discountTextEs,
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
    title: pick(locale, r.title, r.titleEs),
    description: pick(locale, r.description, r.descriptionEs),
    imageUrl: r.imageUrl,
    discountText: pick(locale, r.discountText, r.discountTextEs),
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
  /** Row origin — /this-week uses it to give launch rows their Spanish shape when no twin exists. */
  source?: string
}

/**
 * Upcoming approved events for the Monday digest: everything happening in
 * the next 7 days, soonest first. Rocket launches and city events land here
 * via the daily sync-events cron.
 *
 * `locale` localizes the title (DB `title_es` twin, English fallback). The email itself
 * is English, so the digest crons keep the default; /this-week passes the page locale.
 */
export async function getDigestEvents(days = 7, limit = 8, locale = "en"): Promise<DigestEvent[]> {
  const sevenDaysAhead = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  // DISTINCT ON title: recurring series (weekly markets, daily gallery shows)
  // collapse to their next occurrence instead of filling every digest slot
  const rows = await db
    .selectDistinctOn([events.title], {
      id: events.id,
      title:
        locale === "es"
          ? sql<string>`coalesce(nullif(trim(${events.titleEs}), ''), ${events.title})`
          : events.title,
      location: events.location,
      startsAt: events.startsAt,
      imageUrl: events.imageUrl,
      source: events.source,
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

export async function getDigestThingsToDo(limit = 6, locale = "en"): Promise<DigestThing[]> {
  const acts = await getFeaturedActivities(limit, locale)
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

export async function getDigestPartners(limit = 6, locale: Locale = "en"): Promise<DigestPartner[]> {
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
    .where(
      and(
        eq(businesses.status, "approved"),
        // Every paying member (Growth or Plus) is an Official Partner. EXISTS
        // instead of a join so a member never appears twice.
        sql`(${businesses.planOverride} in ('standard','premium') or exists (
          select 1 from subscriptions s
          where s.user_id = ${businesses.ownerUserId}
            and s.status in ('active','trialing')
            and s.tier in ('standard','premium')
        ))`
      )
    )
    .orderBy(businesses.name)

  if (rows.length === 0) return []
  // Rotate the window by week so every member takes a turn in the digest and
  // the partners spotlight — alphabetical order alone would feature the same
  // six forever and newer members never.
  const start = rows.length > limit ? digestWeekIndex() % rows.length : 0
  const rotated = rows.slice(start).concat(rows.slice(0, start)).slice(0, limit)
  rows.length = 0; rows.push(...rotated)

  // Attach each partner's soonest-expiring live coupon
  const ids = rows.map((r) => r.id)
  const dealRows = await db
    .select({
      businessId: deals.businessId,
      title: deals.title,
      discountText: deals.discountText,
      titleEs: deals.titleEs,
      discountTextEs: deals.discountTextEs,
      expiresAt: deals.expiresAt,
    })
    .from(deals)
    .where(and(inArray(deals.businessId, ids), eq(deals.paused, false), gt(deals.expiresAt, sql`now()`)))
    .orderBy(asc(deals.expiresAt))

  const dealByBiz = new Map<number, { title: string; discountText: string | null }>()
  for (const d of dealRows) {
    if (!dealByBiz.has(d.businessId)) {
      dealByBiz.set(d.businessId, {
        title: pick(locale, d.title, d.titleEs),
        discountText: pick(locale, d.discountText, d.discountTextEs),
      })
    }
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

/* ── The town, a slice at a time ────────────────────────────────────────────
 *
 * The digest used to print the first four premium partners alphabetically and the first four
 * featured activities, which meant 413 of 427 businesses could never appear and the non-event half
 * of the email was byte-identical every week. These rotate instead.
 *
 * Rotation is derived from the date rather than stored: week N takes the Nth slice of a stable
 * md5(slug) ordering and wraps at the end. No state to keep in sync, and a rebuild produces the
 * same email twice — which matters because the same content feeds the public /this-week page.
 */

/** Weeks since a fixed Saturday, so the slice advances by exactly one per send. */
export function digestWeekIndex(d = new Date()): number {
  const epoch = Date.UTC(2026, 0, 3) // Saturday
  const today = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.max(0, Math.floor((today - epoch) / (7 * 24 * 60 * 60 * 1000)))
}

export type DigestPlace = {
  name: string
  slug: string
  categoryName: string | null
  coverUrl: string | null
  blurb: string | null
  address: string | null
}

/** First sentence of the about text — enough to say why it is worth knowing, never the whole essay. */
function firstSentence(text: string | null, max = 150): string | null {
  if (!text) return null
  const s = String(text).trim().split(/(?<=[.!?])\s+/)[0] ?? ""
  if (!s) return null
  return s.length > max ? s.slice(0, max).replace(/\s+\S*$/, "") + "…" : s
}

/**
 * Somewhere to eat. Food & Drink is the largest category (103 approved, every one with a photo),
 * and it is the thing residents most often want an answer to.
 */
export async function getDigestRestaurants(week: number, limit = 3): Promise<DigestPlace[]> {
  const rows = await db.execute(sql`
    select b.name, b.slug, c.name as category_name, b.cover_url, b.about, b.address
    from businesses b join categories c on c.id = b.category_id
    where b.status = 'approved' and c.slug = 'food-drink'
      and jsonb_array_length(coalesce(b.photos_json, '[]'::jsonb)) >= 1
      and b.about is not null and length(b.about) > 40
    order by md5(b.slug)`)
  const all = (rows.rows as Array<Record<string, unknown>>).filter((r) => !isChain(String(r.name)))
  if (!all.length) return []
  const start = (week * limit) % all.length
  const picked = Array.from({ length: Math.min(limit, all.length) }, (_, i) => all[(start + i) % all.length])
  return picked.map((r) => ({
    name: String(r.name),
    slug: String(r.slug),
    categoryName: (r.category_name as string) ?? null,
    coverUrl: (r.cover_url as string) ?? null,
    blurb: firstSentence((r.about as string) ?? null),
    address: (r.address as string) ?? null,
  }))
}

/**
 * One business, told properly — the email's equivalent of the "On the record" post.
 *
 * Two exclusions do the real work here. Chains are out because featuring one is the opposite of
 * the point. And `about_source = 'google'` is out because that text is Google's editorial summary
 * verbatim — the first live build picked a furniture chain and quoted "known for its signature
 * recliners", which is both somebody else's prose and an advert we were not asked to run. What
 * remains is about text traceable to the business's own site or to the owner.
 */
export async function getDigestBusinessFeature(week: number): Promise<DigestPlace | null> {
  const rows = await db.execute(sql`
    select b.name, b.slug, c.name as category_name, b.cover_url, b.about, b.address
    from businesses b left join categories c on c.id = b.category_id
    where b.status = 'approved'
      and b.about is not null and length(b.about) > 60
      and coalesce(b.about_source, '') <> 'google'
      and jsonb_array_length(coalesce(b.photos_json, '[]'::jsonb)) >= 3
    order by md5(b.slug)`)
  const all = (rows.rows as Array<Record<string, unknown>>).filter((r) => !isChain(String(r.name)))
  if (!all.length) return null
  const r = all[week % all.length]
  return {
    name: String(r.name),
    slug: String(r.slug),
    categoryName: (r.category_name as string) ?? null,
    coverUrl: (r.cover_url as string) ?? null,
    blurb: firstSentence((r.about as string) ?? null, 190),
    address: (r.address as string) ?? null,
  }
}

/**
 * Somewhere to go — parks, beaches, trails and the rest of the valley.
 *
 * These live in `activities`, not `businesses`: 28 rows, every one with an image, tips and
 * seasonality. A couple (Beattie Park, La Purisima Golf Course) also exist as thin business rows,
 * which is why this reads only from activities — otherwise they would appear twice.
 */
export async function getDigestOutdoors(week: number, limit = 2, locale = "en"): Promise<DigestThing[]> {
  const rows = await db.execute(sql`
    select title, title_es, slug, category, image_url, description, description_es
    from activities
    where image_url is not null
    order by md5(slug)`)
  const all = rows.rows as Array<Record<string, unknown>>
  if (!all.length) return []
  const start = (week * limit) % all.length
  const picked = Array.from({ length: Math.min(limit, all.length) }, (_, i) => all[(start + i) % all.length])
  // Spanish twins are NULL until translated — the English column is always the fallback.
  const loc = (en: unknown, es: unknown) =>
    locale === "es" && typeof es === "string" && es.trim() ? es : ((en as string) ?? null)
  return picked.map((r) => ({
    title: String(loc(r.title, r.title_es)),
    href: `/activities/${String(r.slug)}`,
    imageUrl: (r.image_url as string) ?? null,
    subtitle: firstSentence(loc(r.description, r.description_es), 90) ?? ((r.category as string) ?? null),
  }))
}


/** A local-news story for the digest's front page. */
export type DigestNews = {
  id: number
  slug: string
  title: string
  excerpt: string | null
  imageUrl: string | null
  publishedAt: Date | null
}

/**
 * The week's local news, newest first — the section that makes the Monday
 * edition read like the town's front page rather than a listings sheet.
 */
export async function getDigestNews(limit = 4, locale = "en"): Promise<DigestNews[]> {
  const es = locale === "es"
  const rows = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      // Spanish twins (title_es / excerpt_es) are NULL until translated; English is the fallback.
      title: es
        ? sql<string>`coalesce(nullif(trim(${blogPosts.titleEs}), ''), ${blogPosts.title})`
        : blogPosts.title,
      titleEn: blogPosts.title,
      excerpt: es
        ? sql<string | null>`coalesce(nullif(trim(${blogPosts.excerptEs}), ''), ${blogPosts.excerpt})`
        : blogPosts.excerpt,
      imageUrl: blogPosts.imageUrl,
      tags: blogPosts.tags,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.category, "local-news"),
        eq(blogPosts.status, "published"),
        gt(blogPosts.publishedAt, sql`now() - interval '10 days'`)
      )
    )
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit)
  // Email needs absolute URLs, and a story without a photo still gets its topic cover.
  const origin = process.env.AUTH_URL ?? "https://www.lompoclocals.com"
  // Topic covers derive from English keywords, so the cover is keyed off the English title.
  return rows.map(({ tags, titleEn, ...r }) => ({
    ...r,
    imageUrl: newsCoverUrl({ imageUrl: r.imageUrl, tags: tags as string[] | null, title: titleEn }, origin),
  }))
}

export type MasterDigestContent = {
  events: DigestEvent[]
  deals: DealCardData[]
  things: DigestThing[]
  partners: DigestPartner[]
  /** Rotating sections — see digestWeekIndex. */
  restaurants: DigestPlace[]
  feature: DigestPlace | null
  outdoors: DigestThing[]
  news: DigestNews[]
}

/** `locale` localizes events / things / outdoors / news; the email crons keep the English default. */
export async function getMasterDigestContent(locale = "en"): Promise<MasterDigestContent> {
  const week = digestWeekIndex()
  const [events, deals, things, partners, restaurants, feature, outdoors, news] = await Promise.all([
    getDigestEvents(21, 6, locale),
    getDigestDeals(locale),
    getDigestThingsToDo(6, locale),
    getDigestPartners(6, locale),
    getDigestRestaurants(week, 3),
    getDigestBusinessFeature(week),
    getDigestOutdoors(week, 2, locale),
    getDigestNews(4, locale),
  ])
  return { events, deals: deals.slice(0, 6), things, partners, restaurants, feature, outdoors, news }
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
  // The rotating sections count too. Without them a quiet events week would send nothing at all,
  // even though there is always a restaurant, a business and somewhere to go worth naming.
  return (
    c.events.length +
      c.deals.length +
      c.things.length +
      c.partners.length +
      c.restaurants.length +
      c.outdoors.length +
      c.news.length +
      (c.feature ? 1 : 0) >
    0
  )
}
