# Lompoc Deals

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
- `app/(public)/` — public marketing + feed pages
- `app/(auth)/` — login, signup, logout
- `app/dashboard/` — gated business dashboard
- `app/admin/` — gated admin pages
- `app/api/` — route handlers
- `db/` — Drizzle schema, migrations, seed script
- `lib/` — shared utilities (auth, email, blob upload)
- `components/` — reusable UI
- `docs/` — project specs and notes (read these before changing scope)

## Env vars (see .env.example)
DATABASE_URL, AUTH_SECRET, AUTH_URL, RESEND_API_KEY, BLOB_READ_WRITE_TOKEN, CRON_SECRET

## Working agreement with Claude Code
- Build in phases. After each phase, stop and report what was built so I can test.
- Commit after every working phase: `git add . && git commit -m "phase: <name>"`.
- Never commit `.env.local`.
- Prefer small, readable files over clever abstractions.
- Ask before adding new dependencies or scope.
- When in doubt, re-read `docs/build-plan.md`.
