# Newspaper Front-Page Digest Email — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the weekly digest email with a dense, bulletproof "newspaper front page" that renders all four content sections (events, deals, things-to-do, neighbors) from real DB content, and make it the email the live cron actually sends.

**Architecture:** Extract a **pure** `renderMasterDigestHtml(content, locale, opts)` function (unit-testable, no network) from the existing `sendMasterDigestEmail`, and rewrite its HTML as the approved newspaper layout. Add a pure `selectLead()` helper that chooses the front-page lead story. Then repoint the live cron and the admin test-send from the retired rotating-theme digest to the master content + newspaper sender.

**Tech Stack:** TypeScript, Next.js route handler, Drizzle (existing queries — no new queries), Resend, `node:assert` tests run via `tsx`.

## Global Constraints

- Email must be **table-based, inline-styled, single column, `max-width:620px`** — bulletproof across Gmail / Outlook / Apple Mail. No `<script>`, no external CSS, no webfonts.
- Typeface: **Georgia serif** (`font-family:Georgia,'Times New Roman',serif`) everywhere.
- Palette: newsprint cream `#f7f3ec`, ink `#1a1712`, brand purple `#650C75`, gold `#EFC618`, warm hairline `#d8cfc0`, muted `#7a6f60`.
- **Bilingual** by subscriber locale (`"en" | "es"`), matching existing digest conventions.
- All DB-sourced text fields (titles, names, locations, descriptions) rendered through the existing `escapeHtml()` in `lib/email.ts`.
- Absolute image URLs via the existing `absImg()`; site links via existing `siteUrl()`.
- The "full edition" CTA points to `/this-week` (the web edition, built in a later plan). Until that page exists it will 404 gracefully — acceptable; the page ships next.
- Empty sections (no items that week) are omitted entirely — no empty headers.
- Run a single test file with: `node --env-file=.env.local node_modules/.bin/tsx <file>` (matches repo convention; `.env.local` load is harmless for pure tests).

---

## File Structure

- **Modify** `lib/digest.ts` — add pure `selectLead()` + `DigestLead` type near `MasterDigestContent`.
- **Modify** `lib/email.ts` — add pure `renderMasterDigestHtml()`; rewrite `sendMasterDigestEmail` to be a thin wrapper that calls it.
- **Create** `lib/digest.test.ts` — tests for `selectLead()`.
- **Create** `lib/email.master-digest.test.ts` — tests for `renderMasterDigestHtml()` output.
- **Modify** `app/api/cron/digest/route.ts` — send the newspaper front page to all confirmed subscribers.
- **Modify** `lib/admin-comms-actions.ts` — admin test-send uses the newspaper front page.

The retired rotating-theme functions (`sendThemedDigestEmail`, `THEME_COPY`, `themedSectionHtml`, `digestThemeForDate`, `getThemedDigestContent`, `themedDigestHasContent`) are left in place as dead code for now — removing them is out of scope for this plan (avoids a large unrelated diff). A follow-up cleanup can delete them once the newspaper digest is confirmed live.

---

### Task 1: `selectLead()` — pick the front-page lead story

**Files:**
- Modify: `lib/digest.ts` (append after `getMasterDigestContent`, ~line 230)
- Test: `lib/digest.test.ts`

**Interfaces:**
- Consumes: `MasterDigestContent`, `DigestEvent`, `DealCardData` (already exported from `lib/digest.ts`).
- Produces:
  ```ts
  export type DigestLead =
    | { kind: "event"; event: DigestEvent }
    | { kind: "deal"; deal: DealCardData }
    | null
  export function selectLead(c: MasterDigestContent): DigestLead
  ```
  Rule: soonest event wins (events arrive soonest-first from `getDigestEvents`); else the top deal; else `null`. The renderer excludes the chosen lead item from its section list to avoid duplication.

- [ ] **Step 1: Write the failing test**

Create `lib/digest.test.ts`:

