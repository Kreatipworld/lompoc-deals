# CX "One Platform" Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the four broken visitor promises (deal claiming, search, Spanish funnel, empty profiles), remove fake content, and add the engagement hooks that unify locals + businesses on one platform.

**Architecture:** Next.js 14 App Router + next-intl (`app/[locale]/`), Drizzle/Neon Postgres, server components + server actions. New claim view page ends the deal funnel; a shared `lib/search.ts` powers both autocomplete and the results page; a `subscribers.locale` column carries language through the email funnel.

**Tech Stack:** Next.js 14, TypeScript, Tailwind + shadcn/ui, Drizzle ORM, next-intl, Resend, date-fns, lucide-react. **No new dependencies.**

**Spec:** `docs/superpowers/specs/2026-07-02-cx-one-platform-design.md`

## Global Constraints

- This repo has **no test framework**. Verification per task = `npx tsc --noEmit` (clean) + `npm run lint` (clean) + the manual check listed in the task. Do not add a test framework.
- All page files live under `app/[locale]/…`. Links use `Link` from `@/i18n/navigation` (no locale prefix in hrefs). Server-action `redirect("/path")` paths are locale-less; middleware adds the locale.
- **EN/ES key parity is mandatory:** every key added/renamed in `messages/en.json` must be mirrored in `messages/es.json`. Current state is 1631/1631 parity — keep it.
- Copy truths (use everywhere): digest = **Saturday morning, top 10 deals**. Tiers = **Free (listing-only, 0 deals) / Growth $39.99/mo (15 deals) / Plus $99.99/mo (unlimited)**. Never write "Standard", "$19.99", or "Free includes 3 deals".
- Brand colors via tokens (`bg-primary`, `text-gold`, `bg-success`) — never hardcode hex. Keep status colors (approved/pending/rejected) and deal-card category gradients as-is.
- Never commit `.env.local`. Commit after every task.
- Work on branches: Tasks 1–6 → `feat/cx-core-loop`; Tasks 7–10 → `feat/cx-honesty`; Tasks 11–13 → `feat/cx-unify`. Open a PR per branch, in order.

---

### Task 1: Claim code helper + `getDealById` query

**Files:**
- Create: `lib/claim-code.ts`
- Modify: `lib/queries.ts` (add `getDealById` after `searchDeals`, which ends at line 181)

**Interfaces:**
- Produces: `claimCodeFor(dealId: number): string` — deterministic `LOMPOC-XXXX` code, stable across renders.
- Produces: `getDealById(id: number): Promise<DealCardData | null>` — returns the deal even if **expired** (the claim page shows an "ended" state), but only for approved businesses.

- [ ] **Step 1: Create `lib/claim-code.ts`**

```ts
/**
 * Deterministic short code shown on the claim screen. Not a security token —
 * just a stable, human-readable reference the cashier can recognize.
 */
export function claimCodeFor(dealId: number): string {
  // Knuth multiplicative hash keeps codes non-sequential but stable per deal.
  const h = (dealId * 2654435761) % 4294967296
  const code = h.toString(36).toUpperCase().padStart(4, "0").slice(-4)
  return `LOMPOC-${code}`
}
```

- [ ] **Step 2: Add `getDealById` to `lib/queries.ts`**

Insert directly after the `searchDeals` function (after line 181). It reuses the existing `baseDealSelect`, `rowToCard`, and the same joins `searchDeals` uses. Note it deliberately does **not** use `activeAndApproved` (expired deals must load), only the business-approval check:

```ts
export async function getDealById(id: number): Promise<DealCardData | null> {
  const rows = await db
    .select(baseDealSelect)
    .from(deals)
    .innerJoin(businesses, eq(deals.businessId, businesses.id))
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .leftJoin(subscriptions, eq(subscriptions.userId, businesses.ownerUserId))
    .where(and(eq(deals.id, id), eq(businesses.status, "approved")))
    .limit(1)
  return rows[0] ? rowToCard(rows[0]) : null
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add lib/claim-code.ts lib/queries.ts
git commit -m "feat: claim code helper + getDealById query"
```

---

### Task 2: Claim view page (the coupon screen)

**Files:**
- Create: `app/[locale]/(public)/deals/[id]/claim/page.tsx`
- Modify: `lib/tracking-actions.ts` (add `redeemFromClaimAction`)
- Modify: `messages/en.json`, `messages/es.json` (new `claim` namespace)

