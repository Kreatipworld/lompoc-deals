#!/usr/bin/env node
// Did they open it, claim it, sign in, pay? One read-out per invite.
//   node --env-file=.env.local scripts/track-invite.mjs <slug> <resend-email-id> [sent-iso]
import { neon } from "@neondatabase/serverless"
const [slug, emailId, sentIso] = process.argv.slice(2)
if (!slug || !emailId) { console.error("usage: track-invite.mjs <slug> <resend-email-id> [sent-iso]"); process.exit(1) }
const sql = neon(process.env.DATABASE_URL)
const since = sentIso ?? new Date(Date.now() - 7 * 864e5).toISOString()

const em = await fetch(`https://api.resend.com/emails/${emailId}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } }).then((r) => r.json())
console.log(`EMAIL  ${em.last_event ?? "?"}  → ${(em.to ?? []).join(", ")}  (${em.created_at ?? ""})`)

const [biz] = await sql`SELECT b.id, b.name, b.owner_user_id, u.email AS owner_email, u.role, u.created_at AS owner_since
  FROM businesses b LEFT JOIN users u ON u.id = b.owner_user_id WHERE b.slug = ${slug}`
if (!biz) { console.error("no business", slug); process.exit(1) }
const claimed = biz.owner_email && !/lompocdeals|lompoc-locals|lompoclocals\.internal/.test(biz.owner_email)
console.log(`CLAIM  ${claimed ? `✓ claimed by ${biz.owner_email} (account since ${biz.owner_since?.toISOString?.().slice(0, 16) ?? biz.owner_since})` : "— not claimed yet"}`)

const views = await sql`SELECT count(*)::int AS n, min(created_at) AS first, max(created_at) AS last FROM analytics_events
  WHERE event_name = 'business_page_viewed' AND target_type = 'business' AND target_id = ${biz.id} AND created_at > ${since}`
console.log(`VIEWS  ${views[0].n} profile view(s) since send${views[0].n ? ` (first ${new Date(views[0].first).toISOString().slice(0, 16)}, last ${new Date(views[0].last).toISOString().slice(0, 16)})` : ""}`)

const claimsEv = await sql`SELECT event_name, created_at FROM analytics_events
  WHERE event_name IN ('business_claim_submitted','business_claim_approved','paid_upgrade') AND target_id = ${biz.id} AND created_at > ${since} ORDER BY created_at`
for (const e of claimsEv) console.log(`EVENT  ${e.event_name} @ ${new Date(e.created_at).toISOString().slice(0, 16)}`)

if (claimed) {
  const subs = await sql`SELECT tier, status, created_at FROM subscriptions WHERE user_id = ${biz.owner_user_id} ORDER BY created_at DESC LIMIT 1`.catch(() => [])
  console.log(`MEMBER ${subs[0] ? `${subs[0].tier} / ${subs[0].status} (since ${new Date(subs[0].created_at).toISOString().slice(0, 10)})` : "— no subscription row"}`)
  const logins = await sql`SELECT count(*)::int AS n, max(created_at) AS last FROM analytics_events WHERE user_id = ${biz.owner_user_id} AND created_at > ${since}`.catch(() => [{ n: 0 }])
  console.log(`ACTIVE ${logins[0].n} tracked action(s) by the owner since send${logins[0].last ? `, last ${new Date(logins[0].last).toISOString().slice(0, 16)}` : ""}`)
}
