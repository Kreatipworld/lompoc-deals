import { gt, lt, asc, and, eq, desc, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { deals, businesses, events } from "@/db/schema"
import type { DealCardData } from "@/lib/queries"

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
}

/**
 * Upcoming approved events for the Monday digest: everything happening in
 * the next 7 days, soonest first. Rocket launches and city events land here
 * via the daily sync-events cron.
 */
export async function getDigestEvents(): Promise<DigestEvent[]> {
  const sevenDaysAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      location: events.location,
      startsAt: events.startsAt,
    })
    .from(events)
    .where(
      and(
        eq(events.status, "approved"),
        gt(events.startsAt, sql`now()`),
        lt(events.startsAt, sevenDaysAhead)
      )
    )
    .orderBy(asc(events.startsAt))
    .limit(8)

  return rows
}
