"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { businesses, deals } from "@/db/schema"

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
  // Soft-delete by expiring immediately
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
