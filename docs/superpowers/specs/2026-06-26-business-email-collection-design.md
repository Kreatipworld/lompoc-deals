# Business Contact Email Collection — Design Spec

**Date:** 2026-06-26
**Branch:** `feat/business-email-outreach` off `main`

## Goal

Collect a **public business contact email** for each business already in our directory, so we can run compliant B2B outreach (e.g. "claim your free listing" / "join the Lompoc activation day"). The email is harvested from each business's **own public website**, stored on the business row with provenance, and exportable to CSV for a compliant sender.

This is **collection only** — this build sends no email. See the activation-day playbook (`docs/marketing/activation-day-playbook.md`) for how the list is used.

## Scope & compliance (binding)

- **Target = businesses in our directory, not "all of Lompoc."** ~419 approved businesses; 330 have a `website`.
- **Source = the business's own public website only** (homepage + a couple of likely contact paths). No third-party directories, no personal/consumer harvesting.
- **Provenance stored** for every address: source + scraped timestamp, so any email can be traced to where it came from.
- **Polite crawling:** identifying User-Agent, per-request timeout, low concurrency, a short delay between hosts, skip on fetch error. Best-effort `robots.txt` check for the fetched path; skip disallowed paths.
- **No sending in this build.** Any future outreach must carry CAN-SPAM basics (real physical address, accurate from/subject, working one-click unsubscribe, honor opt-outs). Out of scope here.
- **Lompoc + Vandenberg only** (already true — we only iterate our own approved businesses).

## Background / current state

- `businesses` table has `website` (varchar) but **no contact-email** column. Owner login email lives on `users`; that's not a public business contact.
- Provenance pattern already exists: `hoursSource` / `aboutSource` / `amenitiesSource` (`'google' | 'owner' | null`). This feature mirrors it.
- The repo runs data jobs as standalone `tsx` scripts under `db/` (e.g. `db/scrape-google-places.ts`), invoked via package scripts like `db:scrape-google-places` (`node --env-file=.env.local node_modules/.bin/tsx db/<script>.ts`). Migrations via drizzle-kit (`npm run db:generate` → `npm run db:push`).
- Node 18+ global `fetch` is available (the repo targets Next 14 / modern Node).

## Data model (Drizzle migration)

Add to `businesses`:

| column | type | meaning |
|---|---|---|
| `contact_email` | `varchar(320)` | the collected public contact email; null when none found |
| `contact_email_source` | `text` | `'website' \| 'google' \| 'manual' \| null` |
| `contact_email_status` | `text` | `'found' \| 'none' \| 'error' \| null` — last collection outcome |
| `contact_email_scraped_at` | `timestamp` (tz) | when collection last ran for this row |

Drizzle field names: `contactEmail`, `contactEmailSource`, `contactEmailStatus`, `contactEmailScrapedAt`. All nullable; no backfill. Generate migration with drizzle-kit; **trim the generated `.sql` to only these four `ALTER TABLE` statements** (the repo accumulates schema drift — see the prior About/amenities migration).

## Email extraction (`lib/email-extract.ts`, pure + unit-tested)

A pure module so the matching rules are testable without network.

```ts
export function extractEmails(html: string): string[]
// All RFC-ish email matches found in html: mailto: hrefs first, then plain-text matches. Lowercased, de-duplicated, order-stable.

export function pickBestEmail(emails: string[], siteHost: string | null): string | null
// Choose the best business contact from candidates:
//  1. Drop junk: no-reply/noreply, example.com/.org, sentry/wixpress/.png/.jpg-embedded, addresses with '..', anything failing a basic shape check.
//  2. Prefer an address whose domain matches siteHost (the business's own domain).
//  3. Among those, prefer role mailboxes in priority order: info, contact, hello, sales, office, then any.
//  4. Fall back to the first non-junk candidate if none match the domain.
//  Returns null when nothing usable remains.
```

**Test** (`lib/email-extract.test.ts`, `tsx` + `node:assert/strict`, the repo's test style): covers mailto extraction, plain-text extraction, dedupe/lowercase, junk rejection (no-reply, image-embedded, example.com), domain preference over off-domain, role-mailbox priority (`info@` beats `random@` on same domain), and empty/garbage input → `[]` / `null`.

## Collection script (`db/scrape-business-emails.ts`, tsx)

Mirrors the structure of `db/scrape-google-places.ts` (dotenv, drizzle `db` client, clear logging, idempotent, `process.exit`).

Behavior:
1. Select approved businesses with a non-empty `website` and (`contact_email IS NULL` OR a `--refresh` flag) — re-runnable; skips ones already done unless refreshing.
2. For each, normalize the website URL; derive `siteHost`. Fetch the homepage and up to two likely contact paths (`/contact`, `/about`) — stop early once a good email is found.
   - Per fetch: custom `User-Agent` (e.g. `LompocLocalsBot/1.0 (+https://<site>/about; contact@…)`), `AbortController` timeout (~10s), follow redirects, only parse `text/html`.
   - Best-effort `robots.txt`: skip a path that is `Disallow`ed for our UA; on any robots fetch error, proceed (don't block on it).
3. Run `extractEmails` → `pickBestEmail(…, siteHost)`.
4. Write back: on hit → `contactEmail`, `contactEmailSource='website'`, `contactEmailStatus='found'`, `contactEmailScrapedAt=now()`. On no email → status `'none'`. On fetch/parse failure → status `'error'`. Always set `scrapedAt` so re-runs can target only `null`/`error` rows.
5. Politeness: small concurrency (e.g. 4) and a short delay between requests to the same host; summary log at the end (`found / none / error / skipped`).
6. **Never** overwrite a `contactEmailSource='manual'` row (owner-provided wins), mirroring the `*Source='owner'` guard.

Package script: add `db:scrape-business-emails` → `node --env-file=.env.local node_modules/.bin/tsx db/scrape-business-emails.ts`.

## Export script (`db/export-business-emails.ts`, tsx)

Selects businesses with `contact_email IS NOT NULL` and writes `name,contact_email,slug,website,contact_email_source` to `business-emails.csv` (repo root, git-ignored) for import into a compliant sender. Prints the row count. Package script: `db:export-business-emails`.

## Testing & verification

- `npx tsx lib/email-extract.test.ts` — passes.
- `npx tsc --noEmit` — clean.
- Migration applied to dev DB (`npm run db:push`); columns present.
- Dry sanity run of the collection script against a small `--limit` (e.g. 5) to confirm it fetches, extracts, and writes without error — review the logged source/status before any full run. (A full ~330-site run is an operational step the user triggers, not part of automated verification.)

## Out of scope (YAGNI)

- Sending any email / building outreach campaigns (separate compliant phase).
- Apify/Google-sourced emails for the ~89 businesses without a website (possible later `'google'` source).
- Multiple emails per business / a separate `business_contacts` table (single primary email on the row; revisit only if needed).
- A dashboard UI for editing the contact email (could reuse the profile form later; not now).

## File structure

- **Migration:** drizzle migration adding the 4 `contact_email*` columns.
- **Create:** `lib/email-extract.ts`, `lib/email-extract.test.ts`, `db/scrape-business-emails.ts`, `db/export-business-emails.ts`.
- **Modify:** `db/schema.ts` (4 columns), `package.json` (2 scripts), `.gitignore` (ignore `business-emails.csv`).
