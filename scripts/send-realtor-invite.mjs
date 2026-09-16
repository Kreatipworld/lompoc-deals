#!/usr/bin/env node
// send-realtor-invite.mjs — the Plus invitation for a realtor lead, branded, from hello@.
//
//   node --env-file=.env.local scripts/send-realtor-invite.mjs --to lead@example.com --name Ben --proof   # proof to hello@ only
//   node --env-file=.env.local scripts/send-realtor-invite.mjs --to lead@example.com --name Ben           # the real send
//   node --env-file=.env.local scripts/send-realtor-invite.mjs --list scripts/data/realtor-leads.csv --proof   # proof of the FIRST unsent lead
//   node --env-file=.env.local scripts/send-realtor-invite.mjs --list scripts/data/realtor-leads.csv           # send to every unsent lead (max 20/run, 3 s apart)
//   add --followup for the 3-day follow-up (only to leads already invited ≥3 days ago, never twice)
//
// The CSV is `email,name` (header line, one lead per line). The log is the memory: an address
// that already got the invite (or the follow-up) is never sent it again.
//
// Rules: never the owner's name (signed "The Lompoc Locals team"), one CTA (lompoclocals.com/realtors),
// Plus $99.99/mo cancel anytime, never "free", no comparisons to other agents. Every send is logged.
import { Resend } from "resend"
import { readFileSync, writeFileSync, existsSync } from "node:fs"

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith("--") ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true] : [])).filter((x) => x.length))
const TO = String(args.to || "")
const NAME = args.name && args.name !== true ? String(args.name) : ""
const PROOF = !!args.proof
if (!TO.includes("@") && !(args.list && args.list !== true)) { console.error("usage: --to <email> [--name First] [--proof]  |  --list leads.csv [--followup] [--proof]"); process.exit(1) }

const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const HELLO = "hello@lompoclocals.com"
const P = "#650C75"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const LINK = "https://www.lompoclocals.com/realtors?utm_source=email&utm_medium=invite&utm_campaign=realtors"
const LOG = "scripts/data/realtor-invites-log.json"

const FOLLOWUP = !!args.followup
const LIST = args.list && args.list !== true ? String(args.list) : ""
const log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, "utf8")) : []
const sentTo = (email, kind) => log.some((x) => !x.proof && x.kind === kind && x.lead.toLowerCase() === email.toLowerCase())
const lastInvite = (email) => log.filter((x) => !x.proof && x.kind === "invite" && x.lead.toLowerCase() === email.toLowerCase()).map((x) => new Date(x.at).getTime()).sort().pop()

