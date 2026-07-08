# SEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the crawlable surface of www.lompoclocals.com (sitemap, canonicals, event pages, old-domain cleanup), build the "Garage Sales in Lompoc" landing page, and write the owner's off-page SEO playbook.

**Architecture:** Code changes ride the existing AUTH_URL-derived URL system. A new `lib/seo.ts` helper standardizes canonical/hreflang alternates. `/garage-sales` flips from a 308 redirect to a server-rendered landing page reusing `getFeedItems`, `FeedCard`, and `FeedMap`. The playbook is a committed markdown document.

**Tech Stack:** Next.js 14 App Router metadata API, next-intl, Drizzle, JSON-LD via inline `<script type="application/ld+json">`.

**Spec:** `docs/superpowers/specs/2026-07-08-seo-foundation-design.md`

## Global Constraints

- No new dependencies. No programmatic page generation (Approach B is gated).
- Every user-facing string via next-intl, EN + ES parity (`messages/en.json` / `messages/es.json`).
- All absolute URLs derive from `AUTH_URL` (via `metadataBase` for metadata; via `process.env.AUTH_URL ?? "http://localhost:3000"` in scripts/JSON-LD).
- Sitemap excludes: `/deals/[id]`, `/feed/[id]`, `/listings/[id]`, `/search`, auth/dashboard/admin, event detail pages.
- Tests are plain `node:assert/strict` scripts run with `npx tsx <file>`. Typecheck `npx tsc --noEmit` + `npm run lint` before every commit.
- Date formatting locale-pinned (pass the locale, like `components/feed-card.tsx` does).
- Deploys are manual (`vercel deploy --prod` from main); commit after every task; do not deploy mid-phase.
- SEO title patterns (binding): garage-sales EN `Garage Sales in Lompoc, CA — This Weekend's Yard Sales | Lompoc Locals`, ES `Ventas de garaje en Lompoc, CA | Lompoc Locals`.

## Phase map

- Phase 1 (ship after Task 4): Tasks 1–4 — index surface
- Phase 2 (ship after Task 5): Task 5 — garage-sales landing page
- Phase 3 (no deploy): Task 6 — playbook document

---

### Task 1: `lib/seo.ts` — canonical + hreflang helper, applied to 10 templates

**Files:**
- Create: `lib/seo.ts`
- Test: `lib/seo.test.ts`
- Modify (add `alternates` to existing metadata exports/functions):
  - `app/[locale]/(public)/page.tsx` (home)
  - `app/[locale]/(public)/feed/page.tsx`
  - `app/[locale]/(public)/businesses/page.tsx`
  - `app/[locale]/(public)/category/[slug]/page.tsx`
  - `app/[locale]/(public)/biz/[slug]/page.tsx`
  - `app/[locale]/(public)/blog/page.tsx`
  - `app/[locale]/(public)/blog/[slug]/page.tsx`
  - `app/[locale]/(public)/hotels/page.tsx`
  - `app/[locale]/(public)/hotels/[slug]/page.tsx`
  - `app/[locale]/(public)/activities/page.tsx`
  - `app/[locale]/(public)/activities/[slug]/page.tsx`
  - `app/[locale]/(public)/map/page.tsx`

**Interfaces:**
- Produces: `pageAlternates(path: string): NonNullable<Metadata["alternates"]>` — returns `{ canonical: path, languages: { en: path, es: \`/es${path}\`, "x-default": path } }`. `path` starts with `/`; home passes `"/"` and the es variant must be `/es` (not `/es/`).

- [ ] **Step 1: Write the failing test**

Create `lib/seo.test.ts`:

```ts
import assert from "node:assert/strict"
import { pageAlternates } from "./seo"

// standard path
assert.deepEqual(pageAlternates("/businesses"), {
  canonical: "/businesses",
  languages: {
    en: "/businesses",
    es: "/es/businesses",
    "x-default": "/businesses",
  },
})

// dynamic path
assert.deepEqual(pageAlternates("/biz/some-slug").canonical, "/biz/some-slug")
assert.equal(pageAlternates("/biz/some-slug").languages!.es, "/es/biz/some-slug")

// home: es variant must not end with a trailing slash after the prefix
assert.deepEqual(pageAlternates("/"), {
  canonical: "/",
  languages: { en: "/", es: "/es", "x-default": "/" },
})

console.log("seo.test.ts OK")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx lib/seo.test.ts`
Expected: FAIL — `Cannot find module './seo'`

