# Keyword position tracking (Google Search Console) — design, Sep 30 2026

Owner's ask (Sep 30 2026): "start working on our keyword position tracking … we need to bring those
numbers … so we can rank us and our clients better." Goal: know, every day, where lompoclocals.com
ranks on Google for the searches that matter to the town and to each member business, and use that
to pick what to strengthen next. Members later see their own positions in their dashboard (phase 2).

## Source of truth
Google Search Console **Search Analytics API** (`searchanalytics.query`) for the domain property
`sc-domain:lompoclocals.com`. Real impressions / clicks / average position per query and page. No
scraping Google, no third-party rank tracker.

Auth: a Google Cloud **service account** added as a user on the GSC property. Env:
- `GSC_SERVICE_ACCOUNT_JSON` — the service-account key JSON, **base64-encoded** (one line).
- `GSC_SITE_URL` — `sc-domain:lompoclocals.com`.
Token flow: build an RS256 JWT with Node `crypto` (`iss` = client_email, `scope` =
`https://www.googleapis.com/auth/webmasters.readonly`, `aud` = `https://oauth2.googleapis.com/token`,
60 min), POST it as `urn:ietf:params:oauth:grant-type:jwt-bearer`, cache the access token in module
scope until 5 min before expiry. **No new npm dependency** (no `googleapis`, no `google-auth-library`).

GSC data lags ~2 days; every pull re-fetches the last **4** days and upserts.

## Schema (Drizzle in db/schema.ts + migration db/migrations/0031_keyword_positions.sql, additive)
- `gsc_daily` — `id serial`, `date date`, `query text`, `page text`, `clicks int`, `impressions int`,
  `ctr real`, `position real`, `fetched_at timestamptz default now()`. Unique `(date, query, page)`;
  index `(query, date)`; index `(page, date)`.
- `tracked_keywords` — `id serial`, `keyword text unique` (lower-cased, trimmed), `target_path text null`
  (e.g. `/biz/paisano-s-family-barbershop`), `business_id int null → businesses.id`, `note text null`,
  `created_at timestamptz`. `business_id` is how "our clients" are tracked: a member can have many keywords.
- Cron runs log into the existing `cron_runs` (name `gsc-pull`) the way the other crons do.

## Code
- `lib/gsc.ts` — `gscAccessToken()`, `gscQuery({startDate, endDate, dimensions, rowLimit, startRow})`
  with pagination (rowLimit 25000, loop on startRow), and `pullGscDays(days)` → upsert into `gsc_daily`.
  Throws a clear error when env is missing (`GSC_SERVICE_ACCOUNT_JSON not set`).
- `lib/keyword-positions.ts` — read models for the admin page (and later the member dashboard):
  - `kpiWindow(days)` → clicks, impressions, avg position (impression-weighted), distinct queries, vs the
    previous window of the same length.
  - `trackedKeywordRows()` → for each tracked keyword: best page (most impressions last 28 d), 7-day avg
    position, Δ vs the previous 7 days, 28-day impressions + clicks, last 28 daily positions (sparkline).
    Match = exact query OR query containing the keyword (both lower-cased) — document which in the UI.
  - `opportunities()` → queries with ≥ 20 impressions in 28 d and avg position between 5 and 15, with
    their best page; sorted by impressions. This is the "strengthen these pages" list from
    memory/project_seo_search_console.
  - `topPages(days)` and `topQueries(days)`.
- `app/api/cron/gsc-pull/route.ts` — `CRON_SECRET` bearer check like health-check; `unstable_noStore()`;
  calls `pullGscDays(4)`; logs a `cron_runs` row with rows upserted; returns JSON.
  `vercel.json` cron: `"0 11 * * *"` (daily 11:00 UTC = 4 AM PT, after Google's nightly refresh).
- `scripts/gsc-pull.mjs` — local runner: `node --env-file=.env.local scripts/gsc-pull.mjs --days 120`
  for the first backfill (GSC keeps 16 months; start with 120 days). Reuses the same JWT code (plain
  fetch; keep it dependency-free, duplicate the ~40 lines rather than importing TS).
- `scripts/seed-tracked-keywords.mjs` — inserts the starter list below plus, for every member business
  (active `subscriptions` tier standard/premium, or `plan_override`): the business name (lower-cased,
  punctuation stripped) and `lompoc <category name>` (from `categories`), each with `business_id` and
  `target_path=/biz/<slug>`. Idempotent (`on conflict (keyword) do nothing`).
- Admin page `app/[locale]/admin/seo/page.tsx` (+ tile on the admin overview and the admin nav, same
  pattern as /admin/sales): sections in this order —
  1. KPIs last 28 d vs previous 28 d (clicks, impressions, avg position, queries).
  2. **Tracked keywords** table: keyword · business (logo + name when linked) · best page · position
     (7 d) · Δ (green ↑ when position number fell, red ↓ when it rose) · impressions · clicks · sparkline.
     Add-keyword form (keyword, optional business picker, optional target path) and a remove button;
     server actions, admin-gated like the other admin pages.
  3. **Opportunities** (positions 5–15).
  4. Top queries and top pages (28 d).
  Empty state when `gsc_daily` is empty: explain that the credential is missing and show the exact env
  var names. Page is dynamic (admin, session-gated) — fine, admin pages are not ISR.
- `scripts/check-production.mjs` §21: `/admin/seo` redirects anonymous users to login (like other admin
  routes); `/api/cron/gsc-pull` returns 401 without the secret.

## Starter keywords (seed)
lompoc · lompoc locals · lompoc restaurants · restaurants in lompoc · things to do in lompoc ·
lompoc events · lompoc news · lompoc ca news · lompoc football · lompoc braves football ·
cabrillo football · lompoc high school football · lompoc deals · lompoc coupons · lompoc garage sales ·
lompoc yard sales · lompoc plumber · lompoc tires · lompoc barber · lompoc barbershop · lompoc realtor ·
homes for sale lompoc · lompoc wineries · lompoc tacos · lompoc florist · lompoc jewelers ·
lompoc chalk festival · lompoc chalks · lompoc business directory · lompoc map

## Out of scope (phase 2, after data lands)
Member-dashboard "Your Google positions" card; weekly Telegram/email summary of movers; Bing.

## Rules
- Build budget: `npm run build` locally before any push; one commit; push to `main` only; do NOT run
  ship.sh — the coordinator ships. Report the commit hash.
- No new dependencies. Follow CLAUDE.md (ISR rules do not apply to admin pages; `unstable_noStore()` first
  line of the cron GET).
- Everything must work with the env var missing: cron returns 200 `{skipped:"no credential"}` and logs
  nothing noisy; admin page shows the empty state.
