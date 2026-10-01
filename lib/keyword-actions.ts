"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { businesses, trackedKeywords } from "@/db/schema"
import { normalizeKeyword } from "@/lib/keyword-positions"

async function requireAdmin(): Promise<void> {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") throw new Error("Not authorized")
}

/**
 * Add a keyword to watch. Optional business link (members) and target path;
 * when a business is picked and no path given, the path defaults to /biz/<slug>.
 * Idempotent: the same keyword twice is a no-op.
 */
export async function addTrackedKeywordAction(formData: FormData) {
  await requireAdmin()
  const keyword = normalizeKeyword(formData.get("keyword")?.toString() ?? "")
  if (!keyword || keyword.length > 120) return
  const businessId = parseInt(formData.get("businessId")?.toString() ?? "", 10) || null
  let targetPath = (formData.get("targetPath")?.toString() ?? "").trim().slice(0, 300) || null
  if (targetPath && !targetPath.startsWith("/")) targetPath = `/${targetPath}`
  if (!targetPath && businessId) {
    const biz = await db.query.businesses.findFirst({ where: eq(businesses.id, businessId), columns: { slug: true } })
    if (biz) targetPath = `/biz/${biz.slug}`
  }
  const note = (formData.get("note")?.toString() ?? "").trim().slice(0, 300) || null
  await db.insert(trackedKeywords).values({ keyword, businessId, targetPath, note }).onConflictDoNothing()
  revalidatePath("/admin/seo")
}

export async function removeTrackedKeywordAction(formData: FormData) {
  await requireAdmin()
  const id = parseInt(formData.get("id")?.toString() ?? "0", 10)
  if (!id) return
  await db.delete(trackedKeywords).where(eq(trackedKeywords.id, id))
  revalidatePath("/admin/seo")
}
