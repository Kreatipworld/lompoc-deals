# Lompoc Locals

A local promotions feed for Lompoc, California. Businesses post coupons, specials, and announcements; locals browse a feed, search by category, view a map, and optionally subscribe to a weekly email digest.

## Tech stack
- Next.js 14 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Postgres via Neon (`@neondatabase/serverless`)
- Drizzle ORM for schema and migrations
- Auth.js (NextAuth) v5 with email/password + bcrypt
- Leaflet + react-leaflet for the map
- Resend for transactional and digest emails
- Vercel Blob for image uploads
- Hosted on Vercel, domain via GoDaddy

## Roles
- `local` — optional account; can favorite deals and subscribe to digest
- `business` — creates and manages a business profile and its deals
- `admin` — approves new businesses, removes spam

## Folder conventions
- `app/` — Next.js routes (App Router)
- `app/[locale]/(public)/` — public pages (accessible at `/en/...` and `/es/...`)
- `app/[locale]/(auth)/` — login, signup, logout
- `app/[locale]/dashboard/` — gated business dashboard
- `app/[locale]/admin/` — gated admin pages
- `app/api/` — route handlers (no locale prefix)
- `db/` — Drizzle schema, migrations, seed script
- `lib/` — shared utilities (auth, email, blob upload)
- `components/` — reusable UI
- `docs/` — project specs and notes (read these before changing scope)

## Routing — how pages appear on the live site

This app uses `next-intl` for i18n. **All page files live under `app/[locale]/`**, not at the app root.

| Want this URL | Create this file |
|---|---|
| `/en/about` | `app/[locale]/(public)/about/page.tsx` |
| `/en/dashboard/foo` | `app/[locale]/dashboard/foo/page.tsx` |
| `/api/my-endpoint` | `app/api/my-endpoint/route.ts` |

Visiting `/` auto-redirects to `/en` (or `/es` based on browser language) via middleware.

## Shipping — how changes reach https://www.lompoclocals.com

Git pushes build NOTHING on Vercel (`vercel.json` → `ignoreCommand` → `scripts/vercel-ignore.sh`).
`scripts/ship.sh` is the ONLY path to production, and it costs exactly one build per ship:

```bash
./scripts/ship.sh "feat: describe what you changed"   # commit → push main → ONE staged production build → checks → promote → checks on www
./scripts/ship.sh --verify                            # no commit: build + check origin/main, do not promote (agents)
./scripts/ship.sh --promote                           # promote origin/main (reuses a verified build, no rebuild)
./scripts/ship.sh --promote --recheck                 # rebuild + recheck even if verified
```

What the gate does: checks the exact commit out into a clean worktree, runs
`vercel deploy --prod --skip-domain` (a real production build with production env, not on the domain),
runs `scripts/check-production.mjs` + `scripts/smoke-real-estate.mjs` (Playwright, desktop + iPhone)
against it, and only if all green runs `vercel promote`. Then it re-checks www and rolls back to the
previous deployment if that is red. Commits that touch only `content/`, `docs/`, memory or `*.md`
never build at all (the `production` branch is just a record of what was promoted).

Rules:
- **Never `vercel deploy --prod` without `--skip-domain`, never `vercel promote` or `git push origin production` by hand.**
- Subagents commit their own files explicitly, push to `main`, run `ship.sh --verify` and report the
  build URL; the coordinator promotes with `./scripts/ship.sh --promote`.
- Batch social logs / docs with code commits or ship them together — every extra ship is a build minute.
- Cost rules (Sep 16 2026, "my bill is going up"): public pages must be ISR (`export const revalidate`),
  never read cookies/session in shared server components (the header's user menu is client-side via
  `/api/me`); health check runs every 2 min with page rotation; image variants cache 30 days.
- If a check is red, fix forward and ship again; production keeps the last good deployment.

## Health, bugs, backups
- `/api/cron/health-check` runs every minute (13 pages + DB; one heartbeat row per 10 min in `cron_runs`,
  every failure logged, email to hello@ on the first failure and on recovery).
- "Report a bug" (`components/report-bug.tsx`) sits on the error page, the 404 page, and the footer.
  Reports land in `bug_reports` (admin → Bugs, tile on the overview) and email hello@; the route + error
  message travel with the report. Mark them fixed when they ship — the tile is the open backlog.
- Backups: Neon takes a daily snapshot of the production branch (30-day retention). `scripts/backup.mjs`
  keeps an off-cloud copy on this Mac (`~/Backups/lompoc-locals`: every table as ndjson.gz, last 14 days;
  every Blob object mirrored; git unpushed-commit check) and runs daily at 3:30 AM via launchd
  (`~/Library/LaunchAgents/com.lompoclocals.backup.plist`). Run by hand: `node --env-file=.env.local scripts/backup.mjs`.

## Env vars (see .env.example)
DATABASE_URL, AUTH_SECRET, AUTH_URL, RESEND_API_KEY, BLOB_READ_WRITE_TOKEN, CRON_SECRET

## Working agreement with Claude Code
- Build in phases. After each phase, stop and report what was built so I can test.
- Commit after every working phase: `git add . && git commit -m "phase: <name>"`.
- Never commit `.env.local`.
- Prefer small, readable files over clever abstractions.
- Ask before adding new dependencies or scope.
- When in doubt, re-read `docs/build-plan.md`.
