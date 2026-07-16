# Weekly Local Newsletter — Design Spec

**Date:** 2026-06-26
**Status:** Approved (brainstorming), pending spec review

## Problem

Lompoc Locals already has a weekly email system — a cron (`app/api/cron/digest/route.ts`) that emails the **top 10 deals from the past 7 days** to confirmed subscribers, with a complete double-opt-in flow (`subscribe` / `confirm` / `unsubscribe`) and Resend wiring in `lib/email.ts`.

Three gaps stop it from building an engaged audience:

1. **Deals-only.** No business spotlights, no editorial voice, no local info — even though the app has `blog_posts`, `events`, and `business` data that never reach the inbox.
2. **Goes silent on quiet weeks.** It sends nothing when there are no new deals in the last 7 days, so on a young platform the email frequently never goes out and readers never form a weekly habit.
3. **No voice.** A generic auto-list doesn't create the "this is my town's newsletter" feeling that earns opens and loyalty.

## Goal

Turn the bare deals email into a real **weekly local newsletter** — a featured business spotlight, this week's deals, new businesses, upcoming events, a story teaser, and a hand-written intro — assembled into an editable draft the owner reviews and sends. The aim is an engaged, growing email following.

## Decisions (from brainstorming)

- **Workflow: draft → edit → send (hybrid).** A weekly cron auto-builds a draft and emails the owner; the owner edits it in an admin page (adds their intro/story, swaps/reorders content), previews, sends a test, then sends to all subscribers. Reliable *and* keeps a human voice.
- **Sections:** (1) hand-written intro/story, (2) featured business spotlight, (3) this week's deals, (4) new businesses this week, (5) upcoming local events, (6) featured blog story teaser. *(Garage-sale/neighborhood feed intentionally excluded.)*
- **Featured business: Premium-first, auto-suggested, swappable.** The draft suggests a Premium/paying business not spotlighted recently; the owner can swap to anyone. Makes the spotlight a sellable Premium perk while keeping editorial control.
- **Persisted issues.** Each weekly edition is a saved, editable, re-viewable row with history — not assembled live at send time.

## Architecture

Three separable units plus the admin UI and cron:

- **`lib/newsletter.ts`** — content assembly (selection rules) + `renderNewsletterHtml(issue)`. Pure/testable; no Resend, no request context.
- **`lib/email.ts`** — add `sendNewsletterEmail(to, unsubscribeToken, subject, html)`, reusing the existing Resend client, `FROM_ADDRESS`, `siteUrl`, and `escapeHtml`.
- **`app/api/cron/newsletter-draft/route.ts`** — weekly draft-generation cron (auth via `CRON_SECRET`).
- **`app/[locale]/admin/newsletter/page.tsx`** (list) + **`app/[locale]/admin/newsletter/[id]/page.tsx`** (editor) + server actions for save/test/send. Gated to `admin` via the existing admin layout.
- **`db/schema.ts`** + migration — the `newsletter_issues` table.

### Data model — `newsletter_issues`

| Field | Type | Purpose |
|---|---|---|
| `id` | serial PK | identity |
| `status` | text `draft` \| `sent` | lifecycle |
| `subject` | varchar(300) | email subject (default `"This week in Lompoc 🌸"`, editable) |
| `introHtml` | text | owner's intro/story (markdown source rendered to HTML) |
| `introMarkdown` | text | raw markdown the editor saves/edits |
| `featuredBusinessId` | integer → businesses.id (set null) | the spotlight pick |
| `contentJson` | jsonb | snapshot of chosen content + section toggles (see below) |
| `recipientCount` | integer | confirmed-subscriber count at send time |
| `sentByUserId` | integer → users.id (set null) | who sent it |
| `sentAt` | timestamptz null | when it went out |
| `createdAt` | timestamptz default now | when the draft was created |

`contentJson` shape:
```json
{
  "deals": { "on": true, "ids": [12, 7, 30] },
  "newBusinesses": { "on": true, "ids": [402, 410] },
  "events": { "on": true, "ids": [88] },
  "blogPost": { "on": true, "id": 15 },
  "featured": { "on": true }
}
```
Snapshotting IDs makes preview and send render identically and keeps sent history accurate as deals later expire. Featured-business rotation is derived by reading prior issues' `featuredBusinessId` — no separate table.

Migration applied via the project's working mechanism (`drizzle-kit generate` for the SQL; apply through the HTTP client / `db:push`, since `drizzle-kit migrate` hangs on the Neon HTTP driver — consistent with how the `email` columns were added in migration 0020).

## Draft generation rules (`lib/newsletter.ts`)

**When:** weekly cron (default **Monday ~07:00 PT**). Idempotent — if a `draft` already exists for the current ISO week, it does nothing. On creation it emails the owner a "draft ready" link. The owner may also create a draft manually ("New draft").

**Per-section selection:**

