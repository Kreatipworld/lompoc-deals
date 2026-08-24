import { randomBytes } from "crypto"
import { db } from "@/db/client"
import { subscribers } from "@/db/schema"
import { sql } from "drizzle-orm"

/**
 * Every business account belongs in the weekly digest — it's the town's front
 * page, and partners are the town. Idempotent: an email already subscribed (or
 * unsubscribed onto the suppression list, which the send excludes) is left
 * exactly as it was.
 */
export async function ensureDigestSubscription(
  email: string,
  locale: "en" | "es" = "en"
): Promise<void> {
  try {
    await db
      .insert(subscribers)
      .values({
        email: email.toLowerCase().trim(),
        locale,
        confirmedAt: sql`now()`,
        unsubscribeToken: randomBytes(24).toString("hex"),
      })
      .onConflictDoNothing({ target: subscribers.email })
  } catch (err) {
    // Never let digest bookkeeping break a signup.
    console.error("[digest-subscribe] failed:", err)
  }
}
