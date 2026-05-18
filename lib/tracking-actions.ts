"use server"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { dealEvents } from "@/db/schema"
import { track } from "@/lib/analytics/track"
import { getSessionId } from "@/lib/analytics/session"

export async function trackClaimAction(formData: FormData) {
  const dealId = parseInt(formData.get("dealId")?.toString() ?? "0", 10)
  const redirectTo = formData.get("redirectTo")?.toString() ?? "/"
  if (!dealId) return
  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null
  const sessionId = getSessionId()
  try {
    // Dual-write: deal_events still powers the "my claimed deals" user history page;
    // analytics_events powers the new dashboard. Drop deal_events once history is migrated.
    await Promise.all([
      db.insert(dealEvents).values({ dealId, userId, eventType: "claim" }),
      track("deal_claim", { userId, sessionId, targetType: "deal", targetId: dealId }),
    ])
  } catch {
    // best-effort
  }
  const safeTo = redirectTo.startsWith("/") ? redirectTo : "/"
  redirect(safeTo)
}

export async function trackRedeemAction(formData: FormData) {
  const dealId = parseInt(formData.get("dealId")?.toString() ?? "0", 10)
  if (!dealId) return
  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null
  const sessionId = getSessionId()
  try {
    await Promise.all([
      db.insert(dealEvents).values({ dealId, userId, eventType: "redeem" }),
      track("deal_redeem", { userId, sessionId, targetType: "deal", targetId: dealId }),
    ])
  } catch {
    // best-effort
  }
}
