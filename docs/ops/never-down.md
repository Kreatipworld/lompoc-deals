# Keeping lompoclocals.com up — the safety net

The rule: **the site is never down for a neighbor, and a false alarm never looks like a real one.**
This is how that is enforced, and exactly what to do if the monitor ever emails a real DOWN.

## The layers that keep it up

1. **Bad deploys can't stick.** `scripts/ship.sh` is the only way to production. It builds the
   exact commit in a clean worktree, runs `scripts/check-production.mjs` + `scripts/smoke-real-estate.mjs`
   (desktop **and** iPhone) against that build, and **only promotes if every check is green**. After
   promoting it re-checks `www` and **rolls back to the previous deployment automatically if that is red.**
   So a broken build never reaches neighbors — the last good deployment keeps serving.

2. **The live monitor is honest now.** `app/api/cron/health-check` runs every 15 minutes, fetching the
   home page + the database + a rotation of the 12 real pages. It tells a real outage apart from a
   harmless content change (see `lib/uptime.ts`):
   - **Outage → emails hello@** (`severity: "outage"`): non-200, the error boundary is showing, the
     server threw an error digest, the HTML never finished streaming, or the page was unreachable.
   - **Drift → logged only, never emailed** (`severity: "drift"`): the page served fine (200, no error
     boundary, complete HTML) but an expected marker string moved. That is an SEO/copy edit, not an
     outage. **A word changing on the site can no longer send a "site is DOWN" alarm.**
   - Where a marker is really the page's heading, it is read from the same source the page renders
     from (`CATEGORY_GUIDES`), so the two can never disagree.

3. **The data is backed up.** Neon takes a daily snapshot of production (30-day retention). `scripts/backup.mjs`
   mirrors every table + every Blob object to this Mac nightly (3:30 AM via launchd). See CLAUDE.md.

## If you get a REAL DOWN email — emergency recovery

A real DOWN email now means something actually broke. Fastest safe fix, in order:

1. **If it followed a deploy — roll back instantly (no rebuild):**
   ```bash
   vercel rollback --yes          # restores the immediately-previous production deployment
   # or, to pick a specific known-good one:
   vercel ls lompoc-deals         # find the last green deployment URL
   vercel promote <deployment-url>
   ```
   Rollback serves an already-built deployment, so it is instant and costs no build minute.

2. **If the email says Neon compute quota (HTTP 402):** it is the database, not the code. Open the
   **Kreatip** org billing page (linked in the email) and confirm the org is Kreatip, not the Vercel one.
   Rollback will not help a database issue.

3. **Confirm recovery:** you'll get a green "back" email within ~15 min, or check by hand:
   ```bash
   node scripts/check-production.mjs          # all pages, desktop + iPhone
   ```

## If you get NO email but suspect a problem

```bash
node scripts/check-production.mjs             # the same checks ship.sh runs
```
Green here means neighbors are fine. The monitor only emails for the outage signals above, so silence = healthy.

## Checking the monitor itself

- Recent health runs are in the `cron_runs` table (`name = 'health-check'`) and on the admin overview.
  A row with `ok: true` and a non-empty `warnings` array is **drift** — the page is up, a marker just
  needs refreshing in `lib/uptime.ts`. It is not an outage and no one was emailed.
- Send yourself a sample alert (touches nothing): `GET /api/cron/health-check?test=alert` with the cron secret.

## Possible next step (not built yet)
Auto-rollback: on a confirmed outage that followed a deploy, have the cron call `vercel rollback`
itself. Deferred on purpose — it needs a deploy token in the cron env and tight guards so it can
only ever roll *back*, never forward. The trustworthy alert + one-command manual rollback above
cover the same ground safely today.