```ts
import assert from "node:assert/strict"
import { selectLead, type MasterDigestContent } from "./digest"

const ev = (id: number, title: string): MasterDigestContent["events"][number] => ({
  id, title, location: null, startsAt: new Date("2026-07-25T18:00:00Z"), imageUrl: null,
})
const deal = (id: number, title: string): MasterDigestContent["deals"][number] => ({
  id, type: "deal", title, description: null, imageUrl: null, discountText: null,
  terms: null, expiresAt: new Date("2026-08-01T00:00:00Z"), featured: false,
  business: { id: 1, name: "Biz", slug: "biz", logoUrl: null, coverUrl: null,
    categoryName: null, categorySlug: null, address: null, phone: null },
})
const base: MasterDigestContent = { events: [], deals: [], things: [], partners: [] }

// event present -> event lead
let lead = selectLead({ ...base, events: [ev(1, "Launch"), ev(2, "Market")], deals: [deal(9, "20% off")] })
assert.equal(lead?.kind, "event")
assert.equal(lead!.kind === "event" && lead.event.id, 1)

// no events, deals present -> deal lead
lead = selectLead({ ...base, deals: [deal(9, "20% off")] })
assert.equal(lead?.kind, "deal")
assert.equal(lead!.kind === "deal" && lead.deal.id, 9)

// nothing -> null
assert.equal(selectLead(base), null)

console.log("selectLead: all assertions passed")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/digest.test.ts`
Expected: FAIL — `selectLead` is not exported / not a function.

- [ ] **Step 3: Write minimal implementation**

Append to `lib/digest.ts`:

```ts
/** The front-page lead: soonest event, else top deal, else nothing. */
export type DigestLead =
  | { kind: "event"; event: DigestEvent }
  | { kind: "deal"; deal: DealCardData }
  | null

export function selectLead(c: MasterDigestContent): DigestLead {
  if (c.events.length > 0) return { kind: "event", event: c.events[0] }
  if (c.deals.length > 0) return { kind: "deal", deal: c.deals[0] }
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/digest.test.ts`
Expected: PASS — prints `selectLead: all assertions passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/digest.ts lib/digest.test.ts
git commit -m "feat: selectLead helper picks the digest front-page lead story"
```

---

### Task 2: `renderMasterDigestHtml()` — newspaper front-page layout

**Files:**
- Modify: `lib/email.ts` (replace the HTML body inside `sendMasterDigestEmail`, ~lines 764-828; add the new pure function above it)
- Test: `lib/email.master-digest.test.ts`

**Interfaces:**
- Consumes: `MasterDigestContent`, `selectLead`, `DigestLead` from `lib/digest.ts`; existing `escapeHtml`, `absImg`, `siteUrl` in `lib/email.ts`.
- Produces:
  ```ts
  export function renderMasterDigestHtml(
    c: MasterDigestContent,
    locale: "en" | "es",
    opts: { unsubUrl: string; now: Date }
  ): string
  ```
  `sendMasterDigestEmail(email, unsubscribeToken, c, locale)` keeps its exact signature and return type `Promise<{ ok: boolean; error?: string }>`; it now builds `unsubUrl`, calls `renderMasterDigestHtml`, and sends.

- [ ] **Step 1: Write the failing test**

Create `lib/email.master-digest.test.ts`:

