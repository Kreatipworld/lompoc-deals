"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { businessFollows, users } from "@/db/schema"

export async function toggleFollowBusinessAction(formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "local") return

  const userId = parseInt(session.user.id, 10)
  const businessId = parseInt(formData.get("businessId")?.toString() ?? "0", 10)
  if (!businessId) return

  const existing = await db.query.businessFollows.findFirst({
    where: (f, { and: a, eq: e }) =>
      a(e(f.userId, userId), e(f.businessId, businessId)),
  })

  if (existing) {
    await db
      .delete(businessFollows)
      .where(
        and(
          eq(businessFollows.userId, userId),
          eq(businessFollows.businessId, businessId)
        )
      )
  } else {
    await db.insert(businessFollows).values({ userId, businessId })
  }

  const slug = formData.get("slug")?.toString()
  if (slug) revalidatePath(`/biz/${slug}`)
  revalidatePath("/")
  revalidatePath("/account")
}

export async function updateNotificationPrefsAction(formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "local") return

  const userId = parseInt(session.user.id, 10)
  const enabled = formData.get("notificationEmails") === "on"

  await db
    .update(users)
    .set({ notificationEmails: enabled })
    .where(eq(users.id, userId))

  revalidatePath("/account")
}