- [ ] **Step 3: Write the implementation**

Create `lib/seo.ts`:

```ts
import type { Metadata } from "next"

/**
 * Canonical + hreflang alternates for a public page. Relative paths —
 * they resolve against metadataBase (AUTH_URL) in app/layout.tsx.
 * `path` must start with "/". The default locale (en) is unprefixed;
 * Spanish lives under /es (next-intl localePrefix: "as-needed").
 */
export function pageAlternates(path: string): NonNullable<Metadata["alternates"]> {
  const esPath = path === "/" ? "/es" : `/es${path}`
  return {
    canonical: path,
    languages: { en: path, es: esPath, "x-default": path },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx lib/seo.test.ts`
Expected: `seo.test.ts OK`

- [ ] **Step 5: Apply to the 12 files**

For each file in the Modify list: read it, find its metadata export.

- If it has `export async function generateMetadata(...)`: add `alternates: pageAlternates(<path>)` to the returned object, where `<path>` is the concrete path — static pages use their literal path (`"/feed"`, `"/businesses"`, `"/blog"`, `"/hotels"`, `"/activities"`, `"/map"`, `"/"`), dynamic pages interpolate (`\`/biz/${params.slug}\``, `\`/category/${params.slug}\``, `\`/blog/${params.slug}\``, `\`/hotels/${params.slug}\``, `\`/activities/${params.slug}\``).
- If it has a static `export const metadata: Metadata = {...}`: add the same `alternates` field.
- If a page has NO metadata export at all, add a minimal `generateMetadata` returning only `{ alternates: pageAlternates(<path>) }` — do not invent titles/descriptions.
- Import: `import { pageAlternates } from "@/lib/seo"`.
- Do not modify anything else in the returned metadata (titles/descriptions stay as-is).

- [ ] **Step 6: Verify rendered output**

```bash
npx tsc --noEmit && npm run lint
npm run dev &
sleep 8
curl -s http://localhost:3000/businesses | grep -o '<link rel="canonical"[^>]*>'
curl -s http://localhost:3000/businesses | grep -o '<link rel="alternate" hreflang="es"[^>]*>'
kill %1
```

Expected: canonical href `http://localhost:3000/businesses` (AUTH_URL in .env.local is localhost) and an es alternate ending in `/es/businesses`.

- [ ] **Step 7: Commit**

```bash
git add lib/seo.ts lib/seo.test.ts "app/[locale]/(public)"
git commit -m "feat: per-page canonical + hreflang alternates on public templates"
```

---

### Task 2: Sitemap additions

**Files:**
- Modify: `app/sitemap.ts`
- Test: `lib/sitemap.smoke.ts` (new)

**Interfaces:**
- Consumes: `HOTELS` (array of `{ slug: string, ... }`) from `lib/hotels-data.ts`; `activities` table from `@/db/schema` (columns `slug`, `updatedAt`).
- Produces: sitemap entries for `/hotels`, `/hotels/[slug]`, `/activities`, `/activities/[slug]`, `/feed`, `/locals`, `/contact`, `/garage-sales`.

- [ ] **Step 1: Extend `app/sitemap.ts`**

Current file queries `businesses`, `categories`, `blogPosts` and maps 7 static pages (see file). Changes:

1. Add import: `import { HOTELS } from "@/lib/hotels-data"`.
2. Extend the statics array:

```ts
const staticPages = [
  "",
  "/businesses",
  "/for-businesses",
  "/map",
  "/subscribe",
  "/blog",
  "/feed",
  "/garage-sales",
  "/hotels",
  "/activities",
  "/locals",
  "/contact",
].map((path) => ({
  url: `${siteUrl}${path}`,
  lastModified: new Date(),
  changeFrequency:
    path === "/feed" || path === "/garage-sales" || path === "" ? ("daily" as const)
    : path === "/contact" ? ("monthly" as const)
    : ("weekly" as const),
  priority:
    path === "" ? 1
    : path === "/feed" || path === "/garage-sales" || path === "/blog" ? 0.8
    : path === "/contact" ? 0.4
    : 0.7,
}))
```

Note: `/search` was in the OLD statics array but is deliberately absent above — the spec excludes it (query-driven page with no standalone content).

