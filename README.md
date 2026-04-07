# Lompoc Deals

A local promotions feed for Lompoc, California. Businesses post coupons, specials, and announcements; locals browse a feed, search by category, view a map, and optionally subscribe to a weekly email digest.

## Tech stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + **shadcn/ui** components
- **Postgres** via [Neon](https://neon.tech) (`@neondatabase/serverless`)
- **Drizzle ORM** for schema and migrations
- **Auth.js v5** (NextAuth) with email/password + bcrypt
- **Leaflet + react-leaflet** for the map (OpenStreetMap tiles, no API key)
- **Resend** for transactional and digest emails
- **Vercel Blob** for image uploads
- Hosted on **Vercel**

## Local development

### 1. Prerequisites

- Node.js ≥ 20
- npm
- A free [Neon](https://neon.tech) project (Postgres)
- A free [Resend](https://resend.com) account (email)
- A free [Vercel](https://vercel.com) account with a Blob store created

### 2. Install

```bash
git clone <your-repo-url> lompoc-deals
cd lompoc-deals
npm install
```

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
DATABASE_URL=postgresql://...        # from Neon
AUTH_SECRET=...                      # openssl rand -base64 32
AUTH_URL=http://localhost:3000       # in prod: https://yourdomain.com
RESEND_API_KEY=re_...                # from Resend
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...  # from Vercel Blob
CRON_SECRET=...                      # openssl rand -base64 32
```

Generate the two secrets locally:

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -base64 32   # CRON_SECRET
```

### 4. Database

```bash
npm run db:generate   # generates SQL migrations from db/schema.ts
npm run db:migrate    # applies migrations to DATABASE_URL
npm run db:seed       # 7 categories, 5 sample businesses, 10 sample deals
npm run db:studio     # browse data in a local Drizzle Studio UI
```

### 5. Run the dev server

```bash
npm run dev
```

Visit http://localhost:3000.

## Seeded test users

After running `npm run db:seed`, you can sign in with:

| Role | Email | Password |
|---|---|---|
| Business owner | `owner@lompocdeals.test` | `password123` |

## Folder structure

```
app/
  (public)/      ← homepage feed, biz profiles, categories, search, map, subscribe, favorites
  (auth)/        ← login, signup
  dashboard/     ← gated business dashboard (profile, deals CRUD, stats)
  admin/         ← gated admin (approve businesses, soft-delete deals)
  api/
    auth/        ← NextAuth route handler
    cron/digest/ ← weekly digest cron, bearer-protected
    track/click/ ← click-tracking redirect
components/      ← reusable UI (DealCard, SiteHeader, etc.) + shadcn/ui primitives
db/
  schema.ts      ← Drizzle schema
  client.ts      ← Drizzle + Neon HTTP client
  seed.ts        ← seed script
  migrations/    ← generated SQL
lib/
  auth-actions.ts       ← signup, login, logout
  biz-actions.ts        ← business dashboard server actions
  admin-actions.ts      ← admin server actions
  favorite-actions.ts   ← local user favorite toggle
  subscribe-actions.ts  ← email digest subscribe / confirm / unsubscribe
  queries.ts            ← read-side query helpers
  viewer.ts             ← unified session/role/favorites lookup
  email.ts              ← Resend wrappers
  blob.ts               ← Vercel Blob upload helper
  geocode.ts            ← Nominatim address → lat/lng
  tracking.ts           ← view + click counters
auth.ts          ← Auth.js v5 config
middleware.ts    ← gates /dashboard/* and /admin/*
docs/
  build-plan.md  ← original spec
```

## Deployment

### To Vercel

1. **Push to GitHub**:
   ```bash
   gh repo create lompoc-deals --private --source=. --push
   ```

2. **Import to Vercel**: https://vercel.com/new → pick the repo → Deploy

3. **Add environment variables** in Vercel → Project → Settings → Environment Variables. Same six vars as `.env.local`. **Set `AUTH_URL` to your production URL** (e.g. `https://lompocdeals.com`).

4. **Run migrations against the production DB** before first deploy:
   ```bash
   DATABASE_URL=<prod-url> npm run db:migrate
   DATABASE_URL=<prod-url> npm run db:seed   # only if you want sample data in prod
   ```

5. **Cron job**: `vercel.json` declares a weekly cron at Saturday 9am UTC hitting `/api/cron/digest`. Vercel registers it on first deploy. Verify at Vercel → Project → Settings → Cron Jobs.

6. **Custom domain**: Vercel → Domains → add your domain. In your DNS provider, add the A record (`@` → `76.76.21.21`) and CNAME (`www` → `cname.vercel-dns.com`) Vercel shows you. Wait a few minutes for SSL.

7. **After domain is live**: update `AUTH_URL` env var in Vercel to `https://yourdomain.com` and redeploy.

### Cron secret

The `/api/cron/digest` route is protected by an `Authorization: Bearer <CRON_SECRET>` header. Vercel automatically sends this header with the value of your `CRON_SECRET` env var when its scheduler hits the route. Without the bearer header, the route returns 401.

To trigger the cron manually for testing:

```bash
CRON=$(grep '^CRON_SECRET=' .env.local | cut -d= -f2-)
curl -H "Authorization: Bearer $CRON" http://localhost:3000/api/cron/digest
```

## npm scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Start production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate SQL migrations from `db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:push` | Push schema directly (interactive) |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Run the seed script |

## License

Private project. All rights reserved.
