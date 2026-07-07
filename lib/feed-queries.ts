import { and, desc, eq, gt, gte, lte } from "drizzle-orm"
import { db } from "@/db/client"
import { feedPosts, events, users, deals, businesses, blogPosts } from "@/db/schema"
import { latLngToNeighborhood } from "@/lib/neighborhoods"
import { isGarageSale, interleaveDeals } from "@/lib/feed-interleave"

export type FeedDisplayItem = {
  id: string // "feed-{n}" | "event-{n}" | "deal-{n}" | "biz-{n}" | "blog-{n}"
  source: "feed" | "event" | "deal" | "new_business" | "blog"
  type: "for_sale" | "garage_sale" | "info" | "event" | "deal" | "new_business" | "blog"
  title: string
  description: string | null
  imageUrl: string | null
  priceCents: number | null
  badgeText: string | null // deal discountText
  businessName: string | null // deal / new_business cards
  address: string | null
  lat: number | null
  lng: number | null
  neighborhood: string | null // slug from lib/neighborhoods
  saleStartsAt: Date | null
  saleEndsAt: Date | null
  startsAt: Date | null
  isFeatured: boolean
  isNew: boolean
  approvedAt: Date
  href: string
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function firstPhotoUrl(photos: unknown): string | null {
  if (Array.isArray(photos) && typeof photos[0] === "string") {
    return photos[0]
  }
  return null
}

function hood(lat: number | null, lng: number | null): string | null {
  if (lat === null || lng === null) return null
  return latLngToNeighborhood(lat, lng)
}

/** Wrap a stream so one failing source degrades instead of blanking the feed. */
async function safeStream(
  name: string,
  fn: () => Promise<FeedDisplayItem[]>
): Promise<FeedDisplayItem[]> {
  try {
    return await fn()
  } catch (err) {
    console.error(`feed stream "${name}" failed:`, err)
    return []
  }
}

/**
 * Unified public feed: community posts (garage sales derived), upcoming
 * events, active deals (rationed in), businesses approved in the last 14
 * days, and at most one blog post from the last 30 days.
 * Sorted: featured first, then approvedAt desc, deals interleaved 1-per-4.
 */
export async function getFeedItems(opts?: { limit?: number }): Promise<FeedDisplayItem[]> {
  const limit = opts?.limit ?? 60
  const now = new Date()

  const [postItems, eventItems, dealItems, bizItems, blogItems] = await Promise.all([
    safeStream("posts", async () => {
      const rows = await db
        .select()
        .from(feedPosts)
        .where(and(eq(feedPosts.status, "approved"), gt(feedPosts.expiresAt, now)))
        .orderBy(desc(feedPosts.isFeatured), desc(feedPosts.approvedAt))
        .limit(limit)
      return rows.map((row) => {
        const approvedAt = row.approvedAt ?? row.createdAt
        return {
          id: `feed-${row.id}`,
          source: "feed" as const,
          type: isGarageSale(row.type, row.saleStartsAt)
            ? ("garage_sale" as const)
            : row.type,
          title: row.title,
          description: row.description,
          imageUrl: firstPhotoUrl(row.photos),
          priceCents: row.priceCents,
          badgeText: null,
          businessName: null,
          address: row.address,
          lat: row.lat,
          lng: row.lng,
          neighborhood: hood(row.lat, row.lng),
          saleStartsAt: row.saleStartsAt,
          saleEndsAt: row.saleEndsAt,
          startsAt: null,
          isFeatured: row.isFeatured,
          isNew: now.getTime() - approvedAt.getTime() < TWENTY_FOUR_HOURS_MS,
          approvedAt,
          href: `/feed/${row.id}`,
        }
      })
    }),

    safeStream("events", async () => {
      const rows = await db
        .select()
        .from(events)
        .where(and(eq(events.status, "approved"), gte(events.startsAt, now)))
        .orderBy(desc(events.createdAt))
        .limit(limit)
      return rows.map((row) => ({
        id: `event-${row.id}`,
        source: "event" as const,
        type: "event" as const,
        title: row.title,
        description: row.description,
        imageUrl: row.imageUrl,
        priceCents: null,
        badgeText: null,
        businessName: null,
        address: row.location,
        lat: null,
        lng: null,
        neighborhood: null,
        saleStartsAt: null,
        saleEndsAt: null,
        startsAt: row.startsAt,
        isFeatured: false,
        isNew: now.getTime() - row.createdAt.getTime() < TWENTY_FOUR_HOURS_MS,
        approvedAt: row.createdAt,
        href: `/events/${row.id}`,
      }))
    }),

    safeStream("deals", async () => {
      const rows = await db
        .select({ deal: deals, biz: businesses })
        .from(deals)
        .innerJoin(businesses, eq(businesses.id, deals.businessId))
        .where(
          and(
            eq(businesses.status, "approved"),
            eq(deals.paused, false),
            lte(deals.startsAt, now),
            gt(deals.expiresAt, now)
          )
        )
        .orderBy(desc(deals.createdAt))
        .limit(15)
      return rows.map(({ deal, biz }) => ({
        id: `deal-${deal.id}`,
        source: "deal" as const,
        type: "deal" as const,
        title: deal.title,
        description: deal.description,
        imageUrl: deal.imageUrl,
        priceCents: null,
        badgeText: deal.discountText,
        businessName: biz.name,
        address: biz.address,
        lat: biz.lat,
        lng: biz.lng,
        neighborhood: hood(biz.lat, biz.lng),
        saleStartsAt: null,
        saleEndsAt: null,
        startsAt: null,
        isFeatured: false,
        isNew: now.getTime() - deal.createdAt.getTime() < TWENTY_FOUR_HOURS_MS,
        approvedAt: deal.createdAt,
        href: `/deals/${deal.id}`,
      }))
    }),

    safeStream("new-businesses", async () => {
      const cutoff = new Date(now.getTime() - FOURTEEN_DAYS_MS)
      const rows = await db
        .select()
        .from(businesses)
        .where(and(eq(businesses.status, "approved"), gte(businesses.createdAt, cutoff)))
        .orderBy(desc(businesses.createdAt))
        .limit(10)
      return rows.map((row) => ({
        id: `biz-${row.id}`,
        source: "new_business" as const,
        type: "new_business" as const,
        title: row.name,
        description: row.description,
        imageUrl: row.coverUrl ?? row.logoUrl,
        priceCents: null,
        badgeText: null,
        businessName: row.name,
        address: row.address,
        lat: row.lat,
        lng: row.lng,
        neighborhood: hood(row.lat, row.lng),
        saleStartsAt: null,
        saleEndsAt: null,
        startsAt: null,
        isFeatured: false,
        isNew: now.getTime() - row.createdAt.getTime() < TWENTY_FOUR_HOURS_MS,
        approvedAt: row.createdAt,
        href: `/biz/${row.slug}`,
      }))
    }),

    safeStream("blog", async () => {
      const cutoff = new Date(now.getTime() - THIRTY_DAYS_MS)
      const rows = await db
        .select()
        .from(blogPosts)
        .where(and(eq(blogPosts.status, "published"), gte(blogPosts.publishedAt, cutoff)))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(1)
      return rows.map((row) => ({
        id: `blog-${row.id}`,
        source: "blog" as const,
        type: "blog" as const,
        title: row.title,
        description: row.excerpt,
        imageUrl: row.imageUrl,
        priceCents: null,
        badgeText: null,
        businessName: null,
        address: null,
        lat: null,
        lng: null,
        neighborhood: null,
        saleStartsAt: null,
        saleEndsAt: null,
        startsAt: null,
        isFeatured: false,
        isNew: false,
        approvedAt: row.publishedAt ?? row.createdAt,
        href: `/blog/${row.slug}`,
      }))
    }),
  ])

  const nonDeals = [...postItems, ...eventItems, ...bizItems, ...blogItems].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1
    return b.approvedAt.getTime() - a.approvedAt.getTime()
  })

  const merged = interleaveDeals(nonDeals, dealItems).slice(0, limit)
  return merged
}

/** Single post detail. Returns null if not found. */
export async function getFeedPostById(id: number) {
  const result = await db
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.id, id))
    .limit(1)
  return result[0] ?? null
}

/** Poster's own posts — all statuses. */
export async function getMyFeedPosts(userId: number) {
  return db
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.postedByUserId, userId))
    .orderBy(desc(feedPosts.createdAt))
}

/** Admin queue — all rows in `pending` status, newest first, with poster join. */
export async function getPendingFeedPosts() {
  return db
    .select({
      post: feedPosts,
      poster: { id: users.id, email: users.email, name: users.name },
    })
    .from(feedPosts)
    .leftJoin(users, eq(users.id, feedPosts.postedByUserId))
    .where(eq(feedPosts.status, "pending"))
    .orderBy(desc(feedPosts.createdAt))
}