```ts
import assert from "node:assert/strict"
import { renderMasterDigestHtml } from "./email"
import type { MasterDigestContent } from "./digest"

const NOW = new Date("2026-07-20T15:00:00Z")
const content: MasterDigestContent = {
  events: [
    { id: 5, title: "Falcon 9 Launch", location: "Vandenberg SFB",
      startsAt: new Date("2026-07-23T20:41:00Z"), imageUrl: "/img/launch.jpg" },
    { id: 6, title: "Flower Festival Parade", location: "Ocean Ave",
      startsAt: new Date("2026-07-25T17:00:00Z"), imageUrl: null },
  ],
  deals: [
    { id: 9, type: "deal", title: "Two-for-One Tri-Tip", description: "All week",
      imageUrl: null, discountText: "20% Off", terms: null,
      expiresAt: new Date("2026-08-01T00:00:00Z"), featured: false,
      business: { id: 1, name: "Big Jayke's", slug: "big-jaykes", logoUrl: null,
        coverUrl: null, categoryName: null, categorySlug: null, address: null, phone: null } },
  ],
  things: [
    { title: "Wine Tasting", href: "/activities/wine", imageUrl: "/img/wine.jpg", subtitle: "Wine" },
  ],
  partners: [
    { name: "One Plant", slug: "one-plant", coverUrl: "/img/op.jpg",
      categoryName: "Dispensary", dealTitle: null, discountText: null },
  ],
}
const opts = { unsubUrl: "https://x/unsub?token=abc", now: NOW }

const html = renderMasterDigestHtml(content, "en", opts)

// masthead + newspaper identity
assert.ok(html.includes("The Lompoc Locals"), "has nameplate")
assert.ok(html.includes("Vol. I"), "has volume line")
// lead is the soonest event
assert.ok(html.includes("Falcon 9 Launch"), "lead headline present")
assert.ok(html.includes("Lead Story") || html.includes("Lead"), "lead label present")
// lead event is NOT duplicated in the calendar list (appears exactly once)
assert.equal(html.split("Falcon 9 Launch").length - 1, 1, "lead not duplicated")
// section headers
assert.ok(html.includes("Calendar"), "events section")
assert.ok(html.includes("Deals of the Week"), "deals section")
assert.ok(html.includes("Two-for-One Tri-Tip"), "deal item")
assert.ok(html.includes("20% Off"), "discount chip")
assert.ok(html.includes("One Plant"), "neighbor item")
// full-edition CTA points at the web edition
assert.ok(html.includes("/this-week"), "links to web edition")
// unsubscribe wired
assert.ok(html.includes("https://x/unsub?token=abc"), "unsub link present")

// Spanish locale swaps labels
const htmlEs = renderMasterDigestHtml(content, "es", opts)
assert.ok(htmlEs.includes("Ofertas de la semana"), "es deals label")

// empty content -> still valid shell, no crash, omits empty sections
const empty: MasterDigestContent = { events: [], deals: [], things: [], partners: [] }
const htmlEmpty = renderMasterDigestHtml(empty, "en", opts)
assert.ok(htmlEmpty.includes("The Lompoc Locals"), "empty still renders masthead")
assert.ok(!htmlEmpty.includes("Deals of the Week"), "empty omits deals header")

console.log("renderMasterDigestHtml: all assertions passed")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/email.master-digest.test.ts`
Expected: FAIL — `renderMasterDigestHtml` is not exported.

- [ ] **Step 3: Write the implementation**

In `lib/email.ts`, update the import at the top (it currently imports `MasterDigestContent`) to also pull the lead helper:

```ts
import type { DigestEvent, ThemedDigestContent, MasterDigestContent } from "@/lib/digest"
import { selectLead } from "@/lib/digest"
```

Add the pure renderer just above `sendMasterDigestEmail` (keep the existing `absImg` helper):

