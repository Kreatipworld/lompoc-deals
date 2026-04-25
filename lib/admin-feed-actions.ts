"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { feedPosts, users } from "@/db/schema"
import { computeExpiration } from "@/lib/feed-expiration"
import { sendFeedApprovalEmail, sendFeedRejectionEmail } from "@/lib/email"

async function requireAdmin(): Promise<number> {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Not authorized")
  }
  return parseInt(session.user.id, 10)
}

async function getPostAndPoster(id: number) {
  const result = await db
    .select({ post: feedPosts, posterEmail: users.email, posterLocale: users.locale })
    .from(feedPosts)
    .leftJoin(users, eq(users.id, feedPosts.postedByUserId))
    .where(eq(feedPosts.id, id))
    .limit(1)
  return result[0] ?? null
}

export async function approveFeedPostAction(formData: FormData): Promise<void> {
  const adminId = await requireAdmin()
  const id = parseInt(formData.get("feedPostId")?.toString() ?? "0", 10)
  if (!id) return

  const data = await getPostAndPoster(id)
  if (!data) return
  const { post, posterEmail, posterLocale } = data

  const now = new Date()
  const expiresAt = computeExpiration(
    { type: post.type, saleEndsAt: post.saleEndsAt },
    now
  )

  await db
    .update(feedPosts)
    .set({
      status: "approved",
      approvedAt: now,
      approvedByUserId: adminId,
      expiresAt,
    })
    .where(eq(feedPosts.id, id))

  if (posterEmail) {
    sendFeedApprovalEmail(posterEmail, post.title, (posterLocale ?? "en") as "en" | "es").catch((e) =>
      console.error("[approveFeedPostAction] email failed:", e)
    )
  }

  revalidatePath("/admin/feed")
  revalidatePath("/feed")
  revalidatePath("/feed/my")
}

export async function rejectFeedPostAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = parseInt(formData.get("feedPostId")?.toString() ?? "0", 10)
  if (!id) return
  const reason = formData.get("reason")?.toString().trim() ?? ""
  if (!reason) {
    throw new Error("Rejection reason is required")
  }

  const data = await getPostAndPoster(id)
  if (!data) return
  const { post, posterEmail, posterLocale } = data

  await db
    .update(feedPosts)
    .set({ status: "rejected", rejectionReason: reason })
    .where(eq(feedPosts.id, id))

  if (posterEmail) {
    sendFeedRejectionEmail(posterEmail, post.title, reason, (posterLocale ?? "en") as "en" | "es").catch((e) =>
      console.error("[rejectFeedPostAction] email failed:", e)
    )
  }

  revalidatePath("/admin/feed")
  revalidatePath("/feed/my")
}

export async function featureFeedPostAction(formData: FormData): Promise<void> {
  const adminId = await requireAdmin()
  const id = parseInt(formData.get("feedPostId")?.toString() ?? "0", 10)
  if (!id) return

  const data = await getPostAndPoster(id)
  if (!data) return
  const { post, posterEmail, posterLocale } = data

  if (post.status === "pending") {
    const now = new Date()
    const expiresAt = computeExpiration(
      { type: post.type, saleEndsAt: post.saleEndsAt },
      now
    )
    await db
      .update(feedPosts)
      .set({
        status: "approved",
        approvedAt: now,
        approvedByUserId: adminId,
        expiresAt,
        isFeatured: true,
      })
      .where(eq(feedPosts.id, id))

    if (posterEmail) {
      sendFeedApprovalEmail(posterEmail, post.title, (posterLocale ?? "en") as "en" | "es").catch((e) =>
        console.error("[featureFeedPostAction] email failed:", e)
      )
    }
  } else {
    await db.update(feedPosts).set({ isFeatured: true }).where(eq(feedPosts.id, id))
  }

  revalidatePath("/admin/feed")
  revalidatePath("/feed")
}
