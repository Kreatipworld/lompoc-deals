# Project state — cross-machine handoff

The committed source of truth so **any** computer (any account) can `git pull` and pick up
where things stand. No secrets live here — see "Getting a new machine online" below.

_Last updated: 2026-07-30._

---

## How sync works across computers / accounts

Claude Code sessions do **not** sync between machines or accounts — that's expected. The
*work* syncs through shared layers, and it's fully bidirectional:

- **Git** — code, `CLAUDE.md`, and this `docs/` tree. Both machines `pull` and `push`;
  changes flow both ways.
- **Shared cloud services** — Neon (Postgres), Resend (email), Stripe, Vercel Blob. These
  are a single live source: a change from either machine is seen by both immediately.
- **This file** — the human-readable state so a fresh session (any account) is caught up.

### Getting a new machine online
1. `git clone` this repo (or `git pull`).
2. Recreate `.env.local` (gitignored — share it securely, never commit). Needs:
   `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`,
   `REVALIDATE_SECRET`, `CRON_SECRET`, plus Stripe keys.
3. `npm install`, then you can run the scripts below and deploy with `vercel deploy --prod --yes`.

---

## Active initiative: business claim-outreach campaign

Inviting unclaimed Lompoc business listings to claim their page (free) and try Growth
($39.99/mo, 14-day free trial). Branded email: cream header + full-color logo, free-claim
section, boxed Growth pitch (per-category deal example + the business's real 30-day view
count), partner-guide invitation. Sent from & reply-to **hello@lompoclocals.com**.

### Progress
- **Individually contacted:** Alfie's Fish & Chips (Mike) and Eye on I.
- **Hand-picked Wave 1 (12):** LAUNCHpad, In&Out Tires, One Plant, Tacos El Culichi,
  Wm Rieck, Elevate, Babcock, Fatte's, Brewer-Clifton, Flying Goat, Altered Aesthetics, Lemos — **sent.**
- **Campaign Wave 1 (top 30 by traffic):** **sent.**
- **Campaign Waves 2 & 3 (60 remaining):** **PAUSED** until deliverability is buttoned up (below).

### Tooling (`scripts/`)
- `send-claim-campaign.mjs` — the campaign engine. Queries the live DB for reachable
  unclaimed+approved listings, auto-cleans (drops corporate/PR/vendor/gov/nonprofit inboxes,
  malformed addrs, duplicate inboxes, already-sent), dedupes, personalizes per category,
  throttles ~0.7s. Honors the DB suppression list + a `scripts/data/` sent-log (drift-proof).
  - Dry run: `node scripts/send-claim-campaign.mjs`
  - Resume next wave: `SEND=1 LIMIT=30 node scripts/send-claim-campaign.mjs`
  - Send all remaining: `SEND=1 node scripts/send-claim-campaign.mjs`
- `send-claim-email.mjs` (Alfie's/Mike one-off), `send-invite-eyeoni.mjs` (Eye on I welcome),
  `send-claim-batch.mjs` (superseded hardcoded Wave-1).
- `scripts/data/` is **gitignored** (holds contact-email logs): `campaign-sent.log`
  (already-emailed), `unsubscribed.log` (file-fallback opt-outs). These are machine-local —
  the authoritative opt-out list is the DB table below.

---

## Deliverability / anti-spam

Resend domain `lompoclocals.com` is verified — **DKIM ✅, SPF ✅** (via `send.` subdomain;
DKIM `d=lompoclocals.com` aligns, so DMARC will pass).

### One-click unsubscribe system (built + live)
- `email_suppressions` table (Drizzle in `db/schema.ts`, live in Neon).
- `app/api/unsubscribe/route.ts` — `POST` = RFC 8058 one-click; `GET` = footer link →
  branded confirmation page. Address signed with an HMAC(`AUTH_SECRET`) token so links can't
  opt out arbitrary addresses. Campaign sends `List-Unsubscribe` + `List-Unsubscribe-Post`
  headers and a footer Unsubscribe link, and excludes every suppressed address forever.

### Open to-dos before resuming Waves 2 & 3
1. **Add DMARC** at GoDaddy DNS: TXT record, host `_dmarc`, value
   `v=DMARC1; p=none; rua=mailto:hello@lompoclocals.com; fo=1` (start `p=none`; tighten to
   `quarantine` after a clean week).
2. **Real postal address** for the CAN-SPAM footer — replace the `POSTAL` placeholder in
   `send-claim-campaign.mjs` with a real street/PO box.
