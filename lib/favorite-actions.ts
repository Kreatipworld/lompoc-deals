"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { favorites } from "@/db/schema"

export async function toggleFavoriteAction(formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "local") {
    return
  }
  const userId = parseInt(session.user.id, 10)
  const dealId = parseInt(formData.get("dealId")?.toString() ?? "0", 10)
  if (!dealId) return

  const existing = await db.query.favorites.findFirst({
    where: (f, { and: a, eq: e }) =>
      a(e(f.userId, userId), e(f.dealId, dealId)),
  })

  if (existing) {
    await db
      .delete(favorites)
      .where(
        and(eq(favorites.userId, userId), eq(favorites.dealId, dealId))
      )
  } else {
    await db.insert(favorites).values({ userId, dealId })
  }

  // Revalidate any page that may show this deal
  const from = formData.get("from")?.toString()
  if (from) revalidatePath(from)
  revalidatePath("/")
  revalidatePath("/favorites")
}
