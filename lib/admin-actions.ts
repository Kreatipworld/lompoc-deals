"use server"

import { revalidatePath } from "next/cache"
import { eq, sql, and } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { businesses, deals, users, businessClaims } from "@/db/schema"

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
  const [bizCount, pendingCount, dealCount, userCount, pendingClaimCount] =
    await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(businesses),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(businesses)
        .where(eq(businesses.status, "pending")),
      db.select({ n: sql<number>`count(*)::int` }).from(deals),
      db.select({ n: sql<number>`count(*)::int` }).from(users),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(businessClaims)
        .where(eq(businessClaims.status, "pending")),
    ])
  return {
    totalBusinesses: bizCount[0]?.n ?? 0,
    pendingBusinesses: pendingCount[0]?.n ?? 0,
    totalDeals: dealCount[0]?.n ?? 0,
    totalUsers: userCount[0]?.n ?? 0,
    pendingClaims: pendingClaimCount[0]?.n ?? 0,
  }
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