```ts
/** Newspaper section kicker: rule — LABEL — rule. */
function npKicker(label: string): string {
  return `<div style="border-bottom:1px solid #650C75;margin:20px 0 8px;padding-bottom:4px;">
    <span style="color:#650C75;font-size:12px;font-weight:bold;letter-spacing:0.22em;text-transform:uppercase;">${label}</span>
  </div>`
}

/** Render the weekly digest as a dense newspaper front page. Pure — no network. */
export function renderMasterDigestHtml(
  c: MasterDigestContent,
  locale: "en" | "es",
  opts: { unsubUrl: string; now: Date }
): string {
  const es = locale === "es"
  const dateLabel = (d: Date) =>
    d.toLocaleDateString(es ? "es-US" : "en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Los_Angeles" })
  const shortDate = (d: Date) =>
    d.toLocaleDateString(es ? "es-US" : "en-US", { weekday: "short", day: "numeric", timeZone: "America/Los_Angeles" })
  // week-of-year -> cosmetic edition number
  const start = Date.UTC(opts.now.getUTCFullYear(), 0, 1)
  const weekNo = Math.ceil(((opts.now.getTime() - start) / 86400000 + 1) / 7)
  const fullDate = opts.now.toLocaleDateString(es ? "es-US" : "en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" })

  const lead = selectLead(c)
  // section lists with the lead item removed to avoid duplication
  const events = lead?.kind === "event" ? c.events.slice(1) : c.events
  const deals = lead?.kind === "deal" ? c.deals.slice(1) : c.deals

  // ── Lead story ──
  let leadHtml = ""
  if (lead?.kind === "event") {
    const e = lead.event
    leadHtml = `
    <table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;border-bottom:2px solid #1a1712;"><tr>
      <td width="58%" style="vertical-align:top;padding:0 12px 14px 0;">
        <div style="color:#650C75;font-size:10px;font-weight:bold;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:3px;">${es ? "Nota principal" : "Lead Story"}</div>
        <a href="${siteUrl(`/events/${e.id}`)}" style="display:block;font-size:25px;line-height:1.1;color:#1a1712;font-weight:bold;text-decoration:none;font-family:Georgia,serif;margin-bottom:5px;">${escapeHtml(e.title)}</a>
        <div style="font-size:12px;color:#7a6f60;font-style:italic;">${dateLabel(e.startsAt)}${e.location ? " · " + escapeHtml(e.location) : ""}</div>
      </td>
      ${absImg(e.imageUrl) ? `<td width="42%" style="vertical-align:top;padding-bottom:14px;"><img src="${absImg(e.imageUrl)}" alt="" width="100%" style="display:block;width:100%;height:150px;object-fit:cover;border:1px solid #d8cfc0;" /></td>` : ""}
    </tr></table>`
  } else if (lead?.kind === "deal") {
    const d = lead.deal
    const img = absImg(d.imageUrl ?? d.business.coverUrl)
    leadHtml = `
    <table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;border-bottom:2px solid #1a1712;"><tr>
      <td width="58%" style="vertical-align:top;padding:0 12px 14px 0;">
        <div style="color:#650C75;font-size:10px;font-weight:bold;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:3px;">${es ? "Oferta principal" : "Lead Story"}</div>
        ${d.discountText ? `<span style="display:inline-block;background:#EFC618;color:#3a2600;font-weight:bold;font-size:11px;padding:2px 8px;letter-spacing:0.03em;text-transform:uppercase;margin-bottom:5px;">${escapeHtml(d.discountText)}</span>` : ""}
        <a href="${siteUrl(`/biz/${d.business.slug}`)}" style="display:block;font-size:23px;line-height:1.12;color:#1a1712;font-weight:bold;text-decoration:none;font-family:Georgia,serif;margin-bottom:5px;">${escapeHtml(d.title)}</a>
        <div style="font-size:12px;color:#7a6f60;font-style:italic;">${escapeHtml(d.business.name)}</div>
      </td>
      ${img ? `<td width="42%" style="vertical-align:top;padding-bottom:14px;"><img src="${img}" alt="" width="100%" style="display:block;width:100%;height:150px;object-fit:cover;border:1px solid #d8cfc0;" /></td>` : ""}
    </tr></table>`
  }

  // ── Events ──
  const eventsHtml = events.length ? npKicker(es ? "📅 El calendario de la semana" : "📅 This Week's Calendar") +
    `<table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;">` +
    events.slice(0, 5).map((e, i, arr) => `
      <tr>
        <td width="16%" style="vertical-align:top;padding:7px 8px 7px 0;color:#650C75;font-size:11px;font-weight:bold;text-transform:uppercase;white-space:nowrap;${i < arr.length - 1 ? "border-bottom:1px solid #e3dbcd;" : ""}">${shortDate(e.startsAt)}</td>
        <td style="vertical-align:top;padding:7px 0;${i < arr.length - 1 ? "border-bottom:1px solid #e3dbcd;" : ""}">
          <a href="${siteUrl(`/events/${e.id}`)}" style="font-size:15px;font-weight:bold;color:#1a1712;text-decoration:none;">${escapeHtml(e.title)}</a>${e.location ? `<span style="font-size:12px;color:#7a6f60;font-style:italic;"> — ${escapeHtml(e.location)}</span>` : ""}
        </td>
      </tr>`).join("") + `</table>` : ""

  // ── Deals ──
  const dealsHtml = deals.length ? npKicker(es ? "🎟️ Ofertas de la semana" : "🎟️ Deals of the Week") +
    `<table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;">` +
    deals.slice(0, 4).map((d, i, arr) => `
      <tr><td style="vertical-align:top;padding:8px 0;${i < arr.length - 1 ? "border-bottom:1px solid #e3dbcd;" : ""}">
        ${d.discountText ? `<span style="display:inline-block;background:#EFC618;color:#3a2600;font-weight:bold;font-size:10px;padding:2px 7px;letter-spacing:0.03em;text-transform:uppercase;">${escapeHtml(d.discountText)}</span> ` : ""}<a href="${siteUrl(`/biz/${d.business.slug}`)}" style="font-size:15px;font-weight:bold;color:#1a1712;text-decoration:none;">${escapeHtml(d.title)}</a>
        <div style="font-size:12px;color:#7a6f60;">${escapeHtml(d.business.name)}</div>
      </td></tr>`).join("") + `</table>` : ""

  // ── Around Town + Neighbors (two columns) ──
  const thingsCol = c.things.length ? `
    <div style="border-bottom:1px solid #650C75;margin-bottom:8px;padding-bottom:4px;"><span style="color:#650C75;font-size:11px;font-weight:bold;letter-spacing:0.16em;text-transform:uppercase;">🌟 ${es ? "Qué hacer" : "Around Town"}</span></div>
    ${c.things.slice(0, 4).map((t, i, arr) => `<a href="${siteUrl(t.href)}" style="display:block;font-size:14px;font-weight:bold;color:#1a1712;text-decoration:none;padding:5px 0;${i < arr.length - 1 ? "border-bottom:1px solid #e3dbcd;" : ""}">${escapeHtml(t.title)}</a>`).join("")}` : ""
  const partnersCol = c.partners.length ? `
    <div style="border-bottom:1px solid #650C75;margin-bottom:8px;padding-bottom:4px;"><span style="color:#650C75;font-size:11px;font-weight:bold;letter-spacing:0.16em;text-transform:uppercase;">🤝 ${es ? "Vecinos" : "Neighbors"}</span></div>
    ${c.partners.slice(0, 4).map((p, i, arr) => `<a href="${siteUrl(`/biz/${p.slug}`)}" style="display:block;padding:5px 0;text-decoration:none;${i < arr.length - 1 ? "border-bottom:1px solid #e3dbcd;" : ""}"><span style="font-size:14px;font-weight:bold;color:#1a1712;">${escapeHtml(p.name)}</span>${p.categoryName ? `<span style="font-size:11px;color:#7a6f60;"> · ${escapeHtml(p.categoryName)}</span>` : ""}</a>`).join("")}` : ""
  const twoColHtml = (thingsCol || partnersCol) ? `
    <table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;margin-top:20px;"><tr>
      <td width="50%" style="vertical-align:top;padding-right:12px;${thingsCol && partnersCol ? "border-right:1px solid #d8cfc0;" : ""}">${thingsCol}</td>
      <td width="50%" style="vertical-align:top;padding-left:12px;">${partnersCol}</td>
    </tr></table>` : ""

  return `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:620px;margin:0 auto;background:#f7f3ec;">
      <div style="background:#650C75;padding:16px 22px 12px;text-align:center;">
        <div style="color:#ffffff;font-size:32px;font-weight:bold;margin:0;font-family:Georgia,'Times New Roman',serif;line-height:1;">The Lompoc Locals</div>
        <div style="height:2px;background:#EFC618;width:92%;margin:9px auto 7px;"></div>
        <div style="color:rgba(255,255,255,0.82);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;">${fullDate} &nbsp;·&nbsp; Vol. I, No. ${weekNo} &nbsp;·&nbsp; lompoclocals.com</div>
      </div>
      <div style="padding:18px 24px 22px;">
        ${leadHtml}${eventsHtml}${dealsHtml}${twoColHtml}
        <div style="text-align:center;margin:24px 0 2px;">
          <a href="${siteUrl("/this-week")}" style="display:inline-block;background:#650C75;color:#ffffff;padding:11px 26px;text-decoration:none;font-weight:bold;font-size:14px;font-family:Georgia,serif;">${es ? "Leer la edición completa" : "Read the full edition online"} →</a>
        </div>
      </div>
      <div style="background:#efe9df;border-top:2px solid #650C75;padding:14px 22px;text-align:center;">
        <p style="color:#8a8175;font-size:11px;line-height:1.6;margin:0;">
          ${es ? "Estás suscrito a Lompoc Locals" : "You subscribe to Lompoc Locals"} · <a href="${opts.unsubUrl}" style="color:#8a8175;">${es ? "Cancelar" : "Unsubscribe"}</a> · <a href="${siteUrl()}" style="color:#8a8175;">lompoclocals.com</a>
        </p>
      </div>
    </div>`
}
```

Now replace the body of `sendMasterDigestEmail` (the `const es = ...` through the `const html = ...` block) so it delegates to the renderer. The final function reads:

```ts
export async function sendMasterDigestEmail(
  email: string,
  unsubscribeToken: string,
  c: MasterDigestContent,
  locale: "en" | "es"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) return { ok: false, error: "Email service not configured" }

  const es = locale === "es"
  const unsubUrl = siteUrl(`/subscribe/unsubscribe?token=${unsubscribeToken}`)
  const html = renderMasterDigestHtml(c, locale, { unsubUrl, now: new Date() })
  const subject = es
    ? "📬 The Lompoc Locals — tu edición semanal"
    : "📬 The Lompoc Locals — your weekly front page"

  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject, html })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}