function build(name) {
  const hi = name ? `Hi ${name}` : "Hi there"
  if (FOLLOWUP) {
    const subject = "Quick one: homes on Lompoc's map"
    const text = `${hi},

Quick one from Lompoc Locals. Homes on our map show as green pins next to the restaurants, shops and services neighbors browse every day, so a buyer looking for a taco place sees your open house too.

Five minutes to be on it, $99.99 a month, cancel anytime:
${LINK}

Happy to answer anything, just reply.

The Lompoc Locals team
${HELLO}`
    const html = shell(`<h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Quick one: homes on Lompoc's map.</h1>
      <div style="height:3px; width:52px; background:#EFC618; border-radius:2px; margin:0 0 18px;"></div>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">${hi} &mdash; quick one from <strong>Lompoc Locals</strong>. Homes on our map show as green pins next to the restaurants, shops and services neighbors browse every day, so a buyer looking for a taco place sees your open house too.</p>
      <p style="color:#444; line-height:1.6; margin:0 0 18px;">Five minutes to be on it, <strong>$99.99</strong> a month, cancel anytime.</p>
      <p style="margin:0 0 22px;"><a href="${LINK}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">See the homes page for realtors</a></p>
      <p style="color:#444; line-height:1.6; margin:0 0 4px;">Happy to answer anything &mdash; just reply.</p>`)
    return { subject, text, html }
  }
  const subject = "Lompoc's homes market is open. Your listings belong on it."
  const text = `${hi},

This is Lompoc Locals, the town's own directory, map, deals and news. We just opened something new for realtors: Lompoc's own homes map, the one neighbors already use every day to find dinner, a plumber or a weekend plan.

We'd love to have your listings on it. Every home you add goes on that map, gets a "Request a tour" button that sends the lead straight to your inbox, and goes into the videos and the Monday email we send the town.

It's a Plus membership, $99.99 a month, cancel anytime, and it takes about five minutes to be live. Everything is on this page:
${LINK}

Any question at all, just reply. A real person on the team answers.

The Lompoc Locals team
${HELLO}`
  const html = shell(`<h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Lompoc's homes market is open.</h1>
      <div style="height:3px; width:52px; background:#EFC618; border-radius:2px; margin:0 0 18px;"></div>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">${hi} &mdash; this is <strong>Lompoc Locals</strong>, the town's own directory, map, deals and news. We just opened something new for realtors: Lompoc's own homes map, the one neighbors already use every day to find dinner, a plumber or a weekend plan.</p>
      <p style="color:#444; line-height:1.6; margin:0 0 18px;">We'd love to have your listings on it. Every home you add goes on that map, gets a <strong>Request a tour</strong> button that sends the lead straight to your inbox, and goes into the videos and the Monday email we send the town.</p>
      <div style="background:#F7F3E9; border:1px solid #E9DFC2; border-radius:12px; padding:20px 22px; margin:0 0 22px;">
        <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 8px;">Plus membership for realtors</div>
        <p style="color:#1a1a1a; line-height:1.6; margin:0 0 12px; font-size:14px;"><strong style="font-size:19px; color:${P};">$99.99</strong>/month, cancel anytime. Card on file, brokerage profile, first home &mdash; about five minutes to be live.</p>
        <p style="margin:0;"><a href="${LINK}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">See how it works &amp; join Plus</a></p>
      </div>
      <p style="color:#444; line-height:1.6; margin:0 0 4px;">Any question at all, just reply &mdash; a real person on the team answers.</p>`)
  return { subject, text, html }
}

function shell(inner) {
  return `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
    <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
      <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
    </div>
    <div style="height:6px; background:linear-gradient(90deg,#EFC618 0%,#0B992F 55%,${P} 100%);"></div>
    <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
      ${inner}
      <p style="color:#444; line-height:1.6; margin:16px 0 0;">The Lompoc Locals team<br><a href="mailto:${HELLO}" style="color:${P};">${HELLO}</a></p>
    </div>
  </div>`
}

// Leads: one --to, or a CSV list (email,name).
let leads = []
if (LIST) {
  const lines = readFileSync(LIST, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.toLowerCase().startsWith("email"))
  leads = lines.map((l) => { const [email, ...rest] = l.split(","); return { email: email.trim(), name: rest.join(",").trim() } }).filter((x) => x.email.includes("@"))
} else {
  leads = [{ email: TO, name: NAME }]
}
const kind = FOLLOWUP ? "followup" : "invite"
const DAY = 86_400_000
const due = leads.filter((l) => {
  if (sentTo(l.email, kind)) return false
  if (FOLLOWUP) { const t = lastInvite(l.email); return !!t && Date.now() - t >= 3 * DAY }
  return true
})
if (due.length === 0) { console.log(`nothing to send: every lead already got the ${kind} (or the follow-up is not due yet)`); process.exit(0) }
if (PROOF) due.splice(1)
due.splice(20)

const resend = new Resend(process.env.RESEND_API_KEY)
for (const [i, lead] of due.entries()) {
  const { subject, text, html } = build(lead.name)
  const to = PROOF ? HELLO : lead.email
  const { data, error } = await resend.emails.send({ from: FROM, to, replyTo: HELLO, subject: PROOF ? `[PROOF → ${lead.email}] ${subject}` : subject, text, html })
  if (error) { console.error(`send failed for ${lead.email}:`, error); continue }
  console.log(`${PROOF ? "PROOF" : "SENT"} ${kind} to ${to}${PROOF ? ` (lead ${lead.email})` : ""} · id ${data.id}`)
  log.push({ at: new Date().toISOString(), to, lead: lead.email, name: lead.name, kind, proof: PROOF, id: data.id, subject })
  writeFileSync(LOG, JSON.stringify(log, null, 1))
  if (i < due.length - 1) await new Promise((r) => setTimeout(r, 3000))
}
