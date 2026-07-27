import { NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/db/client"
import { Resend } from "resend"

export const dynamic = "force-dynamic"

const FROM_ADDRESS = "Lompoc Locals <hello@lompoclocals.com>"
const VITALS_TO = process.env.VITALS_EMAIL ?? "andres@kreatipdesign.com"

// Display prices for MRR math — mirrors TIERS but avoids importing the Stripe
// client into a lightweight cron.
const TIER_PRICE: Record<string, number> = { standard: 39.99, premium: 99.99 }

/** Weekly platform vitals — the demand-side numbers that tell us if Lompoc
 *  Locals is growing: members, claims, subscribers, revenue. Runs Mondays. */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [row] = await db.execute(sql`
    SELECT
      (SELECT count(*) FROM users WHERE email NOT LIKE '%.internal'
         AND email NOT LIKE '%.test' AND email NOT LIKE '%.system'
         AND email NOT LIKE '%.local')                                            AS real_users,
      (SELECT count(*) FROM users WHERE created_at > now() - interval '7 days')   AS new_users_7d,
      (SELECT count(*) FROM subscribers WHERE confirmed_at IS NOT NULL)           AS digest_subs,
      (SELECT count(*) FROM subscribers WHERE confirmed_at > now() - interval '7 days') AS new_subs_7d,
      (SELECT count(*) FROM coupon_claims)                                        AS claims_total,
      (SELECT count(*) FROM coupon_claims WHERE claimed_at > now() - interval '7 days') AS claims_7d,
      (SELECT count(*) FROM coupon_claims WHERE redeemed_at > now() - interval '7 days') AS redemptions_7d,
      (SELECT count(*) FROM deals WHERE expires_at >= now() AND NOT paused)       AS live_deals,
      (SELECT count(*) FROM businesses WHERE status = 'approved')                 AS live_businesses,
      (SELECT count(*) FROM businesses WHERE status = 'pending'
         AND created_at > now() - interval '7 days')                              AS new_pending_biz_7d,
      (SELECT count(*) FROM events WHERE starts_at > now())                       AS upcoming_events,
      (SELECT count(DISTINCT session_id) FROM analytics_events
         WHERE created_at > now() - interval '7 days')                            AS visitors_7d,
      (SELECT json_object_agg(tier, n) FROM (
         SELECT tier, count(*) AS n FROM subscriptions
         WHERE status = 'active' GROUP BY tier) t)                                AS subs_by_tier
  `) as unknown as Array<Record<string, unknown>>

  const n = (k: string) => Number(row[k] ?? 0)
  const subsByTier = (row.subs_by_tier ?? {}) as Record<string, number>
  const mrr = Object.entries(subsByTier).reduce(
    (sum, [tier, count]) => sum + (TIER_PRICE[tier] ?? 0) * Number(count),
    0
  )

  const metrics: Array<[string, string, string]> = [
    ["Visitors (7d)", String(n("visitors_7d")), "unique sessions on the site"],
    ["MRR", `$${mrr.toFixed(2)}`, `${subsByTier.standard ?? 0} Growth · ${subsByTier.premium ?? 0} Plus`],
    ["Coupon claims (7d)", String(n("claims_7d")), `${n("claims_total")} all-time`],
    ["Redemptions (7d)", String(n("redemptions_7d")), "codes redeemed at the counter"],
    ["New accounts (7d)", String(n("new_users_7d")), `${n("real_users")} real accounts total`],
    ["Digest subscribers", String(n("digest_subs")), `${n("new_subs_7d")} new this week`],
    ["Live deals", String(n("live_deals")), "the supply that drives claims"],
    ["New business signups (7d)", String(n("new_pending_biz_7d")), "awaiting approval"],
    ["Live businesses", String(n("live_businesses")), `${n("upcoming_events")} upcoming events`],
  ]

  const rows = metrics
    .map(
      ([label, value, note]) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee6f0;color:#444;font-size:14px">${label}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee6f0;text-align:right;font-size:18px;font-weight:700;color:#650C75">${value}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee6f0;color:#999;font-size:12px">${note}</td>
      </tr>`
    )
    .join("")

  const html = `
  <div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;background:#fdfaf4;padding:24px;border-radius:12px">
    <h1 style="color:#650C75;font-size:22px;margin:0 0 4px">Lompoc Locals — Weekly Vitals</h1>
    <p style="color:#777;font-size:13px;margin:0 0 18px">${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" })}</p>
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden">${rows}</table>
    <p style="color:#999;font-size:11px;margin-top:16px">Automated Monday report · lompoclocals.com</p>
  </div>`

  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      await new Resend(resendKey).emails.send({
        from: FROM_ADDRESS,
        to: VITALS_TO,
        subject: `Vitals: ${n("visitors_7d")} visitors · ${n("claims_7d")} claims · $${mrr.toFixed(0)} MRR`,
        html,
      })
    } catch (err) {
      console.error("[cron/vitals] email send failed:", err)
    }
  }

  return NextResponse.json({
    sent: Boolean(resendKey),
    visitors_7d: n("visitors_7d"),
    mrr,
    claims_7d: n("claims_7d"),
  })
}
