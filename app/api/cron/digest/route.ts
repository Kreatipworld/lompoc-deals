import { NextResponse } from "next/server"
import { and, isNotNull, isNull, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { subscribers, emailSuppressions } from "@/db/schema"
import { sendMasterDigestEmail } from "@/lib/email"
import { getMasterDigestContent, hasMasterDigestContent } from "@/lib/digest"
import { logCronRun } from "@/lib/cron-log"

export const dynamic = "force-dynamic"
export const maxDuration = 300

// Resend's default rate limit is 2 req/s — 550ms keeps us under it, which
// caps one run at ~540 sends inside maxDuration. Revisit before the list
// gets anywhere near that.
const THROTTLE_MS = 550

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const content = await getMasterDigestContent()
  if (!hasMasterDigestContent(content)) {
    await logCronRun("digest", { sent: 0, skipped: "no content this week" })
    return NextResponse.json({ sent: 0, skipped: "no content this week" })
  }

  // Confirmed subscribers minus anyone on the suppression list — a one-click
  // unsubscribe from ANY of our emails must also stop the Monday digest.
  const confirmedSubs = await db
    .select({
      email: subscribers.email,
      unsubscribeToken: subscribers.unsubscribeToken,
      locale: subscribers.locale,
    })
    .from(subscribers)
    .leftJoin(
      emailSuppressions,
      sql`lower(${subscribers.email}) = lower(${emailSuppressions.email})`
    )
    .where(and(isNotNull(subscribers.confirmedAt), isNull(emailSuppressions.id)))

  let sent = 0
  let failed = 0
  for (const sub of confirmedSubs) {
    const locale: "en" | "es" = sub.locale === "es" ? "es" : "en"
    const result = await sendMasterDigestEmail(sub.email, sub.unsubscribeToken, content, locale)
    if (result.ok) sent++
    else failed++
    await new Promise((res) => setTimeout(res, THROTTLE_MS))
  }

  const result = { sent, failed, subscribers: confirmedSubs.length }
  await logCronRun("digest", result, failed === 0)
  return NextResponse.json(result)
}
