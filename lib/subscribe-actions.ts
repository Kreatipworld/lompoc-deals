"use server"

import { randomBytes } from "crypto"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscribers } from "@/db/schema"
import { sendConfirmationEmail, notifyPlatform } from "@/lib/email"
import { track } from "@/lib/analytics/track"
import { getSessionId } from "@/lib/analytics/session"
import { getCurrentLocale } from "@/lib/i18n-helpers"

const subscribeSchema = z.object({
  email: z.string().email("Enter a valid email"),
})

export type SubscribeState =
  | { error?: string; success?: string }
  | undefined

function makeToken() {
  return randomBytes(24).toString("hex")
}

export async function subscribeAction(
  _prev: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const locale = await getCurrentLocale()
  const t = await getTranslations("subscribe")

  const parsed = subscribeSchema.safeParse({ email: formData.get("email") })
  if (!parsed.success) {
    return { error: t("invalidEmail") }
  }
  const email = parsed.data.email.toLowerCase()

  // Check if already exists
  const existing = await db.query.subscribers.findFirst({
    where: (s, { eq: e }) => e(s.email, email),
  })

  let token: string
  let newSubscriberId: number | null = null
  if (existing) {
    if (existing.confirmedAt) {
      return { success: t("alreadySubscribed") }
    }
    // Re-issue confirmation
    token = existing.unsubscribeToken
    // Update stored locale so re-subscribing in Spanish sticks
    await db
      .update(subscribers)
      .set({ locale })
      .where(eq(subscribers.id, existing.id))
  } else {
    token = makeToken()
    const [newSub] = await db.insert(subscribers).values({
      email,
      unsubscribeToken: token,
      locale,
    }).returning({ id: subscribers.id })
    newSubscriberId = newSub?.id ?? null
    await track("digest_subscribed", {
      userId: null,
      sessionId: getSessionId(),
      targetType: "subscriber",
      targetId: newSubscriberId,
      props: { doubleOptIn: false },
    })
  }

  const result = await sendConfirmationEmail(email, token, locale)
  if (!result.ok) {
    // If email service isn't configured, still tell the user the
    // address is on file — they just won't receive a confirmation.
    return {
      success: t("emailNotConfigured"),
    }
  }

  return {
    success: t("checkInbox"),
  }
}

export async function confirmSubscriptionByToken(token: string) {
  const sub = await db.query.subscribers.findFirst({
    where: (s, { eq: e }) => e(s.unsubscribeToken, token),
  })
  if (!sub) return { ok: false as const, message: "Invalid or expired token" }
  if (!sub.confirmedAt) {
    await db
      .update(subscribers)
      .set({ confirmedAt: new Date() })
      .where(eq(subscribers.id, sub.id))
    await track("digest_subscribed", {
      userId: null,
      sessionId: getSessionId(),
      targetType: "subscriber",
      targetId: sub.id,
      props: { doubleOptIn: true },
    })
    // Alert the founder inbox — fire-and-forget
    notifyPlatform("📬 New digest subscriber confirmed", [
      `<strong>${sub.email.replace(/</g, "&lt;")}</strong>`,
      `Locale: ${sub.locale}`,
    ]).catch((err) =>
      console.error("[confirmSubscriptionByToken] platform notify failed:", err)
    )
  }
  return { ok: true as const, email: sub.email }
}

/** Signed-in local subscribes their account email from /account — one click,
 * still double-opt-in: we send the confirmation email rather than confirming
 * on their behalf. */
export async function accountSubscribeAction() {
  const session = await auth()
  const email = session?.user?.email?.toLowerCase()
  if (!email) redirect("/login?from=/account")
  const locale = await getCurrentLocale()

  const existing = await db.query.subscribers.findFirst({
    where: (s, { eq: e }) => e(s.email, email!),
  })
  if (existing?.confirmedAt) redirect("/account?digest=already")

  let token: string
  if (existing) {
    token = existing.unsubscribeToken
    await db.update(subscribers).set({ locale }).where(eq(subscribers.id, existing.id))
  } else {
    token = makeToken()
    await db.insert(subscribers).values({ email: email!, unsubscribeToken: token, locale })
  }
  await sendConfirmationEmail(email!, token, locale)
  redirect("/account?digest=sent")
}

/** Signed-in local leaves the digest from /account. */
export async function accountUnsubscribeAction() {
  const session = await auth()
  const email = session?.user?.email?.toLowerCase()
  if (!email) redirect("/login?from=/account")

  const existing = await db.query.subscribers.findFirst({
    where: (s, { eq: e }) => e(s.email, email!),
  })
  if (existing) {
    await db.delete(subscribers).where(eq(subscribers.id, existing.id))
  }
  redirect("/account?digest=off")
}

export async function unsubscribeByToken(token: string) {
  const sub = await db.query.subscribers.findFirst({
    where: (s, { eq: e }) => e(s.unsubscribeToken, token),
  })
  if (!sub) return { ok: false as const, message: "Invalid token" }
  await db.delete(subscribers).where(eq(subscribers.id, sub.id))
  return { ok: true as const, email: sub.email }
}