3. Add activity rows to the existing `Promise.all` (wrap the two DB-dependent additions so a failure degrades — same philosophy as the feed's safeStream):

```ts
const acts = await db.query.activities
  .findMany({ columns: { slug: true, updatedAt: true } })
  .catch((err) => {
    console.error("sitemap activities query failed:", err)
    return [] as { slug: string; updatedAt: Date }[]
  })
```

(Fold into the `Promise.all` alongside `bizs`/`cats`/`posts`, with `.catch` on each DB promise so one failure never 500s the sitemap: apply the same `.catch(() => [])`-with-log pattern to `bizs`, `cats`, and `posts` too.)

4. New page groups:

```ts
const hotelPages = HOTELS.map((h) => ({
  url: `${siteUrl}/hotels/${h.slug}`,
  lastModified: new Date(),
  changeFrequency: "weekly" as const,
  priority: 0.6,
}))

const activityPages = acts.map((a) => ({
  url: `${siteUrl}/activities/${a.slug}`,
  lastModified: a.updatedAt,
  changeFrequency: "weekly" as const,
  priority: 0.6,
}))
```

5. Return `[...staticPages, ...bizPages, ...catPages, ...blogPages, ...hotelPages, ...activityPages]`.

- [ ] **Step 2: Write the smoke script**

Create `lib/sitemap.smoke.ts`:

```ts
import sitemap from "../app/sitemap"

async function main() {
  const entries = await sitemap()
  const urls = entries.map((e) => e.url)
  const has = (frag: string) => urls.some((u) => u.includes(frag))

  if (!has("/hotels/")) throw new Error("missing hotel detail pages")
  if (!has("/activities/")) throw new Error("missing activity detail pages")
  for (const p of ["/feed", "/garage-sales", "/hotels", "/activities", "/locals", "/contact"])
    if (!urls.some((u) => u.endsWith(p))) throw new Error(`missing static ${p}`)
  for (const bad of ["/deals/", "/feed/", "/listings/", "/search", "/events/"])
    if (has(bad)) throw new Error(`excluded family present: ${bad}`)

  const origin = process.env.AUTH_URL ?? "http://localhost:3000"
  if (!urls.every((u) => u.startsWith(origin))) throw new Error("foreign origin in sitemap")

  console.log(`sitemap.smoke.ts OK — ${urls.length} URLs`)
}

main().then(() => process.exit(0))
```

Note: `has("/feed/")` — the static `/feed` entry ends with `/feed` (no trailing slash) so the `/feed/` fragment check correctly catches only feed-POST detail pages.

- [ ] **Step 3: Run it**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/sitemap.smoke.ts`
Expected: `sitemap.smoke.ts OK — <n> URLs` (n ≈ 560 with ~470 businesses + ~30 cats + ~50 blog + 18 hotels + activities).

- [ ] **Step 4: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add app/sitemap.ts lib/sitemap.smoke.ts
git commit -m "feat: sitemap covers hotels, activities, feed, garage-sales, locals, contact"
```

---

### Task 3: Public event detail page with Event JSON-LD

**Files:**
- Create: `app/[locale]/(public)/events/[id]/page.tsx`
- Modify: `messages/en.json`, `messages/es.json` (new `eventDetail` namespace)

**Interfaces:**
- Consumes: `events` table (`db/schema.ts` — columns: id, title, description, location, imageUrl, category, startsAt, endsAt, status); `pageAlternates` (Task 1); `Link` from `@/i18n/navigation`.
- Produces: the route the feed's `/events/${id}` hrefs point at. NOT added to sitemap.

- [ ] **Step 1: i18n keys**

`messages/en.json`, new top-level `eventDetail`:

```json
"eventDetail": {
  "metaTitle": "{title} — Event in Lompoc | Lompoc Locals",
  "backToFeed": "Back to the Neighborhood feed",
  "when": "When",
  "where": "Where",
  "notFoundTitle": "Event not found"
}
```

`messages/es.json`:

```json
"eventDetail": {
  "metaTitle": "{title} — Evento en Lompoc | Lompoc Locals",
  "backToFeed": "Volver al feed del vecindario",
  "when": "Cuándo",
  "where": "Dónde",
  "notFoundTitle": "Evento no encontrado"
}
```

- [ ] **Step 2: Write the page**

Create `app/[locale]/(public)/events/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { ArrowLeft, Calendar, MapPin } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { db } from "@/db/client"
import { events } from "@/db/schema"
import { pageAlternates } from "@/lib/seo"

const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"

async function getApprovedEvent(id: number) {
  if (Number.isNaN(id)) return null
  const rows = await db.select().from(events).where(eq(events.id, id)).limit(1)
  const ev = rows[0]
  if (!ev || ev.status !== "approved") return null
  return ev
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const ev = await getApprovedEvent(parseInt(params.id, 10))
  if (!ev) return {}
  const t = await getTranslations("eventDetail")
  return {
    title: t("metaTitle", { title: ev.title }),
    description: ev.description?.slice(0, 160) ?? undefined,
    alternates: pageAlternates(`/events/${ev.id}`),
  }
}

function formatEventDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default async function EventDetailPage({
  params,
}: {
  params: { id: string; locale: string }
}) {
  const ev = await getApprovedEvent(parseInt(params.id, 10))
  if (!ev) notFound()
  const t = await getTranslations("eventDetail")

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title,
    startDate: ev.startsAt.toISOString(),
    ...(ev.endsAt ? { endDate: ev.endsAt.toISOString() } : {}),
    ...(ev.description ? { description: ev.description } : {}),
    ...(ev.imageUrl ? { image: [ev.imageUrl] } : {}),
    location: {
      "@type": "Place",
      name: ev.location ?? "Lompoc, CA",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Lompoc",
        addressRegion: "CA",
        addressCountry: "US",
      },
    },
    url: `${siteUrl}/events/${ev.id}`,
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/feed?type=event"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToFeed")}
      </Link>

      {ev.imageUrl && (
        <div className="mb-6 overflow-hidden rounded-2xl border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ev.imageUrl} alt={ev.title} className="w-full object-cover" />
        </div>
      )}

      <h1 className="font-display text-3xl font-bold tracking-tight">{ev.title}</h1>

      <div className="mt-4 space-y-2 text-sm">
        <p className="inline-flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-semibold">{t("when")}:</span>
          {formatEventDate(ev.startsAt, params.locale)}
        </p>
        {ev.location && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-semibold">{t("where")}:</span>
            {ev.location}
          </p>
        )}
      </div>

      {ev.description && (
        <p className="mt-6 whitespace-pre-wrap leading-relaxed text-muted-foreground">
          {ev.description}
        </p>
      )}
    </main>
  )
}
```

(Check house style against `app/[locale]/(public)/feed/[id]/page.tsx` — heading classes, back-link pattern — and match it where this sketch differs.)

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit && npm run lint
npm run dev &
sleep 8
# find a real approved event id, or insert one in dev; if none exists:
node --env-file=.env.local -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql\`select id, title from events where status='approved' limit 3\`.then(r => { console.log(r); process.exit(0) })
"
curl -s http://localhost:3000/events/<ID> | grep -o '"@type":"Event"'
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/events/999999   # expect 404
kill %1
```

If the DB has no approved events, verify the 404 path works and note in the report that the happy path was verified by inserting + deleting a throwaway approved event in dev (SQL provided: `insert into events (title, starts_at, status) values ('smoke test', now() + interval '7 days', 'approved') returning id` then `delete from events where title = 'smoke test'`).

- [ ] **Step 4: Commit**

```bash
git add "app/[locale]/(public)/events" messages/en.json messages/es.json
git commit -m "feat: public event detail page with Event JSON-LD (fixes /events 404)"
```

---

### Task 4: Old-domain prose cleanup (ships Phase 1)

**Files:**
- Modify: `content/blog/posts-26-50.json` (posts `where-to-stay-lompoc-ca` and `list-lompoc-business-free`)
- Create: `db/fix-blog-domain-mentions.ts`

**Interfaces:**
- Consumes: `blogPosts` table.
- Produces: no code interfaces; data fix.

- [ ] **Step 1: Fix the source JSON**

In `content/blog/posts-26-50.json`, in the two posts' `body` fields, apply these replacements (exact strings):
- `lompoc-deals.vercel.app/hotels` → `www.lompoclocals.com/hotels`
- `Lompoc Deals (lompoc-deals.vercel.app)` → `Lompoc Locals (www.lompoclocals.com)`
- `lompoc-deals.vercel.app/signup` → `www.lompoclocals.com/signup`
- Any remaining `lompoc-deals.vercel.app` → `www.lompoclocals.com`
- `the Lompoc Deals hotels directory` → `the Lompoc Locals hotels directory`
- `Lompoc Deals -- The Platform Built for Lompoc` → `Lompoc Locals -- The Platform Built for Lompoc` (and the matching heading variants; check with grep for remaining `Lompoc Deals` mentions in ONLY these two posts' bodies — other posts are out of scope)

Verify: `grep -c "lompoc-deals.vercel.app" content/blog/posts-26-50.json` → 0.

- [ ] **Step 2: Write the DB fix script**

Create `db/fix-blog-domain-mentions.ts` (pattern: `db/migrate-garage-sales-to-feed.ts` — dry-run flag):

```ts
/**
 * db/fix-blog-domain-mentions.ts
 * One-shot: replaces old-domain mentions in published blog_posts content.
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx db/fix-blog-domain-mentions.ts --dry-run
 *   node --env-file=.env.local node_modules/.bin/tsx db/fix-blog-domain-mentions.ts
 */
import { like, or } from "drizzle-orm"
import { eq } from "drizzle-orm"
import { db } from "./client"
import { blogPosts } from "./schema"

const DRY_RUN = process.argv.includes("--dry-run")

const REPLACEMENTS: [string, string][] = [
  ["Lompoc Deals (lompoc-deals.vercel.app)", "Lompoc Locals (www.lompoclocals.com)"],
  ["lompoc-deals.vercel.app", "www.lompoclocals.com"],
  ["the Lompoc Deals hotels directory", "the Lompoc Locals hotels directory"],
]

async function main() {
  const rows = await db
    .select({ id: blogPosts.id, slug: blogPosts.slug, content: blogPosts.content })
    .from(blogPosts)
    .where(like(blogPosts.content, "%lompoc-deals.vercel.app%"))

  console.log(`Found ${rows.length} posts mentioning the old domain`)
  for (const row of rows) {
    let next = row.content
    for (const [from, to] of REPLACEMENTS) next = next.split(from).join(to)
    console.log(`- ${row.slug}: ${row.content.length} -> ${next.length} chars`)
    if (!DRY_RUN) {
      await db.update(blogPosts).set({ content: next }).where(eq(blogPosts.id, row.id))
    }
  }
  console.log(DRY_RUN ? "DRY RUN — no writes" : "Done")
}

main().then(() => process.exit(0))
```

- [ ] **Step 3: Run dry-run, then real, then verify**

```bash
node --env-file=.env.local node_modules/.bin/tsx db/fix-blog-domain-mentions.ts --dry-run
node --env-file=.env.local node_modules/.bin/tsx db/fix-blog-domain-mentions.ts
node --env-file=.env.local node_modules/.bin/tsx db/fix-blog-domain-mentions.ts --dry-run  # expect: Found 0
```

- [ ] **Step 4: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add content/blog/posts-26-50.json db/fix-blog-domain-mentions.ts
git commit -m "fix: blog prose references new domain (source JSON + DB script)"
```

**Phase 1 ends here — controller merges to main, deploys, and verifies canonicals + sitemap on production.**

---

### Task 5: "Garage Sales in Lompoc" landing page (ships Phase 2)

**Files:**
- Rewrite: `app/[locale]/(public)/garage-sales/page.tsx` (redirect → real page)
- Modify: `messages/en.json`, `messages/es.json` (new `garageSalesPage` namespace)

**Interfaces:**
- Consumes: `getFeedItems()` + `FeedDisplayItem` (`lib/feed-queries.ts`), `FeedCard` (client component, `<FeedCard item={...} />`), `FeedMap` (client, `{ items: FeedDisplayItem[] }`, load via next/dynamic ssr:false — copy the loader pattern from `components/feed-explorer.tsx`), `isThisWeekend` (`lib/feed-interleave.ts`), `NEIGHBORHOODS`/`neighborhoodLabel` (`lib/neighborhoods.ts`), `pageAlternates` (Task 1).
- Note: a server component cannot pass the dynamic-loader component directly — create a tiny client wrapper `components/garage-sales-map-section.tsx` that does the `dynamic()` import and renders `<FeedMap items={items} />` (items passed as prop from the server page).

- [ ] **Step 1: i18n keys**

`messages/en.json`, new top-level `garageSalesPage`:

```json
"garageSalesPage": {
  "metaTitle": "Garage Sales in Lompoc, CA — This Weekend's Yard Sales | Lompoc Locals",
  "metaDescription": "Find garage sales and yard sales happening in Lompoc this weekend — posted by your neighbors, with map, dates, and photos. Post yours free.",
  "h1": "Garage Sales in Lompoc",
  "intro": "Every garage sale and yard sale posted by Lompoc neighbors — updated all week, mapped by neighborhood. Sales happening this weekend are listed first.",
  "thisWeekend": "This weekend",
  "upcoming": "More upcoming sales",
  "empty": "No garage sales posted yet this week. Check back Thursday–Saturday morning, or be the first:",
  "postCta": "Having a sale? Post it free",
  "browseAll": "Browse all for-sale posts",
  "mapHeading": "Sales on the map",
  "byNeighborhood": "Browse by neighborhood",
  "faqHeading": "Garage sale questions",
  "faq1q": "When are garage sales in Lompoc?",
  "faq1a": "Most Lompoc garage sales run Friday through Sunday mornings, typically 7am–1pm. New sales are posted here all week — the This Weekend section shows what's coming up.",
  "faq2q": "How do I find garage sales near me in Lompoc?",
  "faq2a": "Use the map on this page or filter by neighborhood — Old Town, Downtown, Vandenberg Village, Mission Hills, Mesa Oaks and more. Each sale lists its address and dates.",
  "faq3q": "How do I post my garage sale in Lompoc?",
  "faq3a": "Posting is free: create a local account, add your address, dates, photos and what you're selling. Your sale appears in the Neighborhood feed and on this page."
}
```

`messages/es.json` — same keys, Spanish:

```json
"garageSalesPage": {
  "metaTitle": "Ventas de garaje en Lompoc, CA | Lompoc Locals",
  "metaDescription": "Encuentra ventas de garaje en Lompoc este fin de semana — publicadas por tus vecinos, con mapa, fechas y fotos. Publica la tuya gratis.",
  "h1": "Ventas de garaje en Lompoc",
  "intro": "Todas las ventas de garaje publicadas por vecinos de Lompoc — actualizadas toda la semana y organizadas por vecindario. Las ventas de este fin de semana aparecen primero.",
  "thisWeekend": "Este fin de semana",
  "upcoming": "Más ventas próximas",
  "empty": "Aún no hay ventas publicadas esta semana. Vuelve de jueves a sábado por la mañana, o sé el primero:",
  "postCta": "¿Tienes una venta? Publícala gratis",
  "browseAll": "Ver todas las publicaciones de venta",
  "mapHeading": "Ventas en el mapa",
  "byNeighborhood": "Buscar por vecindario",
  "faqHeading": "Preguntas sobre ventas de garaje",
  "faq1q": "¿Cuándo hay ventas de garaje en Lompoc?",
  "faq1a": "La mayoría de las ventas en Lompoc son de viernes a domingo por la mañana, normalmente de 7am a 1pm. Se publican ventas nuevas toda la semana — la sección Este fin de semana muestra las próximas.",
  "faq2q": "¿Cómo encuentro ventas de garaje cerca de mí en Lompoc?",
  "faq2a": "Usa el mapa de esta página o filtra por vecindario — Old Town, Centro, Vandenberg Village, Mission Hills, Mesa Oaks y más. Cada venta muestra su dirección y fechas.",
  "faq3q": "¿Cómo publico mi venta de garaje en Lompoc?",
  "faq3a": "Publicar es gratis: crea una cuenta local, agrega tu dirección, fechas, fotos y lo que vendes. Tu venta aparecerá en el feed del vecindario y en esta página."
}
```

- [ ] **Step 2: Client map wrapper**

Create `components/garage-sales-map-section.tsx`:

```tsx
"use client"

import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import type { FeedDisplayItem } from "@/lib/feed-queries"

function MapLoadingFallback() {
  const t = useTranslations("feed")
  return (
    <div className="flex h-[520px] items-center justify-center rounded-2xl border text-sm text-muted-foreground">
      {t("mapLoading")}
    </div>
  )
}

const FeedMap = dynamic(
  () => import("@/components/feed-map").then((m) => m.FeedMap),
  { ssr: false, loading: () => <MapLoadingFallback /> }
)

export function GarageSalesMapSection({ items }: { items: FeedDisplayItem[] }) {
  return <FeedMap items={items} />
}
```

(Match the exact dynamic-import shape used in `components/feed-explorer.tsx` — including how it resolves the named export — where this sketch differs.)

- [ ] **Step 3: Rewrite the page**

Replace `app/[locale]/(public)/garage-sales/page.tsx` entirely:

```tsx
import { getTranslations } from "next-intl/server"
import { ArrowRight, MapPin } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { getFeedItems, type FeedDisplayItem } from "@/lib/feed-queries"
import { isThisWeekend } from "@/lib/feed-interleave"
import { neighborhoodLabel, NEIGHBORHOODS } from "@/lib/neighborhoods"
import { FeedCard } from "@/components/feed-card"
import { GarageSalesMapSection } from "@/components/garage-sales-map-section"
import { pageAlternates } from "@/lib/seo"

export async function generateMetadata() {
  const t = await getTranslations("garageSalesPage")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: pageAlternates("/garage-sales"),
  }
}

export default async function GarageSalesPage({
  params,
}: {
  params: { locale: string }
}) {
  const t = await getTranslations("garageSalesPage")
  const all = await getFeedItems()
  const sales = all.filter((i) => i.type === "garage_sale")
  const now = new Date()
  const weekend = sales.filter((s) => isThisWeekend(s.saleStartsAt, s.saleEndsAt, now))
  const upcoming = sales.filter((s) => !weekend.includes(s))
  const hoods = Array.from(
    new Set(sales.map((s) => s.neighborhood).filter(Boolean) as string[])
  )

  const faq = [1, 2, 3].map((n) => ({
    q: t(`faq${n}q` as never) as string,
    a: t(`faq${n}a` as never) as string,
  }))
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  }

  const cardGrid = (items: FeedDisplayItem[]) => (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {items.map((item) => (
        <div key={item.id} className="mb-4 break-inside-avoid">
          <FeedCard item={item} />
        </div>
      ))}
    </div>
  )

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {t("h1")}
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{t("intro")}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/feed/post"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {t("postCta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/feed?type=for_sale"
          className="inline-flex items-center rounded-full border px-5 py-2.5 text-sm font-semibold hover:bg-accent"
        >
          {t("browseAll")}
        </Link>
      </div>

      {sales.length === 0 ? (
        <p className="mt-10 rounded-2xl border bg-secondary/30 p-8 text-center text-muted-foreground">
          {t("empty")}{" "}
          <Link href="/feed/post" className="font-medium text-primary underline underline-offset-4">
            {t("postCta")}
          </Link>
        </p>
      ) : (
        <>
          {weekend.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 font-display text-2xl font-semibold">{t("thisWeekend")}</h2>
              {cardGrid(weekend)}
            </section>
          )}
          {upcoming.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 font-display text-2xl font-semibold">{t("upcoming")}</h2>
              {cardGrid(upcoming)}
            </section>
          )}
          <section className="mt-10">
            <h2 className="mb-4 font-display text-2xl font-semibold">{t("mapHeading")}</h2>
            <GarageSalesMapSection items={sales} />
          </section>
        </>
      )}

      {hoods.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-xl font-semibold">{t("byNeighborhood")}</h2>
          <div className="flex flex-wrap gap-2">
            {hoods.map((h) => (
              <Link
                key={h}
                href={`/feed?type=garage_sale&hood=${h}`}
                className="inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm hover:bg-accent"
              >
                <MapPin className="h-3.5 w-3.5" />
                {neighborhoodLabel(h, params.locale)}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 border-t pt-8">
        <h2 className="mb-4 font-display text-2xl font-semibold">{t("faqHeading")}</h2>
        <dl className="space-y-5 max-w-3xl">
          {faq.map(({ q, a }) => (
            <div key={q}>
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-muted-foreground">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  )
}
```

Notes: `NEIGHBORHOODS` import is unused in this sketch — don't import it (lint). The dynamic `t()` casts (`as never`) — check repo precedent for dynamic keys (Task 4/5 of the feed plan used the same approach) and match.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit && npm run lint
npm run dev &
sleep 8
curl -s http://localhost:3000/garage-sales | grep -o '"@type":"FAQPage"'
curl -s http://localhost:3000/garage-sales | grep -o "<h1[^>]*>[^<]*</h1>"
curl -s http://localhost:3000/es/garage-sales | grep -o "Ventas de garaje en Lompoc"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/garage-sales   # expect 200, no redirect
kill %1
node -e "const en=require('./messages/en.json'),es=require('./messages/es.json');const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?f(v,p+k+'.'):[p+k]);const a=new Set(f(en)),b=new Set(f(es));const m=[...a].filter(k=>!b.has(k)).concat([...b].filter(k=>!a.has(k)));console.log(m.length?m:'parity OK');process.exit(m.length?1:0)"
```

- [ ] **Step 5: Commit**

```bash
git add "app/[locale]/(public)/garage-sales" components/garage-sales-map-section.tsx messages/en.json messages/es.json
git commit -m "feat: Garage Sales in Lompoc landing page with FAQ JSON-LD"
```

**Phase 2 ends here — controller merges, deploys, runs Google Rich Results test on /garage-sales.**

---

### Task 6: Owner SEO playbook (Phase 3 — document only, no deploy)

**Files:**
- Create: `docs/marketing/seo-playbook.md`

**Interfaces:** none (document).

- [ ] **Step 1: Write the playbook**

Create `docs/marketing/seo-playbook.md` with EXACTLY these sections (content summarized here is written out in full in the document — each step must be executable by the owner without further research):

1. **Day 1 — Google Search Console** (~20 min): create Domain property `lompoclocals.com` at search.google.com/search-console → copy TXT record → GoDaddy: My Products → lompoclocals.com → DNS → Add → Type TXT, Name `@`, Value pasted, TTL default → wait ~10 min → Verify. Then Sitemaps → add `https://www.lompoclocals.com/sitemap.xml`. Then URL Inspection → Request Indexing for `/`, `/garage-sales`, `/feed`, `/businesses`, `/blog` (one at a time; ~2 min each). Then Bing Webmaster Tools → Import from GSC.
2. **Week 1 — Profiles & citations** (~2 hrs total): Google Business Profile (business.google.com; name "Lompoc Locals"; category "Media company" primary / "Advertising agency" secondary; service-area business: Lompoc + Vandenberg Village + Mission Hills ZIPs 93436/93437/93438; website https://www.lompoclocals.com; weekly Posts habit — each week's digest doubles as a GBP post). Bing Places (bingplaces.com — import from GBP). Yelp business page, Facebook Page website-field update, Nextdoor business page. NAP consistency rule stated once: same name, same URL everywhere.
3. **Weeks 2–6 — Lompoc link circuit** (one action per week, with copy-paste templates written in full in the playbook):
   - Wk2: Lompoc Valley Chamber of Commerce membership + member-directory link.
   - Wk3: City of Lompoc + Explore Lompoc resource-page pitch (email template included in the doc).
   - Wk4: Lompoc Record / Noozhawk / KEYT press pitch (press-release template included: "free community platform built by a Lompoc local — garage sales, deals, events in one place, English and Spanish").
   - Wk5: Community Facebook groups + Nextdoor: share /garage-sales the Thursday before a busy weekend (post template included; utility-first, no spam).
   - Wk6: Ask 3 listed businesses to link "Find us on Lompoc Locals" from their sites (email template included; the badge/link points to their /biz/[slug] page).
4. **Ongoing — content cadence:** 1 blog post/week; seed list of 12 titles tied to real queries (flower festival dates, VSFB launch viewing spots, farmers market guide, best breakfast, dog-friendly, quinceañera venues, weekend guide format). Each post links internally to a category page or /garage-sales.
5. **Measurement — 10 minutes every Monday:** GSC Performance → filter queries containing "lompoc"; track 5 families (brand / garage sales / deals / restaurants / things to do) — impressions & average position into a simple table (template included). Gate for Approach B (programmatic neighborhood×category pages): ≥500 weekly impressions AND /garage-sales appearing ≤ position 50 for any garage-sale query.

- [ ] **Step 2: Commit**

```bash
git add docs/marketing/seo-playbook.md
git commit -m "docs: owner SEO playbook — GSC, GBP, citations, Lompoc link circuit, measurement"
```

- [ ] **Step 3: Walk the owner through Day 1** (controller does this in the session: present the Day-1 checklist and offer to watch/verify as they complete GSC setup).
