#!/usr/bin/env node
// "We covered you" emails for organizations named in our /news stories — the loop in
// docs/marketing/news-backlink-outreach.md. One short branded email, one link, one ask
// (a link from their news/partners page, or a share). Signed "The Lompoc Locals team".
// Drafts go to Orchestra (hello@) and only send when Andres taps Approve on Telegram.
//
//   node --env-file=.env.local scripts/outreach/news-link-drafts.mjs            # dry run → HTML previews
//   DRAFT=1 node --env-file=.env.local scripts/outreach/news-link-drafts.mjs    # create Orchestra drafts
//   ONLY=179,158 ...                                                            # subset by blog post id
//
// No story photo in the email: covers are often venue/topic photos, not the org's own (photo attribution rule).
// Targets: only addresses published on the organization's own site (verified), never guessed.
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync } from "node:fs"
import crypto from "node:crypto"
import { execFileSync } from "node:child_process"
import { neon } from "@neondatabase/serverless"

const P = "#650C75", G = "#0B992F", Y = "#EFC618"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const POSTAL = "Lompoc Locals · PO Box 880, Lompoc, CA 93438"
const SITE = "https://www.lompoclocals.com"
const LOG = new URL("../../docs/marketing/news-link-log.csv", import.meta.url).pathname
const OUT = process.env.OUT || "/tmp/news-link-previews"

// postId → who we covered and where a link could live. Fill `to` only with a verified address.
const TARGETS = JSON.parse(readFileSync(new URL("./news-link-targets.json", import.meta.url), "utf8"))

const secret = process.env.AUTH_SECRET
if (!secret || !process.env.DATABASE_URL) { console.error("needs --env-file=.env.local (AUTH_SECRET, DATABASE_URL)"); process.exit(1) }
const unsubUrl = (email) => {
  const t = crypto.createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("base64url").slice(0, 24)
  return `${SITE}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${t}`
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

function render({ org, to, linkPlace }, post) {
  const url = `${SITE}/blog/${post.slug}`
  const subject = `We covered ${org} on Lompoc Locals`
  const ask = linkPlace
    ? `If it's useful, a link to the story from your ${linkPlace} &mdash; or a share &mdash; helps more neighbors find it.`
    : `If it's useful, a link to the story from your website &mdash; or a share &mdash; helps more neighbors find it.`
  const html = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
  <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
    <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
  </div>
  <div style="height:6px; background:linear-gradient(90deg,${Y} 0%,${G} 55%,${P} 100%);"></div>
  <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
    <h1 style="font-size:22px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">We wrote about ${esc(org)}.</h1>
    <div style="height:3px; width:52px; background:${Y}; border-radius:2px; margin:0 0 18px;"></div>
    <p style="color:#444; line-height:1.6; margin:0 0 18px;">Hi &mdash; we published a short story on <strong>Lompoc Locals</strong>, the town's local news and business hub. It credits ${esc(org)} and links to the original reporting.</p>
    <a href="${url}" style="display:block; text-decoration:none; color:inherit; border:1px solid #E9DFC2; border-radius:12px; overflow:hidden; margin:0 0 20px;">
      <div style="background:#F7F3E9; padding:14px 16px;">
        <div style="font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 6px;">Lompoc News</div>
        <div style="font-size:16px; font-weight:700; color:#1a1a1a; line-height:1.35;">${esc(post.title)}</div>
      </div>
    </a>
    <p style="color:#444; line-height:1.6; margin:0 0 20px;">${ask}</p>
    <p style="margin:0 0 20px;"><a href="${url}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Read the story</a></p>
    <p style="color:#444; line-height:1.6; margin:0 0 6px;">Anything we should correct or add? Just reply. Thank you for what you do in Lompoc.</p>
    <p style="color:#888; margin:16px 0 0;">&mdash; The Lompoc Locals team · hello@lompoclocals.com</p>
    <div style="margin-top:26px; padding-top:18px; border-top:1px solid #eee; text-align:center;">
      <div style="margin-bottom:8px;"><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${P}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${Y}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${G}; margin:0 3px;"></span></div>
      <div style="font-size:14px; font-weight:700; color:${P};">lompoclocals.com</div>
      <div style="font-size:12px; color:#999; margin-top:2px;">community &amp; communication for Lompoc, California</div>
      <div style="font-size:11px; color:#aaa; margin-top:12px; line-height:1.5;">You're getting this because ${esc(org)} appears in a Lompoc Locals story. <a href="${unsubUrl(to)}" style="color:#aaa; text-decoration:underline;">Unsubscribe</a> &mdash; or reply &ldquo;unsubscribe&rdquo;.<br>${POSTAL}</div>
    </div>
  </div>
</div>`
  const text = [
    `We wrote about ${org}.`,
    ``,
    `Hi — we published a short story on Lompoc Locals, the town's local news and business hub. It credits ${org} and links to the original reporting:`,
    ``,
    `${post.title}`,
    url,
    ``,
    `${linkPlace ? `If it's useful, a link to the story from your ${linkPlace}` : `If it's useful, a link to the story from your website`} — or a share — helps more neighbors find it.`,
    ``,
    `Anything we should correct or add? Just reply. Thank you for what you do in Lompoc.`,
    ``,
    `— The Lompoc Locals team · hello@lompoclocals.com`,
    ``,
    `Unsubscribe: ${unsubUrl(to)} · ${POSTAL}`,
  ].join("\n")
  return { subject, html, text, url }
}