```

Delete the now-unused `magSection` and `magCard` helpers (they were only used by the old master body). Leave `absImg` (still used).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/email.master-digest.test.ts`
Expected: PASS — prints `renderMasterDigestHtml: all assertions passed`.

- [ ] **Step 5: Typecheck**

Run: `node_modules/.bin/tsc --noEmit`
Expected: no errors (confirms the removed `magSection`/`magCard` aren't referenced elsewhere).

- [ ] **Step 6: Commit**

```bash
git add lib/email.ts lib/email.master-digest.test.ts
git commit -m "feat: newspaper front-page digest renderer (pure, tested)"
```

---

### Task 3: Wire the newspaper front page into the live send path

**Files:**
- Modify: `app/api/cron/digest/route.ts`
- Modify: `lib/admin-comms-actions.ts:26-40` (`sendTestDigestAction`)

**Interfaces:**
- Consumes: `getMasterDigestContent()` from `lib/digest.ts`, `sendMasterDigestEmail()` from `lib/email.ts` (existing signature).
- Produces: no new exports; behavior change only. Cron JSON response gains no new required fields (drop the `theme` field).

- [ ] **Step 1: Rewrite the cron route**

Replace the full contents of `app/api/cron/digest/route.ts`:

```ts
import { NextResponse } from "next/server"
import { isNotNull } from "drizzle-orm"
import { db } from "@/db/client"
import { subscribers } from "@/db/schema"
import { sendMasterDigestEmail } from "@/lib/email"
import { getMasterDigestContent } from "@/lib/digest"

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const content = await getMasterDigestContent()
  const total = content.events.length + content.deals.length + content.things.length + content.partners.length
  if (total === 0) {
    return NextResponse.json({ sent: 0, skipped: "no content this week" })
  }

  const confirmedSubs = await db
    .select()
    .from(subscribers)
    .where(isNotNull(subscribers.confirmedAt))

  let sent = 0
  let failed = 0
  for (const sub of confirmedSubs) {
    const locale: "en" | "es" = sub.locale === "es" ? "es" : "en"
    const result = await sendMasterDigestEmail(sub.email, sub.unsubscribeToken, content, locale)
    if (result.ok) sent++
    else failed++
  }

  return NextResponse.json({ sent, failed, subscribers: confirmedSubs.length })
}
```

- [ ] **Step 2: Update the admin test-send**

In `lib/admin-comms-actions.ts`, change the imports (lines 7-8):

```ts
import { sendMasterDigestEmail, sendBroadcastEmail } from "@/lib/email"
import { getMasterDigestContent } from "@/lib/digest"
```

Replace `sendTestDigestAction` (lines ~25-40) with:

```ts
/** Email this week's newspaper front page to the signed-in admin so they can preview it. */
export async function sendTestDigestAction(): Promise<CommsResult> {
  const admin = await requireAdmin()
  const content = await getMasterDigestContent()
  const total = content.events.length + content.deals.length + content.things.length + content.partners.length
  if (total === 0) {
    return { ok: false, message: "No content for this week's edition yet." }
  }
  const result = await sendMasterDigestEmail(admin.email, "admin-test", content, "en")
  return result.ok
    ? { ok: true, message: `Test edition sent to ${admin.email}.` }
    : { ok: false, message: result.error ?? "Send failed." }
}
```

Verify the `admin` variable name and `requireAdmin`/`CommsResult` usage match the surrounding file (the original used `const admin = ...` and `admin.email`); adjust only if the existing helper names differ.

- [ ] **Step 3: Typecheck**

Run: `node_modules/.bin/tsc --noEmit`
Expected: no errors. (If `digestThemeForDate`/`getThemedDigestContent`/`themedDigestHasContent` imports are now unused in these two files, remove those import names to satisfy lint.)

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no new errors in `app/api/cron/digest/route.ts` or `lib/admin-comms-actions.ts`.

- [ ] **Step 5: Commit**

```bash
git add app/api/cron/digest/route.ts lib/admin-comms-actions.ts
git commit -m "feat: weekly digest cron + admin test send the newspaper front page"
```

---

### Task 4: Live verification (manual, no code)

**Files:** none.

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 2: Deploy**

Push to `main`; Vercel auto-builds. Then promote to production (this repo does not auto-promote): `vercel deploy --prod` (or via dashboard). See project memory "Vercel deploy gap".

- [ ] **Step 3: Send yourself the real thing**

From the admin comms hub, click the digest test-send. Open the email in **Gmail (mobile + web)** and **Apple Mail**. Confirm:
- Masthead + dateline render; Georgia serif; purple/gold on cream.
- Lead story shows the soonest event (or top deal) with its photo, not duplicated below.
- Calendar / Deals / Around Town / Neighbors render from real content; empty sections are absent.
- "Read the full edition online" links to `/this-week` (will 404 until the web-edition plan ships — expected).
- Spanish subscriber locale renders Spanish labels.

- [ ] **Step 4: Report** what rendered correctly and anything off, before starting the web-edition plan.

---

## Self-Review

**Spec coverage:**
- Newspaper email replaces master digest → Tasks 1-2. ✅
- Dense layout / minimal scroll (compact masthead, side-by-side lead, text briefs, two-col Around-Town/Neighbors) → Task 2 renderer matches the approved mockup. ✅
- Lead = soonest event else top deal → Task 1 `selectLead` + Task 2 lead render, with de-duplication. ✅
- Light emoji in section labels → Task 2. ✅
- Bilingual → Task 2 (`es` branches) + test. ✅
- Empty sections omitted → Task 2 + test. ✅
- Becomes the actual weekly send (retire rotating theme) → Task 3 (cron + admin). ✅
- CTA → `/this-week` → Task 2 + test. ✅
- Web edition page → **out of scope for this plan** (separate plan, per approved build order: email first). Noted, not a gap.

**Placeholder scan:** No TBD/TODO; every code step shows full code. ✅

**Type consistency:** `selectLead`/`DigestLead` defined in Task 1 and consumed in Task 2 with matching shape; `renderMasterDigestHtml` signature identical in Task 2 definition, test, and `sendMasterDigestEmail` caller; `getMasterDigestContent`/`sendMasterDigestEmail` used in Task 3 with existing signatures. ✅

## Next plan

After this ships and you've eyeballed the real email: a second plan for the **interactive web edition at `/this-week`** (swipeable galleries, mobile-first, big/legible for all ages), reusing `getMasterDigestContent()`.
