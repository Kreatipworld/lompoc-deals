import { NextResponse } from "next/server"
import { isNotNull, sql, gt, and } from "drizzle-orm"
import { db } from "@/db/client"
import { subscribers, deals, businesses } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { sendDigestEmail } from "@/lib/email"
import type { DealCardData } from "@/lib/queries"

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Top 10 active deals from the past 7 days
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

  const digestDeals: DealCardData[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    imageUrl: r.imageUrl,
    discountText: r.discountText,
    terms: null,
    expiresAt: r.expiresAt,
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

  if (digestDeals.length === 0) {
    return NextResponse.json({
      sent: 0,
      skipped: "no deals this week",
    })
  }

  // All confirmed subscribers
  const confirmedSubs = await db
    .select()
    .from(subscribers)
    .where(isNotNull(subscribers.confirmedAt))

  let sent = 0
  let failed = 0
  for (const sub of confirmedSubs) {
    const result = await sendDigestEmail(
      sub.email,
      sub.unsubscribeToken,
      digestDeals
    )
    if (result.ok) sent++
    else failed++
  }

  return NextResponse.json({
    sent,
    failed,
    deals: digestDeals.length,
    subscribers: confirmedSubs.length,
  })
}