- **Featured business:** approved businesses with `effectiveTier === 'premium'` (via `lib/tier.ts`), excluding any used as `featuredBusinessId` in the last 8 issues; prefer ones with a logo/photos and an active deal; pick the least-recently/never-featured. **Fallback** (never empty): any approved business with photos + an active deal, not recently featured.
- **This week's deals:** active (not expired, not paused), approved business, `createdAt` within 7 days; Premium/featured first, then newest; cap 8. **Top-up:** if fewer than 4, fill with other currently-active deals (newest first) up to the cap. *(Fixes the silent-week gap.)*
- **New businesses:** approved, `createdAt` within 14 days, **excluding records owned by the scraper/seed system users** (`scraper@lompocdeals.system`, `seedowner@lompocdeals.internal`) so it means real new merchants; cap 5; section auto-hides if empty.
- **Upcoming events:** from `events`, starting within the next 14 days, soonest first, cap 4; auto-hides if empty.
- **Featured story:** most recent published `blog_posts` not used in a recent issue; title + excerpt + "Read more" link; auto-hides if none.

**Cross-section rules:**
1. **Auto-hide empties** — a section renders only if it has content (no "none" placeholders).
2. **Never-empty issue** — intro + featured business + topped-up deals guarantee substance every week.

## Admin editor + send flow

**`/admin/newsletter`** — issues list: drafts first, then sent history (subject · date · recipients · status). "New draft" button. Click a draft to edit; a sent issue opens read-only.

**`/admin/newsletter/[id]`** — editor; controls on the left, live email preview on the right:

| Control | Behavior |
|---|---|
| Subject | text field, pre-filled default |
| Intro / story | markdown textarea (bold, links, paragraphs) — no WYSIWYG (YAGNI) |
| ★ Featured business | shows pick (logo + name); "Swap" opens a searchable approved-business picker |
| 🎟 Deals | selected deals with remove + reorder (up/down); "Add deal" picker; section on/off |
| ✨ New businesses / 📅 Events / 📖 Story | same pattern — remove items, toggle section off |

Edits persist to `contentJson` / `introMarkdown` (explicit Save).

**Three send controls:**
1. **Preview** — renders the email exactly as subscribers see it.
2. **Send test to me** — sends the real email to the admin's address only.
3. **Send to all subscribers** — confirms with the live count ("Send to N confirmed subscribers?"), then sends. Disabled until subject + intro exist.

**On send:** re-render once from the snapshot, fetch confirmed subscribers (`confirmedAt` not null), send via Resend with a small concurrency pool, tally sent/failed, write `status='sent'`, `sentAt`, `recipientCount`, `sentByUserId`. A guard refuses to send an issue already `sent`.

## Cron change

The weekly cron now **generates a draft and emails the owner** — it does **not** auto-send. The existing `app/api/cron/digest/route.ts` auto-send is **retired** (otherwise subscribers receive two emails); its schedule is repointed to `newsletter-draft`. `CRON_SECRET` bearer auth is preserved. The schedule config (Vercel cron / `vercel.json`) is updated accordingly.

## i18n

The subscribers table has no locale column (today's digest hard-codes `"en"`). This spec keeps the newsletter **English-only for v1** to match current behavior; a per-subscriber locale + Spanish rendering is out of scope (noted below).

## Testing

- **Unit (`lib/newsletter.test.ts`, `tsx` + `node:assert/strict`):** featured rotation excludes the last 8 picks and falls back when no Premium; deals top-up fires when <4 new; new-businesses excludes scraper/seed-owned; each section auto-hides when empty; never-empty guarantee holds; markdown→HTML intro renders and escapes business/deal text.
- **DB smoke:** run draft generation against the dev DB → asserts one `draft` issue row created with populated `contentJson`; re-running the same week creates no duplicate.
- **Manual:** create draft → edit intro + swap featured → Preview → "Send test to me" → verify inbox → send to a test subscriber → confirm re-send is blocked and history shows the sent issue.

## Out of scope (YAGNI)

- Spanish/per-subscriber-locale rendering (English-only v1).
- Scheduled/future send (manual "Send now" only for v1).
- Open/click tracking and analytics dashboards.
- WYSIWYG editor, drag-and-drop layout, custom templates per issue.
- Subscriber-growth UI changes (signup capture, lead magnets) — separate effort; this reuses the existing subscribe flow.
- Garage-sale / neighborhood-feed section.

## Files touched

- Create `lib/newsletter.ts`, `lib/newsletter.test.ts`.
- Modify `lib/email.ts` (add `sendNewsletterEmail`).
- Create `app/api/cron/newsletter-draft/route.ts`; retire/repoint `app/api/cron/digest/route.ts`.
- Create `app/[locale]/admin/newsletter/page.tsx`, `app/[locale]/admin/newsletter/[id]/page.tsx`, and admin server actions.
- Modify `db/schema.ts` + add a migration for `newsletter_issues`.
- Update cron schedule config (Vercel cron / `vercel.json`).
- Add i18n strings for the admin newsletter UI (`messages/en.json`; admin UI is English-facing, but follow the existing pattern).
