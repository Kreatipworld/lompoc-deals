"use server"

import { revalidatePath } from "next/cache"
import { eq, sql, and, gt } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { businesses, deals, users, businessClaims, events, dealEvents } from "@/db/schema"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Not authorized")
  }
}

export async function approveBusinessAction(formData: FormData) {
  await requireAdmin()
  const id = parseInt(formData.get("businessId")?.toString() ?? "0", 10)
  if (!id) return
  await db
    .update(businesses)
    .set({ status: "approved" })
    .where(eq(businesses.id, id))
  revalidatePath("/admin")
  revalidatePath("/")
  revalidatePath("/map")
}

export async function rejectBusinessAction(formData: FormData) {
  await requireAdmin()
  const id = parseInt(formData.get("businessId")?.toString() ?? "0", 10)
  if (!id) return
  await db
    .update(businesses)
    .set({ status: "rejected" })
    .where(eq(businesses.id, id))
  revalidatePath("/admin")
}

export async function adminSoftDeleteDealAction(formData: FormData) {
  await requireAdmin()
  const id = parseInt(formData.get("dealId")?.toString() ?? "0", 10)
  if (!id) return
  await db
    .update(deals)
    .set({ expiresAt: new Date(Date.now() - 1000) })
    .where(eq(deals.id, id))
  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/admin/deals")
}

export async function adminPauseDealAction(formData: FormData) {
  await requireAdmin()
  const id = parseInt(formData.get("dealId")?.toString() ?? "0", 10)
  if (!id) return
  const paused = formData.get("paused") === "true"
  await db.update(deals).set({ paused }).where(eq(deals.id, id))
  revalidatePath("/")
  revalidatePath("/admin/deals")
}

export async function getPendingBusinesses() {
  await requireAdmin()
  return db.query.businesses.findMany({
    where: (b, { eq: e }) => e(b.status, "pending"),
    orderBy: (b, { desc }) => [desc(b.createdAt)],
  })
}

export async function getAdminStats() {
  await requireAdmin()
  const now = new Date()
  const [
    bizCount,
    pendingCount,
    approvedCount,
    dealCount,
    activeDealCount,
    userCount,
    pendingClaimCount,
    totalEventsCount,
    pendingEventsCount,
    totalDealEventsCount,
  ] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(businesses),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(businesses)
      .where(eq(businesses.status, "pending")),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(businesses)
      .where(eq(businesses.status, "approved")),
    db.select({ n: sql<number>`count(*)::int` }).from(deals),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(deals)
      .where(and(gt(deals.expiresAt, now), eq(deals.paused, false))),
    db.select({ n: sql<number>`count(*)::int` }).from(users),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(businessClaims)
      .where(eq(businessClaims.status, "pending")),
    db.select({ n: sql<number>`count(*)::int` }).from(events),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(events)
      .where(eq(events.status, "pending")),
    db.select({ n: sql<number>`count(*)::int` }).from(dealEvents),
  ])
  return {
    totalBusinesses: bizCount[0]?.n ?? 0,
    pendingBusinesses: pendingCount[0]?.n ?? 0,
    approvedBusinesses: approvedCount[0]?.n ?? 0,
    totalDeals: dealCount[0]?.n ?? 0,
    activeDeals: activeDealCount[0]?.n ?? 0,
    totalUsers: userCount[0]?.n ?? 0,
    pendingClaims: pendingClaimCount[0]?.n ?? 0,
    totalEvents: totalEventsCount[0]?.n ?? 0,
    pendingEvents: pendingEventsCount[0]?.n ?? 0,
    totalDealEvents: totalDealEventsCount[0]?.n ?? 0,
  }
}

export type ActivityEntry = {
  type: "user_signup" | "business_created" | "business_approved" | "deal_created"
  label: string
  createdAt: Date
}

export async function getAdminActivityFeed(): Promise<ActivityEntry[]> {
  await requireAdmin()

  const [recentUsers, recentBusinesses, approvedBusinesses, recentDeals] =
    await Promise.all([
      db
        .select({ email: users.email, createdAt: users.createdAt })
        .from(users)
        .orderBy(sql`${users.createdAt} desc`)
        .limit(5),
      db
        .select({ name: businesses.name, createdAt: businesses.createdAt })
        .from(businesses)
        .orderBy(sql`${businesses.createdAt} desc`)
        .limit(5),
      db
        .select({ name: businesses.name, createdAt: businesses.createdAt })
        .from(businesses)
        .where(eq(businesses.status, "approved"))
        .orderBy(sql`${businesses.createdAt} desc`)
        .limit(5),
      db
        .select({ title: deals.title, createdAt: deals.createdAt })
        .from(deals)
        .orderBy(sql`${deals.createdAt} desc`)
        .limit(5),
    ])

  const entries: ActivityEntry[] = [
    ...recentUsers.map((u) => ({
      type: "user_signup" as const,
      label: u.email,
      createdAt: u.createdAt,
    })),
    ...recentBusinesses.map((b) => ({
      type: "business_created" as const,
      label: b.name,
      createdAt: b.createdAt,
    })),
    ...approvedBusinesses.map((b) => ({
      type: "business_approved" as const,
      label: b.name,
      createdAt: b.createdAt,
    })),
    ...recentDeals.map((d) => ({
      type: "deal_created" as const,
      label: d.title,
      createdAt: d.createdAt,
    })),
  ]

  entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return entries.slice(0, 20)
}

