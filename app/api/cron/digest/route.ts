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

  // One edition per cycle: if a successful send already went out in the last
  // 20 hours (e.g. a manual founder-approved send before the 9 AM cron), the
  // scheduled run steps aside instead of double-mailing the town.
  const recent = await db.execute(sql`
    SELECT 1 FROM cron_runs
    WHERE name = 'digest' AND ok = true
      AND (result->>'sent')::int > 0
      AND created_at > now() - interval '20 hours'
    LIMIT 1`)
  if ((recent as unknown as { rows?: unknown[] }).rows?.length || (Array.isArray(recent) && recent.length)) {
    return NextResponse.json({ sent: 0, skipped: "already sent this cycle" })
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
