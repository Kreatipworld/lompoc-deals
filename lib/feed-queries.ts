import { and, desc, eq, gt, gte } from "drizzle-orm"
import { db } from "@/db/client"
import { feedPosts, events, users } from "@/db/schema"

export type FeedDisplayItem = {
  id: string // "feed-{n}" or "event-{n}"
  source: "feed" | "event"
  type: "for_sale" | "info" | "event"
  title: string
  description: string | null
  imageUrl: string | null
  priceCents: number | null
  address: string | null
  saleStartsAt: Date | null
  saleEndsAt: Date | null
  startsAt: Date | null // event only
  isFeatured: boolean
  isNew: boolean
  approvedAt: Date
  href: string
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

function firstPhotoUrl(photos: unknown): string | null {
  if (Array.isArray(photos) && typeof photos[0] === "string") {
    return photos[0]
  }
  return null
}

/**
 * Public feed combining approved feed posts (non-expired) with
 * approved upcoming events. Sorted: featured first, then
 * approved_at desc. Limit 60.
 */
export async function getFeedItems(opts?: {
  type?: "for_sale" | "info" | "event"
  limit?: number
}): Promise<FeedDisplayItem[]> {
  const limit = opts?.limit ?? 60
  const now = new Date()

  const items: FeedDisplayItem[] = []

  // Feed posts (when type is undefined/for_sale/info — NOT when filtering "event")
  if (opts?.type !== "event") {
    // opts.type here is "for_sale" | "info" | undefined — safe to narrow
    const feedType = opts?.type as "for_sale" | "info" | undefined

    const feedRows = await db
      .select()
      .from(feedPosts)
      .where(
        and(
          eq(feedPosts.status, "approved"),
          gt(feedPosts.expiresAt, now),
          feedType ? eq(feedPosts.type, feedType) : undefined
        )
      )
      .orderBy(desc(feedPosts.isFeatured), desc(feedPosts.approvedAt))
      .limit(limit)

    for (const row of feedRows) {
      const approvedAt = row.approvedAt ?? row.createdAt
      items.push({
        id: `feed-${row.id}`,
        source: "feed",
        type: row.type,
        title: row.title,
        description: row.description,
        imageUrl: firstPhotoUrl(row.photos),
        priceCents: row.priceCents,
        address: row.address,
        saleStartsAt: row.saleStartsAt,
        saleEndsAt: row.saleEndsAt,
        startsAt: null,
        isFeatured: row.isFeatured,
        isNew: now.getTime() - approvedAt.getTime() < TWENTY_FOUR_HOURS_MS,
        approvedAt,
        href: `/feed/${row.id}`,
      })
    }
  }

  // Events (when type is undefined or "event")
  if (opts?.type === undefined || opts?.type === "event") {
    const eventRows = await db
      .select()
      .from(events)
      .where(and(eq(events.status, "approved"), gte(events.startsAt, now)))
      .orderBy(desc(events.createdAt))
      .limit(limit)

    for (const row of eventRows) {
      items.push({
        id: `event-${row.id}`,
        source: "event",
        type: "event",
        title: row.title,
        description: row.description,
        imageUrl: row.imageUrl,
        priceCents: null,
        address: row.location,
        saleStartsAt: null,
        saleEndsAt: null,
        startsAt: row.startsAt,
        isFeatured: false,
        isNew: now.getTime() - row.createdAt.getTime() < TWENTY_FOUR_HOURS_MS,
        approvedAt: row.createdAt,
        href: `/events/${row.id}`,
      })
    }
  }

  // Merged sort: featured first, then approvedAt desc
  items.sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1
    return b.approvedAt.getTime() - a.approvedAt.getTime()
  })

  return items.slice(0, limit)
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
