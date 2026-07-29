import { db } from "@/db/client"
import { sql, desc, eq } from "drizzle-orm"
import { supportTickets, businesses } from "@/db/schema"

export type HealthSnapshot = {
  users: number
  bizApproved: number
  bizPending: number
  bizRejected: number
  dealsLive: number
  digestSubs: number
  activeMembers: number
  openTickets: number
  pendingClaims: number
  missingAbout: number
  missingPhotos: number
  missingHours: number
}

/** One-shot platform health snapshot for the admin hub. */
export async function getPlatformHealth(): Promise<HealthSnapshot> {
  const r = await db.execute<Record<string, number>>(sql`
    SELECT
      (SELECT count(*) FROM users)::int AS users,
      (SELECT count(*) FROM businesses WHERE status='approved')::int AS biz_approved,
      (SELECT count(*) FROM businesses WHERE status='pending')::int AS biz_pending,
      (SELECT count(*) FROM businesses WHERE status='rejected')::int AS biz_rejected,
      (SELECT count(*) FROM deals WHERE expires_at > now() AND paused = false)::int AS deals_live,
      (SELECT count(*) FROM subscribers WHERE confirmed_at IS NOT NULL)::int AS digest_subs,
      (SELECT count(*) FROM subscriptions WHERE status IN ('active','trialing') AND tier <> 'free')::int AS active_members,
      (SELECT count(*) FROM support_tickets WHERE status='open')::int AS open_tickets,
      (SELECT count(*) FROM business_claims WHERE status='pending')::int AS pending_claims,
      (SELECT count(*) FROM businesses WHERE status='approved' AND (about IS NULL OR length(trim(about))=0))::int AS missing_about,
      (SELECT count(*) FROM businesses WHERE status='approved' AND (photos_json IS NULL OR photos_json::text IN ('null','[]')))::int AS missing_photos,
      (SELECT count(*) FROM businesses WHERE status='approved' AND hours_json IS NULL)::int AS missing_hours
  `)
  const row = (r.rows[0] ?? {}) as Record<string, number>
  return {
    users: row.users ?? 0,
    bizApproved: row.biz_approved ?? 0,
    bizPending: row.biz_pending ?? 0,
    bizRejected: row.biz_rejected ?? 0,
    dealsLive: row.deals_live ?? 0,
    digestSubs: row.digest_subs ?? 0,
    activeMembers: row.active_members ?? 0,
    openTickets: row.open_tickets ?? 0,
    pendingClaims: row.pending_claims ?? 0,
    missingAbout: row.missing_about ?? 0,
    missingPhotos: row.missing_photos ?? 0,
    missingHours: row.missing_hours ?? 0,
  }
}

/** The most recent open tickets, for the health hub's "needs attention" list. */
export async function recentOpenTickets(limit = 5) {
  return db
    .select({
      id: supportTickets.id,
      category: supportTickets.category,
      subject: supportTickets.subject,
      createdAt: supportTickets.createdAt,
      businessName: businesses.name,
    })
    .from(supportTickets)
    .leftJoin(businesses, eq(supportTickets.businessId, businesses.id))
    .where(eq(supportTickets.status, "open"))
    .orderBy(desc(supportTickets.createdAt))
    .limit(limit)
}