function orchestraDraft({ to, subject, text, html }) {
  const py = `import sys,json;sys.path.insert(0,"/Users/kreatip/Projects/Orchestra/scripts");import matrixlib as M;d=json.load(sys.stdin);print(json.dumps(M.orchestra("POST","/api/bot/drafts",d)))`
  const body = JSON.stringify({ account: "hello@lompoclocals.com", venture: "lompoc-locals", topic: "announcement", to_email: to, subject, body_text: text, body_html: html, source_bot: "lompoc-locals-lead" })
  return JSON.parse(execFileSync("python3", ["-c", py], { input: body, encoding: "utf8" }).trim().split("\n").pop())
}

const sql = neon(process.env.DATABASE_URL)
const only = process.env.ONLY ? process.env.ONLY.split(",").map(Number) : null
const ids = Object.keys(TARGETS).map(Number).filter((id) => !only || only.includes(id))
const posts = await sql`select id, slug, title, image_url, status from blog_posts where id = any(${ids})`
mkdirSync(OUT, { recursive: true })
if (!existsSync(LOG)) writeFileSync(LOG, "date,post_id,org,to,draft_id,status,link_live\n")

for (const id of ids) {
  const post = posts.find((p) => p.id === id)
  for (const tgt of [].concat(TARGETS[id])) {
    if (!post || post.status !== "published") { console.log(`skip ${id}: post not published`); continue }
    if (!tgt.to) { console.log(`skip ${id} ${tgt.org}: no verified address`); continue }
    const mail = render(tgt, post)
    const file = `${OUT}/${id}-${tgt.org.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.html`
    writeFileSync(file, mail.html)
    if (process.env.DRAFT !== "1") { console.log(`dry  ${id} → ${tgt.to} | ${mail.subject} | ${file}`); continue }
    const r = orchestraDraft({ to: tgt.to, ...mail })
    const res = Array.isArray(r) ? r[1] : r  // matrixlib returns [status, body]
    const draftId = res?.id ?? res?.draft?.id ?? "?"
    appendFileSync(LOG, `${new Date().toISOString().slice(0, 10)},${id},"${tgt.org}",${tgt.to},${draftId},awaiting approval,\n`)
    console.log(`draft #${draftId} ${id} → ${tgt.to} | ${mail.subject}`)
  }
}
