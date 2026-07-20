"use server"

import { redirect } from "next/navigation"
import { sql } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { dealEvents, deals } from "@/db/schema"
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
    // Claim now subsumes the old separate click step (the CTA jumps straight to the
    // claim page), so we also record the click-side writes here to keep the
    // clicks/CTR/claimRate funnel (lib/funnel-queries.ts) from freezing.
    await Promise.all([
      db.insert(dealEvents).values({ dealId, userId, eventType: "claim" }),
      track("deal_claim", { userId, sessionId, targetType: "deal", targetId: dealId }),
      db
        .update(deals)
        .set({ clickCount: sql`${deals.clickCount} + 1` })
        .where(sql`${deals.id} = ${dealId}`),
      track("deal_click", { userId, sessionId, targetType: "deal", targetId: dealId }),
    ])
  } catch {
    // best-effort
  }
  const safeTo = redirectTo.startsWith("/") ? redirectTo : "/"
  redirect(safeTo)
}
