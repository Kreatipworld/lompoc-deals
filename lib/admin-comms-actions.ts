"use server"

import { isNotNull } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscribers } from "@/db/schema"
import { sendDigestEmail, sendBroadcastEmail } from "@/lib/email"
import { getDigestDeals, getDigestEvents } from "@/lib/digest"

async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin" || !session.user.email) {
    throw new Error("Not authorized")
  }
  return { email: session.user.email }
}

export type CommsResult = {
  ok: boolean
  message: string
  sent?: number
  failed?: number
}

/** Email the real Saturday digest to the signed-in admin so they can preview it. */
export async function sendTestDigestAction(): Promise<CommsResult> {
  const admin = await requireAdmin()
  const digestDeals = await getDigestDeals()
  const digestEvents = await getDigestEvents()
  if (digestDeals.length === 0 && digestEvents.length === 0) {
    return { ok: false, message: "No deals or events from the past 7 days — the digest would be skipped this week." }
  }
  const result = await sendDigestEmail(admin.email, "admin-test", digestDeals, "en", digestEvents)
  return result.ok
    ? { ok: true, message: `Test digest (${digestDeals.length} deals, ${digestEvents.length} events) sent to ${admin.email}.` }
    : { ok: false, message: result.error ?? "Send failed" }
}

/**
 * Broadcast to confirmed digest subscribers.
 * mode=test → sends only to the signed-in admin (using the EN body).
 * mode=send → requires confirm="yes"; sends to every confirmed subscriber
 * in their own language (ES body falls back to EN when empty).
 */
export async function sendBroadcastAction(formData: FormData): Promise<CommsResult> {
  const admin = await requireAdmin()
  const mode = formData.get("mode")?.toString()
  const subject = formData.get("subject")?.toString().trim() ?? ""
  const bodyEn = formData.get("bodyEn")?.toString().trim() ?? ""
  const bodyEs = formData.get("bodyEs")?.toString().trim() ?? ""

  if (!subject || !bodyEn) {
    return { ok: false, message: "Subject and English body are required." }
  }

  if (mode === "test") {
    const result = await sendBroadcastEmail(admin.email, "admin-test", subject, bodyEn, "en")
    return result.ok
      ? { ok: true, message: `Test sent to ${admin.email}. Check your inbox before broadcasting.` }
      : { ok: false, message: result.error ?? "Send failed" }
  }

  if (mode !== "send" || formData.get("confirm")?.toString() !== "yes") {
    return { ok: false, message: "Broadcast not confirmed." }
  }

  const recipients = await db
    .select({
      email: subscribers.email,
      unsubscribeToken: subscribers.unsubscribeToken,
      locale: subscribers.locale,
    })
    .from(subscribers)
    .where(isNotNull(subscribers.confirmedAt))

  let sent = 0
  let failed = 0
  for (const r of recipients) {
    const locale: "en" | "es" = r.locale === "es" ? "es" : "en"
    const body = locale === "es" && bodyEs ? bodyEs : bodyEn
    const result = await sendBroadcastEmail(r.email, r.unsubscribeToken, subject, body, locale)
    if (result.ok) sent++
    else failed++
    // Stay well under Resend rate limits.
    await new Promise((res) => setTimeout(res, 300))
  }

  return {
    ok: failed === 0,
    message: `Broadcast finished: ${sent} sent, ${failed} failed (of ${recipients.length} confirmed subscribers).`,
    sent,
    failed,
  }
}
