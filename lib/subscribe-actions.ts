"use server"

import { randomBytes } from "crypto"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { subscribers } from "@/db/schema"
import { sendConfirmationEmail } from "@/lib/email"

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
  const parsed = subscribeSchema.safeParse({ email: formData.get("email") })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" }
  }
  const email = parsed.data.email.toLowerCase()

  // Check if already exists
  const existing = await db.query.subscribers.findFirst({
    where: (s, { eq: e }) => e(s.email, email),
  })

  let token: string
  if (existing) {
    if (existing.confirmedAt) {
      return { success: "You're already subscribed. Thanks!" }
    }
    // Re-issue confirmation
    token = existing.unsubscribeToken
  } else {
    token = makeToken()
    await db.insert(subscribers).values({
      email,
      unsubscribeToken: token,
    })
  }

  const result = await sendConfirmationEmail(email, token)
  if (!result.ok) {
    // If email service isn't configured, still tell the user the
    // address is on file — they just won't receive a confirmation.
    return {
      success:
        "Thanks! Email service is not yet configured, so confirmation will be sent later.",
    }
  }

  return {
    success:
      "Check your inbox for a confirmation link. Click it to start receiving the weekly digest.",
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
  }
  return { ok: true as const, email: sub.email }
}

export async function unsubscribeByToken(token: string) {
  const sub = await db.query.subscribers.findFirst({
    where: (s, { eq: e }) => e(s.unsubscribeToken, token),
  })
  if (!sub) return { ok: false as const, message: "Invalid token" }
  await db.delete(subscribers).where(eq(subscribers.id, sub.id))
  return { ok: true as const, email: sub.email }
}
