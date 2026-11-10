import { NextResponse } from "next/server"
import { unstable_noStore } from "next/cache"
import { neon } from "@neondatabase/serverless"
import { sendMemberReportEmail } from "@/lib/email"
import { getMemberRecipients, getMemberMonthStats, previousMonthRange } from "@/lib/member-report"
import { logCronRun } from "@/lib/cron-log"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const PREVIEW_TO = "hello@lompoclocals.com"
// Owner, Oct 21 2026: "We don't want to make emails that have very low traffic" — below this
// many real visits in the month, the member gets no report that month.
const MIN_VIEWS = 25

/**
 * 1st of every month: each paying member gets last month's numbers for their page
 * (owner-approved Oct 20 2026 — members keep paying for what they can see working).
 *
 *   ?preview=1  → up to 3 members' reports (busiest first) go to hello@ only, marked [PREVIEW];
 *                 nothing is sent to members and nothing is recorded as sent.
 *
 * Sends at most once per month: a successful live run is recorded in cron_runs and a second
 * call in the same month is a no-op. Members under MIN_VIEWS real visits that month are
 * skipped — we never mail someone a low-traffic report.
 */
export async function GET(request: Request) {
  unstable_noStore()
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const preview = new URL(request.url).searchParams.get("preview") === "1"
  const sql = neon(process.env.DATABASE_URL!)
  const range = previousMonthRange()

  if (!preview) {
    const [done] = await sql`
      SELECT 1 FROM cron_runs
      WHERE name = 'member-report' AND ok = true AND (result->>'preview')::boolean IS NOT TRUE
        AND created_at >= ${range.end}
      LIMIT 1`
    if (done) return NextResponse.json({ skipped: "already sent this month", month: range.label })
  }

  const recipients = await getMemberRecipients(sql)
  const stats = await getMemberMonthStats(recipients.map((r) => r.businessId), range, sql)

  // Preview: the 3 busiest pages, so the proof shows the report at its most representative.
  const queue = preview
    ? [...recipients].sort((a, b) => (stats.get(b.businessId)?.views ?? 0) - (stats.get(a.businessId)?.views ?? 0)).slice(0, 3)
    : recipients

  let sent = 0
  let skippedLow = 0
  const failures: string[] = []
  for (const r of queue) {
    const s = stats.get(r.businessId)
    if (!s || s.views < MIN_VIEWS) {
      skippedLow++
      continue
    }
    try {
      await sendMemberReportEmail({
        email: r.ownerEmail,
        toOverride: preview ? PREVIEW_TO : undefined,
        name: r.ownerName,
        businessName: r.businessName,
        slug: r.slug,
        monthLabel: range.label,
        stats: s,
        hasActiveDeal: r.hasActiveDeal,
      })
      sent++
    } catch (err) {
      failures.push(`${r.businessId}: ${err instanceof Error ? err.message : String(err)}`)
    }
    await new Promise((res) => setTimeout(res, 600)) // Resend rate limit: stay well under 2/s
  }

  const result = { preview, month: range.label, members: recipients.length, sent, skippedLow, minViews: MIN_VIEWS, failures }
  await logCronRun("member-report", result, failures.length === 0)
  return NextResponse.json(result)
}