**Interfaces:**
- Consumes: `getDealById` and `claimCodeFor` from Task 1; existing `dealEvents` insert + `track()` pattern from `lib/tracking-actions.ts`.
- Produces: route `/[locale]/deals/[id]/claim` (used by Task 3's button), optionally with `?redeemed=1`.

- [ ] **Step 1: Add `redeemFromClaimAction` to `lib/tracking-actions.ts`**

Append after `trackRedeemAction` (line 45). Same tracking, then redirects back to the claim page with a confirmation flag:

```ts
export async function redeemFromClaimAction(formData: FormData) {
  const dealId = parseInt(formData.get("dealId")?.toString() ?? "0", 10)
  if (!dealId) return
  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null
  const sessionId = getSessionId()
  try {
    await Promise.all([
      db.insert(dealEvents).values({ dealId, userId, eventType: "redeem" }),
      track("deal_redeem", { userId, sessionId, targetType: "deal", targetId: dealId }),
    ])
  } catch {
    // best-effort
  }
  redirect(`/deals/${dealId}/claim?redeemed=1`)
}
```

- [ ] **Step 2: Add the `claim` namespace to both locale files**

`messages/en.json` (top level):

```json
"claim": {
  "metaTitle": "Your deal — Lompoc Locals",
  "showAtRegister": "Show this screen at the register",
  "code": "Deal code",
  "expires": "Expires {distance}",
  "usedIt": "I used this deal",
  "usedConfirmed": "Nice! Marked as used — enjoy.",
  "endedTitle": "This deal has ended",
  "endedBody": "It's no longer redeemable, but the business may have new offers.",
  "notFoundTitle": "Deal not found",
  "notFoundBody": "This deal may have been removed.",
  "viewBusiness": "View {name}",
  "browseDeals": "Browse current deals"
}
```

`messages/es.json` (same keys):

```json
"claim": {
  "metaTitle": "Tu oferta — Lompoc Locals",
  "showAtRegister": "Muestra esta pantalla en la caja",
  "code": "Código de oferta",
  "expires": "Vence {distance}",
  "usedIt": "Usé esta oferta",
  "usedConfirmed": "¡Listo! Marcada como usada — que la disfrutes.",
  "endedTitle": "Esta oferta ha terminado",
  "endedBody": "Ya no se puede canjear, pero el negocio puede tener nuevas ofertas.",
  "notFoundTitle": "Oferta no encontrada",
  "notFoundBody": "Es posible que esta oferta haya sido eliminada.",
  "viewBusiness": "Ver {name}",
  "browseDeals": "Ver ofertas actuales"
}
```

- [ ] **Step 3: Create `app/[locale]/(public)/deals/[id]/claim/page.tsx`**

```tsx
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { isPast, formatDistanceToNowStrict } from "date-fns"
import { MapPin, Phone, Clock, FileText, CheckCircle2, Ticket } from "lucide-react"
import { getDealById } from "@/lib/queries"
import { claimCodeFor } from "@/lib/claim-code"
import { redeemFromClaimAction } from "@/lib/tracking-actions"

export async function generateMetadata() {
  const t = await getTranslations("claim")
  return { title: t("metaTitle") }
}

export default async function ClaimPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>
  searchParams: { redeemed?: string }
}) {
  const { id } = await params
  const t = await getTranslations("claim")
  const dealId = parseInt(id, 10)
  const deal = Number.isFinite(dealId) ? await getDealById(dealId) : null

  if (!deal) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">{t("notFoundTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("notFoundBody")}</p>
        <Link href="/deals" className="mt-6 inline-block text-sm font-semibold text-primary underline">
          {t("browseDeals")}
        </Link>
      </div>
    )
  }

  if (isPast(deal.expiresAt)) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">{t("endedTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("endedBody")}</p>
        <Link
          href={`/biz/${deal.business.slug}`}
          className="mt-6 inline-block text-sm font-semibold text-primary underline"
        >
          {t("viewBusiness", { name: deal.business.name })}
        </Link>
      </div>
    )
  }

  const redeemed = searchParams.redeemed === "1"

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="overflow-hidden rounded-3xl border-2 border-primary/20 bg-card shadow-lg">
        {/* Business header */}
        <div className="border-b bg-primary/5 px-6 py-4 text-center">
          <Link
            href={`/biz/${deal.business.slug}`}
            className="font-display text-lg font-semibold text-primary hover:underline"
          >
            {deal.business.name}
          </Link>
          {deal.business.address && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {deal.business.address}
            </p>
          )}
        </div>

        {/* Deal body */}
        <div className="px-6 py-6 text-center">
          {deal.discountText && (
            <p className="font-display text-4xl font-extrabold tracking-tight text-primary">
              {deal.discountText}
            </p>
          )}
          <h1 className="mt-2 font-display text-xl font-semibold leading-snug">{deal.title}</h1>
          {deal.description && (
            <p className="mt-2 text-sm text-muted-foreground">{deal.description}</p>
          )}

          {/* The code */}
          <div className="mx-auto mt-6 w-fit rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-8 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {t("code")}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-foreground">
              {claimCodeFor(deal.id)}
            </p>
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Ticket className="h-4 w-4 text-primary" /> {t("showAtRegister")}
          </p>

          {/* Meta */}
          <div className="mt-5 space-y-1 text-xs text-muted-foreground">
            <p className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("expires", { distance: formatDistanceToNowStrict(deal.expiresAt) })}
            </p>
            {deal.terms && (
              <p className="flex items-center justify-center gap-1 italic">
                <FileText className="h-3 w-3 shrink-0" /> {deal.terms}
              </p>
            )}
            {deal.business.phone && (
              <a
                href={`tel:${deal.business.phone}`}
                className="inline-flex items-center gap-1 hover:text-primary"
              >
                <Phone className="h-3 w-3" /> {deal.business.phone}
              </a>
            )}
          </div>
        </div>

        {/* Redeem confirmation */}
        <div className="border-t bg-muted/30 px-6 py-4">
          {redeemed ? (
            <p className="inline-flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" /> {t("usedConfirmed")}
            </p>
          ) : (
            <form action={redeemFromClaimAction}>
              <input type="hidden" name="dealId" value={deal.id} />
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center rounded-full border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {t("usedIt")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. Then `npm run dev` and open `http://localhost:3000/en/deals/<any-active-deal-id>/claim` — coupon renders with code; `?redeemed=1` shows the confirmation line; a bogus id shows "Deal not found".

- [ ] **Step 5: Commit**

```bash
git add "app/[locale]/(public)/deals" lib/tracking-actions.ts messages/en.json messages/es.json
git commit -m "feat: deal claim view — coupon screen with code, redeem confirmation"
```

---

### Task 3: Point "Claim deal" at the claim view; remove dead-end buttons

**Files:**
- Modify: `components/deal-card.tsx` (both variants: CTA forms at lines 219–234 and 399–423)
- Modify: `messages/en.json`, `messages/es.json` (`dealCard.getDeal` value; delete `dealCard.markRedeemed`)

**Interfaces:**
- Consumes: route `/deals/[id]/claim` from Task 2. The existing `trackClaimAction` form pattern stays (it records the claim, then redirects) — only the `redirectTo` destination changes.

- [ ] **Step 1: Update the CTA in BOTH variants of `components/deal-card.tsx`**

In the tripadvisor variant (lines 219–234) and the default variant (lines 399–413), change the hidden `redirectTo` input from:

```tsx
<input
  type="hidden"
  name="redirectTo"
  value={`/api/track/click?dealId=${deal.id}&to=/biz/${deal.business.slug}`}
/>
```

to:

```tsx
<input type="hidden" name="redirectTo" value={`/deals/${deal.id}/claim`} />
```

- [ ] **Step 2: Remove the "Mark as Redeemed" form from the default variant**

Delete lines 414–423 (the entire `<form action={trackRedeemAction}>…</form>` block) and change the surrounding wrapper `<div className="mt-1 flex flex-col gap-2">` back to a single-child container: `<div className="mt-1">`. Remove the now-unused `trackRedeemAction` import at line 18 (keep `trackClaimAction`).

- [ ] **Step 3: Rename the verb in both locale files**

- `messages/en.json` → `"getDeal": "Claim deal"`; delete the `"markRedeemed"` key.
- `messages/es.json` → `"getDeal": "Reclamar oferta"`; delete `"markRedeemed"`.
- Grep for other uses first: `grep -rn "markRedeemed" app/ components/` — if any other file uses it, remove that usage too (expected: none).
- Check verb consistency: `grep -n '"Get Deal"\|Get Deal' messages/en.json` and update any How-It-Works/FAQ copy that says "Get Deal" to "Claim" phrasing so the homepage instructions match the button.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. In `npm run dev`, click "Claim deal" on any homepage/deals card → lands on the coupon screen (not the business page). Business profile deal cards no longer show a circular button.

- [ ] **Step 5: Commit**

```bash
git add components/deal-card.tsx messages/en.json messages/es.json
git commit -m "feat: Claim deal CTA opens the coupon screen; drop dead-end redeem button"
```

---

### Task 4: Unified search (businesses + categories + deals)

**Files:**
- Create: `lib/search.ts`
- Modify: `app/api/search/autocomplete/route.ts` (import shared synonyms instead of local copy)
- Modify: `app/[locale]/(public)/search/page.tsx` (sectioned results; fire-and-forget tracking, line 43)
- Modify: `messages/en.json`, `messages/es.json` (`search` namespace additions)

**Interfaces:**
- Produces: `CATEGORY_SYNONYMS: Record<string, string[]>` and `searchAll(q: string): Promise<SearchResults>` where `SearchResults = { businesses: BizHit[]; categories: CategoryHit[]; deals: DealCardData[] }`, `BizHit = { id: number; name: string; slug: string; logoUrl: string | null; categoryName: string | null; description: string | null }`, `CategoryHit = { name: string; slug: string; count: number }`.
- Consumes: `searchDeals` from `lib/queries.ts:157`.

- [ ] **Step 1: Create `lib/search.ts`**

Move `CATEGORY_SYNONYMS` out of the autocomplete route (lines 13–46) verbatim, then **extend each entry with Spanish keywords** (the current map is English-only). Add these to the existing arrays: `food-drink`: `"comida", "restaurante", "cena", "almuerzo", "desayuno", "café", "panadería", "cerveza"`; `wineries`: `"vino", "viñedo", "cata"`; `retail`: `"tienda", "ropa", "regalos", "flores"`; `health-beauty`: `"belleza", "pelo", "corte", "uñas", "masaje", "gimnasio"`; `auto`: `"carro", "coche", "llantas", "mecánico", "taller"`; `services`: `"servicio", "plomero", "electricista", "limpieza", "abogado", "seguro"`; `entertainment`: `"cine", "diversión", "música", "eventos"`; `dispensaries`: `"hierba", "cannabis"`; `real-estate`: `"casa", "renta", "bienes raíces", "departamento"`.

Then add the shared query function (same matching logic the autocomplete route uses at lines 87–128, with larger limits):

```ts
import { db } from "@/db/client"
import { businesses, categories } from "@/db/schema"
import { and, eq, ilike, or, sql } from "drizzle-orm"
import { searchDeals, type DealCardData } from "@/lib/queries"

export const CATEGORY_SYNONYMS: Record<string, string[]> = {
  /* moved + extended map here */
}

export type CategoryHit = { name: string; slug: string; count: number }
export type BizHit = {
  id: number
  name: string
  slug: string
  logoUrl: string | null
  categoryName: string | null
  description: string | null
}
export type SearchResults = {
  businesses: BizHit[]
  categories: CategoryHit[]
  deals: DealCardData[]
}

export function matchedCategorySlugs(q: string): Set<string> {
  const lower = q.toLowerCase()
  const matched = new Set<string>()
  for (const [slug, words] of Object.entries(CATEGORY_SYNONYMS)) {
    if (words.some((w) => w.includes(lower) || lower.includes(w))) matched.add(slug)
  }
  return matched
}

export async function searchAll(q: string): Promise<SearchResults> {
  const term = `%${q}%`
  const lower = q.toLowerCase()
  const synonymSlugs = matchedCategorySlugs(q)

  const catRows = await db
    .select({
      name: categories.name,
      slug: categories.slug,
      count: sql<number>`count(${businesses.id})`,
    })
    .from(categories)
    .leftJoin(
      businesses,
      and(eq(businesses.categoryId, categories.id), eq(businesses.status, "approved"))
    )
    .groupBy(categories.id)

  const categoryHits = catRows
    .map((r) => ({ ...r, count: Number(r.count) }))
    .filter(
      (c) =>
        c.count > 0 &&
        (c.name.toLowerCase().includes(lower) || synonymSlugs.has(c.slug))
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const synonymSlugList = [...synonymSlugs]
  const [bizRows, deals] = await Promise.all([
    db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        logoUrl: businesses.logoUrl,
        categoryName: categories.name,
        description: businesses.description,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(
        and(
          eq(businesses.status, "approved"),
          or(
            ilike(businesses.name, term),
            ilike(categories.name, term),
            ilike(businesses.description, term),
            ilike(businesses.about, term),
            // Synonym hits: "haircut" should surface salons, not nothing.
            synonymSlugList.length > 0
              ? sql`${categories.slug} in ${synonymSlugList}`
              : sql`false`
          )
        )
      )
      .orderBy(sql`case when ${businesses.name} ilike ${term} then 0 else 1 end`)
      .limit(24),
    searchDeals(q),
  ])

  return { businesses: bizRows, categories: categoryHits, deals }
}
```

Note on the `in` clause: if `sql\`${categories.slug} in ${synonymSlugList}\`` doesn't compile with the project's drizzle version, use `inArray(categories.slug, synonymSlugList)` from `drizzle-orm` instead (guarded by the length check, e.g. build the `or(...)` args array conditionally).

- [ ] **Step 2: Update `app/api/search/autocomplete/route.ts`**

Delete its local `CATEGORY_SYNONYMS` (lines 8–46) and import instead: `import { CATEGORY_SYNONYMS } from "@/lib/search"`. Behavior unchanged (it picks up the Spanish synonyms for free).

- [ ] **Step 3: Rewrite the results section of `app/[locale]/(public)/search/page.tsx`**

Replace `searchDeals` usage (lines 2, 34–39) with `searchAll`; make tracking fire-and-forget; render three sections. Full replacement for the data + results parts:

```tsx
import { searchAll } from "@/lib/search"
// remove: import { searchDeals } from "@/lib/queries"
// keep all other imports; add: import { SafeImage } from "@/components/safe-image"
// add: import { Store, ArrowRight } from "lucide-react"; keep MapPin
// add: import { Link } from "@/i18n/navigation"
```

Data fetch:

```tsx
const q = (searchParams.q ?? "").trim()
const [results, viewer] = await Promise.all([
  q ? searchAll(q) : Promise.resolve({ businesses: [], categories: [], deals: [] }),
  getViewer(),
])
const count = results.businesses.length + results.categories.length + results.deals.length

if (q) {
  const sid = getSessionId()
  // Fire-and-forget: never block render on analytics.
  void track("search_run", {
    userId: viewer?.userId ?? null,
    sessionId: sid,
    targetType: "search",
    targetId: null,
    props: { query: q, resultCount: count, locale: locale as "en" | "es" },
  })
}
```

Results JSX (replaces the current `<DealGrid …/>` block inside the `q ? …` branch; keep the `resultsFor` line, using the new combined `count`):

```tsx
{results.categories.length > 0 && (
  <div className="mb-8">
    <h2 className="mb-3 font-display text-lg font-semibold">{t("sectionCategories")}</h2>
    <div className="flex flex-wrap gap-2">
      {results.categories.map((c) => (
        <Link
          key={c.slug}
          href={`/category/${c.slug}`}
          className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
        >
          {c.name}
          <span className="text-xs text-muted-foreground">({c.count})</span>
        </Link>
      ))}
    </div>
  </div>
)}

{results.businesses.length > 0 && (
  <div className="mb-8">
    <h2 className="mb-3 font-display text-lg font-semibold">{t("sectionBusinesses")}</h2>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {results.businesses.map((b) => (
        <Link
          key={b.id}
          href={`/biz/${b.slug}`}
          className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-shadow hover:shadow-md"
        >
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            <SafeImage
              src={b.logoUrl ?? undefined}
              alt={b.name}
              className="h-full w-full object-cover"
              fallback={
                <div className="flex h-full w-full items-center justify-center">
                  <Store className="h-5 w-5 text-muted-foreground/50" />
                </div>
              }
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold group-hover:text-primary">{b.name}</p>
            {b.categoryName && (
              <p className="truncate text-xs text-muted-foreground">{b.categoryName}</p>
            )}
          </div>
          <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50 group-hover:text-primary" />
        </Link>
      ))}
    </div>
  </div>
)}

{results.deals.length > 0 && (
  <div>
    <h2 className="mb-3 font-display text-lg font-semibold">{t("sectionDeals")}</h2>
    <DealGrid
      deals={results.deals}
      viewer={viewer}
      fromPath={`/search?q=${encodeURIComponent(q)}`}
      variant="tripadvisor"
    />
  </div>
)}

{count === 0 && (
  <p className="text-sm text-muted-foreground">{t("noResults")}</p>
)}
```

Important: only render the `DealGrid` block when `results.deals.length > 0` (its built-in empty state would otherwise say "No deals yet" under populated business results). Check the existing `search` namespace for a `noResults`-equivalent key first and reuse it if present.

- [ ] **Step 4: Add `search` namespace keys**

`messages/en.json`: `"sectionCategories": "Categories"`, `"sectionBusinesses": "Businesses"`, `"sectionDeals": "Deals"`, and `"noResults": "Nothing matched — try a different word, like a cuisine or a service."` (skip `noResults` if an equivalent exists).
`messages/es.json`: `"sectionCategories": "Categorías"`, `"sectionBusinesses": "Negocios"`, `"sectionDeals": "Ofertas"`, `"noResults": "No hubo coincidencias — prueba otra palabra, como un tipo de comida o servicio."`

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run lint` → clean.
In dev: `/en/search?q=pizza` shows business results (not "0 results"); `/en/search?q=haircut` surfaces the health-beauty category + salons; `/es/search?q=comida` surfaces food-drink via the Spanish synonyms; garbage query shows the friendly empty state.

- [ ] **Step 6: Commit**

```bash
git add lib/search.ts app/api/search/autocomplete/route.ts "app/[locale]/(public)/search/page.tsx" messages/en.json messages/es.json
git commit -m "feat: unified search — businesses, categories, and deals with ES synonyms"
```

---

### Task 5: Spanish funnel end-to-end (`subscribers.locale`)

**Files:**
- Modify: `db/schema.ts` (subscribers table, lines 464–474)
- Create: migration via drizzle-kit
- Modify: `lib/subscribe-actions.ts` (capture locale; localize return strings)
- Modify: `app/api/cron/digest/route.ts` (line 84–90: use stored locale)
- Modify: `app/[locale]/(public)/subscribe/confirm/page.tsx` (full i18n)
- Modify: `messages/en.json`, `messages/es.json` (`subscribe` namespace additions)

**Interfaces:**
- Produces: `subscribers.locale` column (`varchar(5)`, not null, default `'en'`).
- Consumes: `sendConfirmationEmail(email, token, locale)` and `sendDigestEmail(email, token, deals, locale)` — both already accept `"en" | "es"` and already have Spanish templates; only the callers are broken.

- [ ] **Step 1: Add the column to `db/schema.ts`**

In the `subscribers` table (line 464), after `email`:

```ts
locale: varchar("locale", { length: 5 }).notNull().default("en"),
```

- [ ] **Step 2: Generate and apply the migration**

Check `package.json` scripts for the project's drizzle commands (`grep -n "drizzle" package.json`). Typical: `npx drizzle-kit generate` then `npx drizzle-kit migrate` (or the repo's `npm run db:generate` / `db:migrate` equivalents). The generated SQL must be exactly `ALTER TABLE "subscribers" ADD COLUMN "locale" varchar(5) DEFAULT 'en' NOT NULL;` — inspect the new file in `db/migrations/` before applying.

- [ ] **Step 3: Capture locale in `lib/subscribe-actions.ts`**

Add import: `import { getLocale, getTranslations } from "next-intl/server"`. In `subscribeAction`:

```ts
const rawLocale = await getLocale()
const locale: "en" | "es" = rawLocale === "es" ? "es" : "en"
const t = await getTranslations("subscribe")
```

- Insert (line 49): `values({ email, unsubscribeToken: token, locale })`.
- For an existing unconfirmed subscriber, update their stored locale so re-subscribing in Spanish sticks: `await db.update(subscribers).set({ locale }).where(eq(subscribers.id, existing.id))`.
- Line 64: `sendConfirmationEmail(email, token, locale)` (delete the TODO comment).
- Replace the four hardcoded English return strings with translations: `{ success: t("alreadySubscribed") }`, `{ success: t("emailNotConfigured") }`, `{ success: t("checkInbox") }`, and the zod fallback `{ error: t("invalidEmail") }`.

- [ ] **Step 4: Use stored locale in the digest cron**

`app/api/cron/digest/route.ts` lines 83–90 — replace the TODO + hardcoded `"en"`:

```ts
for (const sub of confirmedSubs) {
  const locale: "en" | "es" = sub.locale === "es" ? "es" : "en"
  const result = await sendDigestEmail(sub.email, sub.unsubscribeToken, digestDeals, locale)
  if (result.ok) sent++
  else failed++
}
```

- [ ] **Step 5: i18n the confirm page**

Rewrite the body of `app/[locale]/(public)/subscribe/confirm/page.tsx` (currently hardcoded English at lines 21–44):

```tsx
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const t = await getTranslations("subscribe")
  const token = searchParams.token ?? ""
  const result = token
    ? await confirmSubscriptionByToken(token)
    : { ok: false as const, message: "missing-token" }

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      {result.ok ? (
        <>
          <h1 className="text-2xl font-bold">{t("confirmedTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("confirmedBody", { email: result.email })}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">{t("confirmFailedTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("confirmFailedBody")}</p>
        </>
      )}
      <Link href="/" className="mt-6 inline-block text-sm underline">
        {t("backHome")}
      </Link>
    </div>
  )
}
```

- [ ] **Step 6: Add the new `subscribe` keys to both locales**

`en.json`: `"confirmedTitle": "You're subscribed"`, `"confirmedBody": "We'll send the next digest to {email} on Saturday morning."`, `"confirmFailedTitle": "Couldn't confirm"`, `"confirmFailedBody": "That link is invalid or expired — try subscribing again."`, `"backHome": "Back to Lompoc Locals"`, `"alreadySubscribed": "You're already subscribed. Thanks!"`, `"checkInbox": "Check your inbox for a confirmation link. Click it to start receiving the weekly digest."`, `"emailNotConfigured": "Thanks! Your address is saved — confirmation email will arrive once email sending is enabled."`, `"invalidEmail": "Enter a valid email"`.
`es.json`: `"confirmedTitle": "¡Ya estás suscrito!"`, `"confirmedBody": "Enviaremos el próximo resumen a {email} el sábado por la mañana."`, `"confirmFailedTitle": "No se pudo confirmar"`, `"confirmFailedBody": "Ese enlace es inválido o venció — intenta suscribirte de nuevo."`, `"backHome": "Volver a Lompoc Locals"`, `"alreadySubscribed": "Ya estás suscrito. ¡Gracias!"`, `"checkInbox": "Revisa tu correo y haz clic en el enlace de confirmación para empezar a recibir el resumen semanal."`, `"emailNotConfigured": "¡Gracias! Guardamos tu correo — la confirmación llegará cuando el envío de correos esté habilitado."`, `"invalidEmail": "Ingresa un correo válido"`.

(While here — Task 8 fixes `subscribe.subtitle`/`successSubtitle` Sunday→Saturday; don't duplicate that change.)

- [ ] **Step 7: Verify**

`npx tsc --noEmit && npm run lint` → clean. In dev, submit the subscribe form on `/es/subscribe` → success message is Spanish; DB row has `locale='es'` (`SELECT email, locale FROM subscribers ORDER BY id DESC LIMIT 1`); `/es/subscribe/confirm?token=<their token>` renders Spanish.

- [ ] **Step 8: Commit**

```bash
git add db/ lib/subscribe-actions.ts app/api/cron/digest/route.ts "app/[locale]/(public)/subscribe/confirm/page.tsx" messages/en.json messages/es.json
git commit -m "feat: Spanish funnel end-to-end — subscribers.locale drives emails and confirm page"
```

---

### Task 6: Profiles that never look abandoned

**Files:**
- Modify: `app/[locale]/(public)/biz/[slug]/page.tsx` (empty-deal section ~331–350; claim CTA 310–314; directions chip 268–281; hours sidebar; translated Follow labels 243–247)
- Modify: `components/business-hours.tsx` (no-hours fallback, lines 21–22)
- Modify: `components/follow-business-button.tsx` (labels via props, lines 23–33)
- Modify: `messages/en.json`, `messages/es.json` (`businesses.profile` additions)

**Interfaces:**
- Produces: `FollowBusinessButton` gains a required `labels: { follow: string; following: string }` prop.
- Produces: `BusinessHours` gains an optional `phone?: string | null` prop.

- [ ] **Step 1: Follow button labels via props**

`components/follow-business-button.tsx` — thread labels through (the component is a client component and can't call server translations):

```tsx
function FollowButtonInner({
  isFollowing,
  labels,
}: {
  isFollowing: boolean
  labels: { follow: string; following: string }
}) {
  // …unchanged wrapper; replace the hardcoded text:
  {isFollowing ? (
    <><BellOff className="h-3.5 w-3.5" />{labels.following}</>
  ) : (
    <><Bell className="h-3.5 w-3.5" />{labels.follow}</>
  )}
}

export function FollowBusinessButton({
  businessId,
  slug,
  isFollowing,
  labels,
}: {
  businessId: number
  slug: string
  isFollowing: boolean
  labels: { follow: string; following: string }
}) {
  return (
    <form action={toggleFollowBusinessAction}>
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="slug" value={slug} />
      <FollowButtonInner isFollowing={isFollowing} labels={labels} />
    </form>
  )
}
```

In `biz/[slug]/page.tsx` (line 243), pass `labels={{ follow: t("follow"), following: t("following") }}`. Add keys under `businesses.profile`: EN `"follow": "Follow"`, `"following": "Following"`; ES `"follow": "Seguir"`, `"following": "Siguiendo"`. Grep for other `FollowBusinessButton` usages (`grep -rn "FollowBusinessButton" app/ components/`) and pass labels there too.

- [ ] **Step 2: Zero-deal empty state → follow prompt**

In `biz/[slug]/page.tsx`, the non-real-estate branch (lines 341–349): when `deals.length === 0`, render a compact prompt instead of `DealGrid`'s big dashed box, and also **hide the section header** ("Active Deals / From {name}") in that case:

```tsx
{isRealEstate ? (
  <PropertyListingGrid listings={listings} />
) : deals.length > 0 ? (
  <>{/* existing header div moves inside this branch */}
    <DealGrid deals={deals} viewer={viewer} fromPath={`/biz/${params.slug}`} />
  </>
) : (
  <div className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="font-display text-base font-semibold">{t("noDealsYetTitle")}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{t("noDealsYetBody")}</p>
    </div>
    {viewer.isLocal && (
      <FollowBusinessButton
        businessId={business.id}
        slug={params.slug}
        isFollowing={viewer.followedBusinessIds.has(business.id)}
        labels={{ follow: t("follow"), following: t("following") }}
      />
    )}
  </div>
)}
```

Restructure so the header `<div className="mb-6 flex items-end justify-between">…</div>` (lines 333–340) only renders when `isRealEstate || deals.length > 0`. Keys (`businesses.profile`): EN `"noDealsYetTitle": "No deals right now"`, `"noDealsYetBody": "Follow {name} to hear about their next offer first."` (pass `{ name: business.name }`); ES `"noDealsYetTitle": "No hay ofertas por ahora"`, `"noDealsYetBody": "Sigue a {name} para enterarte primero de su próxima oferta."`

- [ ] **Step 3: Move the claim banner to the bottom**

Cut the `{isUnclaimed && (…BusinessClaimCta…)}` section (lines 310–314) and paste it after the closing `</section>` of the 2-column body (after the sidebar), before any "more in category" row — so unclaimed profiles lead with content, not a lock.

- [ ] **Step 4: Labeled "Get directions" + hours fallback**

In the contact chips block (lines 268–281), keep the address chip and add a second, visually primary chip right after it (same `business.address` guard):

```tsx
<a
  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address)}`}
  target="_blank"
  rel="noreferrer"
  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
>
  <Navigation className="h-3.5 w-3.5" />
  {t("getDirections")}
</a>
```

Add `Navigation` to the page's lucide imports. Keys: EN `"getDirections": "Get directions"`; ES `"getDirections": "Cómo llegar"`.

`components/business-hours.tsx` — replace the `return null` (lines 21–22) with a fallback card (add optional `phone` prop, passed from the biz page sidebar where `<BusinessHours hoursJson={…}/>` is rendered — add `phone={business.phone}`):

```tsx
if (!anyDay)
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {t("hours")}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {phone ? t("hoursUnknownCall") : t("hoursUnknown")}
      </p>
      {phone && (
        <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="mt-1 inline-block text-sm font-semibold text-primary hover:underline">
          {phone}
        </a>
      )}
    </div>
  )
```

Keys (`businesses.profile`): EN `"hoursUnknown": "Hours not listed."`, `"hoursUnknownCall": "Hours not listed — call to confirm:"`; ES `"hoursUnknown": "Horario no disponible."`, `"hoursUnknownCall": "Horario no disponible — llama para confirmar:"`

- [ ] **Step 5: Verify**

`npx tsc --noEmit && npm run lint` → clean. In dev, open a scraped zero-deal profile (e.g. `/en/biz/chow-ya`): no dashed empty box, follow prompt instead (logged-out: just the message), claim banner at the bottom, "Get directions" chip present, hours card shows the call-to-confirm fallback. `/es/biz/<slug>`: Follow button and all new strings in Spanish.

- [ ] **Step 6: Commit + PR**

```bash
git add "app/[locale]/(public)/biz" components/business-hours.tsx components/follow-business-button.tsx messages/en.json messages/es.json
git commit -m "feat: profiles never look abandoned — follow prompt, directions, hours fallback, claim banner demoted"
git push -u origin feat/cx-core-loop
gh pr create --title "CX phase 1: fix the core visitor loop" --body "Claim screen ends the deal funnel; unified search; Spanish funnel end-to-end; profiles de-emptified. Per docs/superpowers/specs/2026-07-02-cx-one-platform-design.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

### Task 7: Digest section honesty (branch `feat/cx-honesty` off main after PR 1 merges)

**Files:**
- Modify: `components/deals-digest.tsx`
- Modify: `messages/en.json`, `messages/es.json` (`dealsDigest` namespace cleanup)

- [ ] **Step 1: Remove fake sponsors and empty ad slots**

In `components/deals-digest.tsx`: delete the `SponsorCard` component (lines 33–43), the `AdSlot` element (lines 19–31), both `<aside>` rails (lines 85–88 and 135–138), and the footer `{FeatureBanner}` (line 142). Keep exactly one `FeatureBanner` (line 80, above the grid) — that's the single honest "Sponsor this digest" CTA. Remove now-unused imports (`Megaphone` stays — FeatureBanner uses it).

- [ ] **Step 2: Repoint the banner copy at sponsorship**

Update `dealsDigest` keys in both locales: EN `"featureTitle": "Sponsor this digest"`, `"featureBody": "Put your business in front of Lompoc locals every week — on this page and in the Saturday email."`, `"featureCta": "See sponsor options"`. ES `"featureTitle": "Patrocina este resumen"`, `"featureBody": "Pon tu negocio frente a los vecinos de Lompoc cada semana — en esta página y en el correo del sábado."`, `"featureCta": "Ver opciones"`. Delete the now-unused keys from BOTH locales: `adSpace`, `yourAdHere`, `adPitch`, `claimSpot`, `sponsored`, `sponsorDentalName`, `sponsorDentalPitch`, `sponsorDentalCta`, `sponsorRealtyName`, `sponsorRealtyPitch`, `sponsorRealtyCta` (grep first to confirm nothing else uses them).

- [ ] **Step 3: Verify + commit**

`npx tsc --noEmit && npm run lint` → clean. Homepage digest shows: one sponsor CTA banner, featured deal, deal grid — no fake brands, no dashed ad boxes.

```bash
git add components/deals-digest.tsx messages/en.json messages/es.json
git commit -m "fix: remove fake sponsors and empty ad slots; one honest sponsor CTA"
```

---

### Task 8: Copy truth pass + hide testimonials + SSR counters

**Files:**
- Modify: `app/[locale]/(public)/page.tsx` (testimonials section ~430–490)
- Modify: `components/animated-counter.tsx` (line 22)
- Modify: `messages/en.json`, `messages/es.json`

- [ ] **Step 1: Hide the testimonials section**

In `app/[locale]/(public)/page.tsx`, delete the whole "What Lompoc Says" section JSX (the block using `t("testimonials.*")`, roughly lines 430–490 — find exact bounds with `grep -n "testimonials" "app/[locale]/(public)/page.tsx"`). Leave the `testimonials.*` keys in the locale files (cheap re-add later; parity maintained since both keep them).

- [ ] **Step 2: Counters render real values on first paint**

`components/animated-counter.tsx` line 22 — change `useState(0)` to `useState(value)`. The animation still counts 0→value when the observer fires (the `obj = { val: 0 }` start is unchanged), but SSR/no-JS/crawlers now see the real number instead of "0 active deals".

- [ ] **Step 3: Copy truth sweep in BOTH locale files**

Work through this checklist with grep; every EN change gets its ES mirror:
1. `subscribe.subtitle`: "Every Sunday…" → "Every Saturday, the best deals from Lompoc delivered to your inbox." / ES "Cada sábado…".
2. `subscribe.successSubtitle`: "…next Sunday." → "…Saturday morning." / ES "…el sábado por la mañana."
3. `grep -n "Tuesday\|martes" messages/*.json` — homepage FAQ digest answer → Saturday morning, top 10 (ES: sábado).
4. `grep -n "top 5\|las 5\|5 mejores" messages/*.json` → top 10.
5. `grep -n "19\.99" messages/*.json` — 4 hits per file. Rewrite each to the real tiers: FAQ `a4` → "Our Free plan is $0 forever — your business listed with hours, photos, and contact info. Growth is $39.99/month and unlocks deals (up to 15 active), analytics, and priority placement."; `upgradeBody` → "Analytics, social links, and up to 15 active deals for $39.99/mo"; `upgradeStandard` → "Upgrade to Growth — $39.99/mo"; the plan-description line → "Growth ($39.99/month) — Enhanced listing with up to 15 active deals, priority placement, and analytics." Mirror all in ES (plan name stays "Growth").
6. `grep -n "3 deals\|3 ofertas" messages/*.json` — Free-tier claims → listing-only wording (Free has 0 deals).
7. `grep -n "Standard\|Estándar" messages/*.json` — any remaining tier-name references → Growth.
8. `grep -rn "474\|470" messages/*.json app/` — unify hardcoded business counts to "470+" (or delete the number if the sentence works without it).
9. `subscribePage.testimonial1Quote` in both files: restore the amount — EN "I saved over $40 last month…" / ES "Ahorré más de $40 el mes pasado…" (fix the double space).

- [ ] **Step 4: Verify + commit**

`npx tsc --noEmit && npm run lint` → clean. `grep -rn "19\.99\|Sunday\|domingo" messages/` → no digest/pricing hits remain (ignore unrelated matches like business hours copy, if any). Homepage: no testimonials section; view-source shows real counter numbers.

```bash
git add "app/[locale]/(public)/page.tsx" components/animated-counter.tsx messages/en.json messages/es.json
git commit -m "fix: copy truth pass — Saturday digest, real tier pricing, hide placeholder testimonials, SSR counters"
```

---

### Task 9: Reslug demo businesses + redirects

**Files:**
- Create: `scripts/reslug-demo-businesses.ts`
- Modify: `app/[locale]/(public)/biz/[slug]/page.tsx` (not-found path)

**Interfaces:**
- Produces: no `businesses.slug` starts with `demo-`; old `/biz/demo-*` URLs permanently redirect.

- [ ] **Step 1: Write the reslug script**

Model the boilerplate (db client import, env loading, run pattern) on an existing script in `scripts/` (e.g. whichever `seed-demo-deals.ts` uses — check with `ls scripts/ | head` and copy its header):

```ts
import { db } from "@/db/client"
import { businesses } from "@/db/schema"
import { eq, like } from "drizzle-orm"

async function main() {
  const demos = await db.select({ id: businesses.id, slug: businesses.slug })
    .from(businesses)
    .where(like(businesses.slug, "demo-%"))

  for (const b of demos) {
    const base = b.slug.replace(/^demo-/, "")
    const clash = await db.select({ id: businesses.id }).from(businesses)
      .where(eq(businesses.slug, base))
    const next = clash.length > 0 ? `${base}-lompoc` : base
    await db.update(businesses).set({ slug: next }).where(eq(businesses.id, b.id))
    console.log(`${b.slug} -> ${next}${clash.length > 0 ? "  (collision, suffixed)" : ""}`)
  }
  console.log(`Reslugged ${demos.length} businesses.`)
}

main().then(() => process.exit(0))
```

Run it the same way existing scripts run (check `package.json` for a `tsx`/`ts-node` pattern, e.g. `npx tsx scripts/reslug-demo-businesses.ts` with `.env.local` loaded — copy the exact invocation used by other scripts, e.g. `npx dotenv -e .env.local -- npx tsx …` if that's the house style).

- [ ] **Step 2: Redirect old URLs in the biz page**

In `biz/[slug]/page.tsx`, at the point where the business lookup fails (find the existing `notFound()` call near the top of the default export), insert before it:

```tsx
if (params.slug.startsWith("demo-")) {
  permanentRedirect(`/biz/${params.slug.replace(/^demo-/, "")}`)
}
```

Import: `import { permanentRedirect } from "next/navigation"`. (Locale-less path is fine — middleware re-adds the locale. If the retried slug also doesn't exist, the redirected request falls through to `notFound()` normally.)

- [ ] **Step 3: Run the script against production DB, verify, commit**

Run the script (production `DATABASE_URL` — confirm row count printed matches the number of `demo-` businesses first with a `SELECT count(*) FROM businesses WHERE slug LIKE 'demo-%'`). Verify in dev: `/en/biz/demo-florianos-pizzeria` → 308 to `/en/biz/florianos-pizzeria` which renders; deals feed links show clean slugs.

```bash
git add scripts/reslug-demo-businesses.ts "app/[locale]/(public)/biz/[slug]/page.tsx"
git commit -m "fix: strip demo- slugs with permanent redirects"
git push -u origin feat/cx-honesty
gh pr create --title "CX phase 2: honesty pass" --body "Fake sponsors/ad slots removed, testimonials hidden until real, copy truth pass (Saturday digest, real tier pricing), demo slugs reslugged with redirects. Per docs/superpowers/specs/2026-07-02-cx-one-platform-design.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

### Task 10: Logged-out favorite/follow hooks (branch `feat/cx-unify` off main after PR 2 merges)

**Files:**
- Modify: `components/deal-card.tsx` (heart gates at lines ~124 and ~312)
- Modify: `app/[locale]/(public)/biz/[slug]/page.tsx` (follow gate at lines 240–249, plus Task 6's zero-deal prompt)
- Modify: `messages/en.json`, `messages/es.json`

**Interfaces:**
- Consumes: the login page's `redirectTo` support — verify first with `grep -n "redirectTo" "app/[locale]/(auth)/login/page.tsx"`. If the param is named differently (e.g. `callbackUrl`), use that name in the hrefs below.

- [ ] **Step 1: Deal-card heart for logged-out visitors**

In both variants, next to the existing `{viewer.isLocal && !expired && (…form…)}` heart, add the anonymous branch (same position/classes as the real heart, tripadvisor sizes at line ~124, default sizes at line ~312):

```tsx
{!viewer.isLocal && !expired && (
  <Link
    href={`/login?redirectTo=${encodeURIComponent(fromPath ?? `/biz/${deal.business.slug}`)}`}
    aria-label={t("signInToSave")}
    title={t("signInToSave")}
    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/95 shadow-md [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)] hover:scale-110"
  >
    <Heart className="h-4 w-4 text-muted-foreground" />
  </Link>
)}
```

(Adjust `right-2.5 bottom-2.5` / `h-8 w-8` / `h-3.5 w-3.5` for the tripadvisor variant to match its logged-in heart.) Keys: EN `"signInToSave": "Sign in to save deals"`; ES `"signInToSave": "Inicia sesión para guardar ofertas"` (namespace `dealCard`).

- [ ] **Step 2: Follow button for logged-out visitors on the profile**

In `biz/[slug]/page.tsx` where `{viewer.isLocal && (…FollowBusinessButton…)}` renders (lines 240–249), add the anonymous sibling:

```tsx
{!viewer.isLocal && (
  <>
    <span className="text-foreground/30">·</span>
    <Link
      href={`/login?redirectTo=${encodeURIComponent(`/biz/${params.slug}`)}`}
      className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/50 px-3 py-1.5 text-xs font-medium transition-colors duration-150 hover:bg-secondary"
    >
      <Bell className="h-3.5 w-3.5" />
      {t("follow")}
    </Link>
  </>
)}
```

Add `Bell` to the page's lucide imports. Also extend Task 6's zero-deal prompt: replace its `{viewer.isLocal && (…)}` with logged-in button OR this same login link, so anonymous visitors on empty profiles get the hook too.

- [ ] **Step 3: Verify + commit**

`npx tsc --noEmit && npm run lint` → clean. In dev, logged out: hearts visible on cards, clicking goes to login with redirect back after auth; Follow visible on profiles. Logged in as a local: behavior unchanged.

```bash
git add components/deal-card.tsx "app/[locale]/(public)/biz" messages/en.json messages/es.json
git commit -m "feat: logged-out visitors see favorite/follow with sign-in redirect"
```

---

### Task 11: "Open now" toggle on directory + category pages

**Files:**
- Modify: `lib/queries.ts` (`DirectoryBusiness` type ~183, `getDirectoryBusinesses` ~221, `getBusinessesByCategorySlug` ~247 — add `hoursJson` to selects)
- Modify: `app/[locale]/(public)/businesses/page.tsx`
- Modify: `app/[locale]/(public)/category/[slug]/page.tsx`
- Modify: `messages/en.json`, `messages/es.json`

**Interfaces:**
- Consumes: `parseHours(hoursJson)` and `isOpenNow(hours)` from `lib/hours.ts` (already timezone-correct, handles after-midnight closes).
- Produces: `DirectoryBusiness` gains `hoursJson: unknown`; both pages accept `?open=1`.

- [ ] **Step 1: Add `hoursJson` to the queries**

In `lib/queries.ts`, add `hoursJson: businesses.hoursJson,` to the select of `getDirectoryBusinesses` and `getBusinessesByCategorySlug`, and `hoursJson: unknown` to the `DirectoryBusiness` type. (Check whether the homepage's `getFeaturedBusinesses` shares the type — if the type is shared, add the field to that select too so tsc stays clean.)

- [ ] **Step 2: Server-side filter helper in `lib/hours.ts`**

Append:

```ts
export function filterOpenNow<T extends { hoursJson: unknown }>(items: T[]): T[] {
  return items.filter((b) => {
    const hours = parseHours(b.hoursJson)
    const anyDay = DAY_KEYS.some((k) => hours[k] !== null)
    // Unknown hours are kept — never falsely claim a business is closed.
    return !anyDay || isOpenNow(hours)
  })
}
```

- [ ] **Step 3: Wire the toggle into both pages**

In each page's component, read `searchParams.open`, apply `filterOpenNow` when `open === "1"`, and render a toggle pill above the grid that links to the same route with/without `?open=1` (preserve other params on the category page). Toggle UI (place next to any existing heading/controls; both pages get the same element):

```tsx
<Link
  href={open ? basePath : `${basePath}?open=1`}
  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
    open
      ? "border-success bg-success/10 text-success"
      : "bg-card text-muted-foreground hover:border-foreground/30"
  }`}
>
  <span className={`h-2 w-2 rounded-full ${open ? "bg-success" : "bg-muted-foreground/40"}`} />
  {t("openNowFilter")}
</Link>
```

Where `basePath` is `/businesses` or `/category/${slug}`. Keys: EN `"openNowFilter": "Open now"`; ES `"openNowFilter": "Abierto ahora"` — add to the namespace each page already uses (check the page's `getTranslations(...)` call and put the key there).

- [ ] **Step 4: Verify + commit**

`npx tsc --noEmit && npm run lint` → clean. In dev at a time when some businesses are closed: `/en/businesses?open=1` shows fewer businesses than `/en/businesses`; toggle highlights; category page same; businesses with no hours data still appear (never falsely excluded).

```bash
git add lib/queries.ts lib/hours.ts "app/[locale]/(public)/businesses/page.tsx" "app/[locale]/(public)/category/[slug]/page.tsx" messages/en.json messages/es.json
git commit -m "feat: open-now filter on directory and category pages"
```

---

### Task 12: Merchant proof — claims/redemptions in dashboard stats

**Files:**
- Modify: `app/[locale]/dashboard/stats/page.tsx` (read it first — anchor on the existing per-deal stats table)
- Modify: `lib/queries.ts` (add `getDealEngagement`)
- Modify: `messages/en.json`, `messages/es.json`

**Interfaces:**
- Produces: `getDealEngagement(businessId: number): Promise<Array<{ dealId: number; claims: number; redeems: number }>>` from the `dealEvents` table (columns: `dealId`, `userId`, `eventType`, `createdAt`; `eventType` values `"claim"` / `"redeem"` are written by the Task 2/3 flow).

- [ ] **Step 1: Add the query to `lib/queries.ts`**

```ts
export async function getDealEngagement(
  businessId: number
): Promise<Array<{ dealId: number; claims: number; redeems: number }>> {
  const rows = await db
    .select({
      dealId: dealEvents.dealId,
      claims: sql<number>`count(*) filter (where ${dealEvents.eventType} = 'claim')`,
      redeems: sql<number>`count(*) filter (where ${dealEvents.eventType} = 'redeem')`,
    })
    .from(dealEvents)
    .innerJoin(deals, eq(dealEvents.dealId, deals.id))
    .where(eq(deals.businessId, businessId))
    .groupBy(dealEvents.dealId)
  return rows.map((r) => ({ dealId: r.dealId, claims: Number(r.claims), redeems: Number(r.redeems) }))
}
```

Add `dealEvents` to the file's schema imports if missing.

- [ ] **Step 2: Surface in the stats page**

Read `app/[locale]/dashboard/stats/page.tsx`. In the per-deal listing/table it already renders, call `getDealEngagement(business.id)`, build a `Map(dealId → {claims, redeems})`, and add two columns/cells per deal showing `claims` and `redeems` (0 when absent), styled like the existing count cells. Add header keys to the namespace the page uses: EN `"claims": "Claims"`, `"redeems": "Used"`; ES `"claims": "Reclamos"`, `"redeems": "Usadas"`. Respect the page's existing tier gating — do not loosen it.

- [ ] **Step 3: Verify + commit**

`npx tsc --noEmit && npm run lint` → clean. In dev: claim a deal via the coupon screen, press "I used this deal", then log in as that business (or admin plan-override account) → stats show the claim + redeem.

```bash
git add "app/[locale]/dashboard/stats/page.tsx" lib/queries.ts messages/en.json messages/es.json
git commit -m "feat: dashboard stats show per-deal claims and redemptions"
```

---

### Task 13: Business cross-link on profiles

**Files:**
- Modify: `app/[locale]/(public)/biz/[slug]/page.tsx` (bottom of page, near the relocated claim banner)
- Modify: `messages/en.json`, `messages/es.json` (`businesses.profile`)

- [ ] **Step 1: Add the quiet owner CTA**

At the bottom of the profile (after the relocated claim CTA from Task 6; for claimed businesses it's the only footer line):

```tsx
<section className="mx-auto max-w-6xl px-4 pb-10 text-center">
  <Link
    href="/for-businesses"
    className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
  >
    {t("ownerCta")}
  </Link>
</section>
```

Keys: EN `"ownerCta": "Own this business? Get your deals in front of Lompoc locals →"`; ES `"ownerCta": "¿Es tu negocio? Pon tus ofertas frente a los vecinos de Lompoc →"`

- [ ] **Step 2: Verify, commit, PR**

`npx tsc --noEmit && npm run lint` → clean; link renders on claimed and unclaimed profiles, both locales.

```bash
git add "app/[locale]/(public)/biz" messages/en.json messages/es.json
git commit -m "feat: owner cross-link on business profiles"
git push -u origin feat/cx-unify
gh pr create --title "CX phase 3: unify locals + businesses" --body "Logged-out favorite/follow hooks, open-now filter, claims/redemptions in merchant stats, owner cross-links. Per docs/superpowers/specs/2026-07-02-cx-one-platform-design.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Final verification (after each PR merges)

Production deploys need a manual promote (`vercel deploy --prod` — merging to main is NOT enough). After each phase is promoted, smoke on https://lompoc-deals.vercel.app:
1. Phase 1: claim a deal EN + ES (coupon renders, code visible); `/en/search?q=pizza` returns businesses; subscribe on `/es/subscribe` → Spanish messaging; zero-deal profile looks intentional.
2. Phase 2: homepage has no fake sponsors/testimonials; `grep`-check rendered HTML for `19.99` (`curl -sL https://lompoc-deals.vercel.app/en/for-businesses | grep -c '19.99'` → 0); `/en/biz/demo-florianos-pizzeria` 308s.
3. Phase 3: logged-out heart/follow visible; `?open=1` filters; dashboard stats show claims.
