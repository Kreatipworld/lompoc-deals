"use server"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { dealEvents } from "@/db/schema"

export async function trackClaimAction(formData: FormData) {
  const dealId = parseInt(formData.get("dealId")?.toString() ?? "0", 10)
  const redirectTo = formData.get("redirectTo")?.toString() ?? "/"
  if (!dealId) return
  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null
  try {
    await db.insert(dealEvents).values({ dealId, userId, eventType: "claim" })
  } catch {
    // best-effort
  }
  // Only allow internal redirects
  const safeTo = redirectTo.startsWith("/") ? redirectTo : "/"
  redirect(safeTo)
}

export async function trackRedeemAction(formData: FormData) {
  const dealId = parseInt(formData.get("dealId")?.toString() ?? "0", 10)
  if (!dealId) return
  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null
  try {
    await db.insert(dealEvents).values({ dealId, userId, eventType: "redeem" })
  } catch {
    // best-effort
  }
}