export type AdminDeal = {
  id: number
  title: string
  type: string
  discountText: string | null
  expiresAt: Date
  paused: boolean
  createdAt: Date
  businessName: string
  businessId: number
}

export async function getAllDealsForAdmin(): Promise<AdminDeal[]> {
  await requireAdmin()
  const rows = await db
    .select({
      id: deals.id,
      title: deals.title,
      type: deals.type,
      discountText: deals.discountText,
      expiresAt: deals.expiresAt,
      paused: deals.paused,
      createdAt: deals.createdAt,
      businessName: businesses.name,
      businessId: businesses.id,
    })
    .from(deals)
    .innerJoin(businesses, eq(deals.businessId, businesses.id))
    .orderBy(sql`${deals.createdAt} desc`)
    .limit(100)
  return rows
}

export type AdminUser = {
  id: number
  email: string
  name: string | null
  role: "local" | "business" | "admin"
  createdAt: Date
}

export async function getAllUsersForAdmin(): Promise<AdminUser[]> {
  await requireAdmin()
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(sql`${users.createdAt} desc`)
    .limit(200)
  return rows
}

export async function changeUserRoleAction(formData: FormData) {
  await requireAdmin()
  const userId = parseInt(formData.get("userId")?.toString() ?? "0", 10)
  const newRole = formData.get("newRole")?.toString()
  if (!userId || !newRole) return
  if (!["local", "business", "admin"].includes(newRole)) return
  await db
    .update(users)
    .set({ role: newRole as "local" | "business" | "admin" })
    .where(eq(users.id, userId))
  revalidatePath("/admin/users")
}

export type PendingClaim = {
  id: number
  createdAt: Date
  business: { id: number; name: string; slug: string }
  user: { id: number; email: string }
}

export async function getPendingClaims(): Promise<PendingClaim[]> {
  await requireAdmin()
  const rows = await db
    .select({
      id: businessClaims.id,
      createdAt: businessClaims.createdAt,
      bizId: businesses.id,
      bizName: businesses.name,
      bizSlug: businesses.slug,
      userId: users.id,
      userEmail: users.email,
    })
    .from(businessClaims)
    .innerJoin(businesses, eq(businessClaims.businessId, businesses.id))
    .innerJoin(users, eq(businessClaims.userId, users.id))
    .where(eq(businessClaims.status, "pending"))
    .orderBy(businessClaims.createdAt)
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    business: { id: r.bizId, name: r.bizName, slug: r.bizSlug },
    user: { id: r.userId, email: r.userEmail },
  }))
}

export async function approveClaimAction(formData: FormData) {
  await requireAdmin()
  const id = parseInt(formData.get("claimId")?.toString() ?? "0", 10)
  if (!id) return
  const claim = await db.query.businessClaims.findFirst({
    where: (c, { eq: e }) => e(c.id, id),
  })
  if (!claim) return
  // Transfer ownership and mark claim approved
  await db
    .update(businesses)
    .set({ ownerUserId: claim.userId })
    .where(eq(businesses.id, claim.businessId))
  await db
    .update(businessClaims)
    .set({ status: "approved" })
    .where(eq(businessClaims.id, id))
  // Reject any other pending claims on the same business
  await db
    .update(businessClaims)
    .set({ status: "rejected" })
    .where(
      and(
        eq(businessClaims.businessId, claim.businessId),
        eq(businessClaims.status, "pending")
      )
    )
  revalidatePath("/admin")
  revalidatePath(`/biz/${claim.businessId}`)
  revalidatePath("/dashboard/profile")
}

export async function rejectClaimAction(formData: FormData) {
  await requireAdmin()
  const id = parseInt(formData.get("claimId")?.toString() ?? "0", 10)
  if (!id) return
  await db
    .update(businessClaims)
    .set({ status: "rejected" })
    .where(eq(businessClaims.id, id))
  revalidatePath("/admin")
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getPendingEvents() {
  await requireAdmin()
  return db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      location: events.location,
      category: events.category,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      createdAt: events.createdAt,
    })
    .from(events)
    .where(eq(events.status, "pending"))
    .orderBy(events.createdAt)
}

export async function approveEventAction(formData: FormData) {
  await requireAdmin()
  const id = parseInt(formData.get("eventId")?.toString() ?? "0", 10)
  if (!id) return
  await db.update(events).set({ status: "approved" }).where(eq(events.id, id))
  revalidatePath("/admin/events")
  revalidatePath("/")
}

export async function rejectEventAction(formData: FormData) {
  await requireAdmin()
  const id = parseInt(formData.get("eventId")?.toString() ?? "0", 10)
  if (!id) return
  await db.update(events).set({ status: "cancelled" }).where(eq(events.id, id))
  revalidatePath("/admin/events")
}
