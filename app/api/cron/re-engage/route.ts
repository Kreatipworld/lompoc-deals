import { NextResponse } from "next/server"
import { unstable_noStore } from "next/cache"
import { neon } from "@neondatabase/serverless"
import { sendReengagementEmail } from "@/lib/email"
import { logCronRun } from "@/lib/cron-log"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Owner accounts created by our own tooling — never real members to re-engage.
const PLACEHOLDER = [
  "system@lompocdeals.test",
  "scraper@lompocdeals.system",
  "seedowner@lompocdeals.internal",
  "owner@lompocdeals.test",
  "demo-deals@lompoc-locals.local",
]
const BATCH = 25 // cap per run so we never burst

/**
 * Re-engagement nudge for claimed, free-tier businesses that have gone quiet —
 * no active deal, listed 14+ days, not nudged in the last 30 days, not opted out,
 * and not a paying/trialing Growth member. One email per owner per run.
 */
export async function GET(request: Request) {
  // Crons must read the live database, never Next's fetch cache (the Neon
  // driver goes through fetch, and GET handlers cache identical fetches).
  unstable_noStore()
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const sql = neon(process.env.DATABASE_URL!)

  const rows = await sql`
    SELECT DISTINCT ON (u.id)
      u.id AS user_id, u.email AS owner_email,
      b.owner_full_name, b.name AS business_name
    FROM businesses b
    JOIN users u ON u.id = b.owner_user_id
    WHERE b.status = 'approved'
      AND u.email IS NOT NULL
      AND u.email <> ALL(${PLACEHOLDER})
      AND b.created_at < now() - interval '14 days'
      AND (b.last_reengaged_at IS NULL OR b.last_reengaged_at < now() - interval '30 days')
      AND NOT EXISTS (
        SELECT 1 FROM deals d
        WHERE d.business_id = b.id AND d.paused = false AND d.expires_at > now()
      )
      AND NOT EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.user_id = u.id AND s.status IN ('active', 'trialing')
      )
      AND lower(u.email) NOT IN (SELECT lower(email) FROM email_suppressions)
    ORDER BY u.id, b.created_at ASC
    LIMIT ${BATCH}`

  let sent = 0
  for (const r of rows) {
    await sendReengagementEmail(
      r.owner_email as string,
      ((r.owner_full_name as string) || "").trim(),
      r.business_name as string
    )
    // Mark ALL of this owner's businesses so they don't re-trigger next run.
    await sql`UPDATE businesses SET last_reengaged_at = now() WHERE owner_user_id = ${r.user_id}`
    sent++
    await new Promise((res) => setTimeout(res, 300)) // gentle throttle
  }

  const result = { sent, considered: rows.length }
  await logCronRun("re-engage", result)
  return NextResponse.json(result)
}
