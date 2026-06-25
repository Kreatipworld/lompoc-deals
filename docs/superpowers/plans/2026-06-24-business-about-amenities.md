# Business "About" + Amenities + Local SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Google-seeded, owner-editable "About this place" write-up and a curated amenities set to business profiles, and feed that data (plus existing fields) into local-SEO signals — `LocalBusiness` JSON-LD, richer page meta, and sitemap/internal-link improvements.

**Architecture:** Four new `businesses` columns (`about`, `aboutSource`, `amenitiesJson`, `amenitiesSource`) mirror the existing `hoursSource` "Google fills, owner owns" guard. A pure `lib/amenities.ts` defines a 14-slug canonical taxonomy and maps Google's `additionalInfo` blob to it. A server `BusinessAbout` component renders the card; the dashboard form gains an About textarea + amenity checkboxes; the scraper enriches the new fields under the source guard. A pure `lib/business-jsonld.ts` builds schema.org structured data rendered via a `<script type="application/ld+json">` tag like the existing blog page.

**Tech Stack:** Next.js 14 App Router, TypeScript, Drizzle ORM (Neon Postgres), Tailwind, next-intl, lucide-react, zod. Tests are standalone `tsx` scripts using `node:assert/strict` (repo has no vitest/jest).

## Global Constraints

- **No new runtime dependencies.** Reuse Tailwind tokens, lucide-react, `next-intl`, zod, the existing `SafeImage` primitive.
- **All user-facing strings are i18n keys** present in BOTH `messages/en.json` and `messages/es.json`. Client components read via `useTranslations`; server components via `getTranslations`.
- **Mirror the hours source pattern:** scraper writes a field only when its `*Source !== "owner"`; saving the dashboard profile form always stamps source `"owner"`.
- **`about` is a SEPARATE column from `description`.** `description` remains the short header/meta blurb; `about` is the longer body write-up.
- **Amenities are a fixed canonical set of 14 slugs.** No free-form/custom amenities.
- **JSON-LD omits `aggregateRating`** (no real review data is scraped).
- **Tests are `tsx` scripts** run via `npx tsx <file>`.
- **Branch:** `feat/business-about-amenities` (already created off `main`). Conventional commits. Verify with `npx tsc --noEmit` and `npx next build`.
- **Migration workflow:** edit `db/schema.ts` → `npm run db:generate` (writes SQL to `db/migrations/`) → `npm run db:push` (applies to the DB in `.env.local`).

Spec: [2026-06-24-business-about-amenities-design.md](../specs/2026-06-24-business-about-amenities-design.md).

---

## File Structure

- Create `lib/amenities.ts` — canonical amenity taxonomy + `mapGoogleAdditionalInfo()` (pure).
- Create `lib/amenities.test.ts` — unit tests.
- Create `lib/business-jsonld.ts` — `buildLocalBusinessJsonLd()` (pure).
- Create `lib/business-jsonld.test.ts` — unit tests.
- Create `components/business-about.tsx` — "About this place" card (server component).
- Modify `db/schema.ts` — 4 new columns.
- Add migration under `db/migrations/`.
- Modify `app/[locale]/(public)/biz/[slug]/page.tsx` — render card, JSON-LD, enhanced metadata, related strip.
- Modify `app/[locale]/dashboard/profile/profile-form.tsx` — About textarea + amenity checkboxes.
- Modify `lib/biz-actions.ts` — persist `about`/`amenitiesJson` with source `"owner"`; extend `Biz` type + `getMyBusiness`.
- Modify `lib/queries.ts` — `getRelatedBusinesses()`.
- Modify `db/scrape-google-places.ts` — seed `about`/`amenitiesJson` under source guard.
- Modify `app/sitemap.ts` — bump business priority to 0.7.
- Modify `messages/en.json`, `messages/es.json` — new keys.

---

## Task 1: DB columns for About + amenities

**Files:**
- Modify: `db/schema.ts` (businesses table, after `photosJson` at line 102)
- Create: migration in `db/migrations/` (generated)

**Interfaces:**
- Produces: `businesses.about: text`, `businesses.aboutSource: text`, `businesses.amenitiesJson: jsonb`, `businesses.amenitiesSource: text`. Drizzle field names `about`, `aboutSource`, `amenitiesJson`, `amenitiesSource`.

- [ ] **Step 1: Add the columns to the schema**

In `db/schema.ts`, in the `businesses` table definition, immediately after the line `photosJson: jsonb("photos_json"),` add:
```typescript
    about: text("about"),
    aboutSource: text("about_source"), // 'google' | 'owner' | null
    amenitiesJson: jsonb("amenities_json"),
    amenitiesSource: text("amenities_source"), // 'google' | 'owner' | null
```
(`text` and `jsonb` are already imported in this file.)

- [ ] **Step 2: Generate the migration**

Run: `npm run db:generate`
Expected: a new file `db/migrations/0019_*.sql` containing `ALTER TABLE "businesses" ADD COLUMN "about" ...` for all four columns.

- [ ] **Step 3: Apply the migration to the dev DB**

Run: `npm run db:push`
Expected: prompts/confirms adding 4 columns; completes without error.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add db/schema.ts db/migrations
git commit -m "feat: add about + amenities columns to businesses"
```

---

## Task 2: `lib/amenities.ts` canonical taxonomy + Google mapper

**Files:**
- Create: `lib/amenities.ts`
- Test: `lib/amenities.test.ts`

**Interfaces:**
- Produces:
  - `type Amenity = { slug: string; icon: string; labelKey: string }`
  - `const AMENITIES: Amenity[]` (14 entries)
  - `const AMENITY_SLUGS: string[]`
  - `function isAmenitySlug(s: string): boolean`
  - `function mapGoogleAdditionalInfo(additionalInfo: unknown): string[]`

- [ ] **Step 1: Write the failing test**

Create `lib/amenities.test.ts`:
```typescript
import assert from "node:assert/strict"
import {
  AMENITIES,
  AMENITY_SLUGS,
  isAmenitySlug,
  mapGoogleAdditionalInfo,
} from "./amenities"

// taxonomy shape
assert.equal(AMENITIES.length, 14)
assert.ok(AMENITIES.every((a) => a.slug && a.icon && a.labelKey))
assert.deepEqual(AMENITY_SLUGS, AMENITIES.map((a) => a.slug))

// slug guard
assert.equal(isAmenitySlug("takeout"), true)
assert.equal(isAmenitySlug("not_a_real_amenity"), false)

// null / wrong-shape input → []
assert.deepEqual(mapGoogleAdditionalInfo(null), [])
assert.deepEqual(mapGoogleAdditionalInfo(undefined), [])
assert.deepEqual(mapGoogleAdditionalInfo("garbage"), [])
assert.deepEqual(mapGoogleAdditionalInfo(42), [])

// realistic Apify additionalInfo blob
const blob = {
  "Service options": [{ "Dine-in": true }, { Takeout: true }, { Delivery: false }],
  Accessibility: [{ "Wheelchair accessible entrance": true }],
  Amenities: [{ "Free Wi-Fi": true }, { "Restroom": true }],
  Payments: [{ "Credit cards": true }],
  Children: [{ "Good for kids": true }],
}
const got = mapGoogleAdditionalInfo(blob)
// false-valued label (Delivery) excluded; known labels mapped; stable AMENITIES order
assert.deepEqual(got, [
  "wheelchair_accessible",
  "dine_in",
  "takeout",
  "accepts_cards",
  "free_wifi",
  "family_friendly",
  "restroom",
])

// unknown labels dropped, dedupe
const blob2 = {
  X: [{ "Totally unknown thing": true }, { Takeout: true }, { "Take-out": true }],
}
assert.deepEqual(mapGoogleAdditionalInfo(blob2), ["takeout"])

console.log("amenities.test: all passed")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx lib/amenities.test.ts`
Expected: FAIL — `Cannot find module './amenities'`.

- [ ] **Step 3: Write the implementation**

Create `lib/amenities.ts`:
```typescript
export type Amenity = { slug: string; icon: string; labelKey: string }

/**
 * Curated canonical amenity set. `icon` is a lucide-react icon name (resolved
 * in components/business-about.tsx). `labelKey` resolves under i18n
 * "businesses.amenities".
 */
export const AMENITIES: Amenity[] = [
  { slug: "wheelchair_accessible", icon: "Accessibility", labelKey: "wheelchair_accessible" },
  { slug: "outdoor_seating", icon: "Armchair", labelKey: "outdoor_seating" },
  { slug: "dine_in", icon: "Utensils", labelKey: "dine_in" },
  { slug: "takeout", icon: "ShoppingBag", labelKey: "takeout" },
  { slug: "delivery", icon: "Truck", labelKey: "delivery" },
  { slug: "accepts_cards", icon: "CreditCard", labelKey: "accepts_cards" },
  { slug: "free_wifi", icon: "Wifi", labelKey: "free_wifi" },
  { slug: "parking", icon: "SquareParking", labelKey: "parking" },
  { slug: "family_friendly", icon: "Baby", labelKey: "family_friendly" },
  { slug: "pet_friendly", icon: "PawPrint", labelKey: "pet_friendly" },
  { slug: "restroom", icon: "Toilet", labelKey: "restroom" },
  { slug: "reservations", icon: "CalendarCheck", labelKey: "reservations" },
  { slug: "good_for_groups", icon: "Users", labelKey: "good_for_groups" },
  { slug: "lgbtq_friendly", icon: "Heart", labelKey: "lgbtq_friendly" },
]

export const AMENITY_SLUGS: string[] = AMENITIES.map((a) => a.slug)

const SLUG_SET = new Set(AMENITY_SLUGS)
export function isAmenitySlug(s: string): boolean {
  return SLUG_SET.has(s)
}

/**
 * Lowercased Google/Apify label substrings → canonical slug.
 * Matched case-insensitively; the first substring found in a label wins.
 */
const LABEL_PATTERNS: Array<[needle: string, slug: string]> = [
  ["wheelchair", "wheelchair_accessible"],
  ["outdoor seating", "outdoor_seating"],
  ["dine-in", "dine_in"],
  ["dine in", "dine_in"],
  ["takeout", "takeout"],
  ["take-out", "takeout"],
  ["delivery", "delivery"],
  ["credit card", "accepts_cards"],
  ["debit card", "accepts_cards"],
  ["nfc mobile payment", "accepts_cards"],
  ["wi-fi", "free_wifi"],
  ["wifi", "free_wifi"],
  ["parking", "parking"],
  ["good for kids", "family_friendly"],
  ["family", "family_friendly"],
  ["dogs allowed", "pet_friendly"],
  ["pet", "pet_friendly"],
  ["restroom", "restroom"],
  ["reservation", "reservations"],
  ["good for groups", "good_for_groups"],
  ["groups", "good_for_groups"],
  ["lgbtq", "lgbtq_friendly"],
]

function labelToSlug(label: string): string | null {
  const l = label.toLowerCase()
  for (const [needle, slug] of LABEL_PATTERNS) {
    if (l.includes(needle)) return slug
  }
  return null
}

/**
 * Translate a Google/Apify `additionalInfo` object — shape:
 *   { [category: string]: Array<{ [label: string]: boolean }> }
 * — into our canonical amenity slugs. Only truthy labels count. Unknown
 * labels are dropped. Result is de-duplicated and ordered by AMENITIES.
 * Pure; defensive against malformed input.
 */
export function mapGoogleAdditionalInfo(additionalInfo: unknown): string[] {
  if (!additionalInfo || typeof additionalInfo !== "object") return []
  const found = new Set<string>()
  for (const group of Object.values(additionalInfo as Record<string, unknown>)) {
    if (!Array.isArray(group)) continue
    for (const entry of group) {
      if (!entry || typeof entry !== "object") continue
      for (const [label, value] of Object.entries(entry as Record<string, unknown>)) {
        if (value !== true) continue
        const slug = labelToSlug(label)
        if (slug) found.add(slug)
      }
    }
  }
  return AMENITY_SLUGS.filter((s) => found.has(s))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx lib/amenities.test.ts`
Expected: PASS — prints `amenities.test: all passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/amenities.ts lib/amenities.test.ts
git commit -m "feat: canonical amenities taxonomy + Google additionalInfo mapper"
```

---

## Task 3: i18n keys for About, amenities, and dashboard form

**Files:**
- Modify: `messages/en.json`, `messages/es.json`

**Interfaces:**
- Produces: keys under `businesses.profile` (`aboutTitle`, `amenitiesTitle`, `aboutFromGoogle`, `moreInCategory`), a new `businesses.amenities` object (14 keys), and keys under `dashboardProfile` (`aboutLabel`, `aboutHint`, `amenitiesTitle`, `amenitiesHint`).

- [ ] **Step 1: Add keys to `messages/en.json`**

In `messages/en.json`, inside `businesses.profile`, add (after the existing `photoOpenAria` key — add a comma after it):
```json
"aboutTitle": "About this place",
"amenitiesTitle": "What this place offers",
"aboutFromGoogle": "Info from Google",
"moreInCategory": "More {category} in Lompoc"
```

In `messages/en.json`, inside `businesses` (as a sibling of `profile`), add a new object:
```json
"amenities": {
  "wheelchair_accessible": "Wheelchair accessible",
  "outdoor_seating": "Outdoor seating",
  "dine_in": "Dine-in",
  "takeout": "Takeout",
  "delivery": "Delivery",
  "accepts_cards": "Accepts cards",
  "free_wifi": "Free Wi-Fi",
  "parking": "Parking",
  "family_friendly": "Family-friendly",
  "pet_friendly": "Pet-friendly",
  "restroom": "Restroom",
  "reservations": "Reservations",
  "good_for_groups": "Good for groups",
  "lgbtq_friendly": "LGBTQ+ friendly"
}
```

In `messages/en.json`, inside `dashboardProfile`, add (after `googleBusinessLabel`):
```json
"aboutLabel": "About this place",
"aboutHint": "A longer description shown on your profile. Tell visitors what makes you worth a stop.",
"amenitiesTitle": "Amenities",
"amenitiesHint": "Check everything that applies."
```

- [ ] **Step 2: Add the same keys to `messages/es.json`**

In `messages/es.json`, inside `businesses.profile`, add:
```json
"aboutTitle": "Acerca de este lugar",
"amenitiesTitle": "Lo que ofrece este lugar",
"aboutFromGoogle": "Información de Google",
"moreInCategory": "Más {category} en Lompoc"
```

In `messages/es.json`, inside `businesses`, add:
```json
"amenities": {
  "wheelchair_accessible": "Accesible para sillas de ruedas",
  "outdoor_seating": "Asientos al aire libre",
  "dine_in": "Comer en el lugar",
  "takeout": "Para llevar",
  "delivery": "Entrega a domicilio",
  "accepts_cards": "Acepta tarjetas",
  "free_wifi": "Wi-Fi gratis",
  "parking": "Estacionamiento",
  "family_friendly": "Apto para familias",
  "pet_friendly": "Admite mascotas",
  "restroom": "Baño",
  "reservations": "Reservaciones",
  "good_for_groups": "Bueno para grupos",
  "lgbtq_friendly": "Espacio LGBTQ+"
}
```

In `messages/es.json`, inside `dashboardProfile`, add:
```json
"aboutLabel": "Acerca de este lugar",
"aboutHint": "Una descripción más larga que se muestra en tu perfil. Cuéntales a los visitantes qué te hace especial.",
"amenitiesTitle": "Servicios",
"amenitiesHint": "Marca todo lo que aplique."
```

- [ ] **Step 3: Verify both files are valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8')); JSON.parse(require('fs').readFileSync('messages/es.json','utf8')); console.log('json ok')"`
Expected: prints `json ok`.

- [ ] **Step 4: Verify amenity keys exist for every slug**

Run: `npx tsx -e "import {AMENITY_SLUGS} from './lib/amenities'; import en from './messages/en.json'; import es from './messages/es.json'; for (const s of AMENITY_SLUGS){ if(!en.businesses.amenities[s]) throw new Error('missing en '+s); if(!es.businesses.amenities[s]) throw new Error('missing es '+s);} console.log('amenity keys ok')"`
Expected: prints `amenity keys ok`. (`lib/amenities.ts` has no `@/`-aliased imports, so `tsx` resolves it cleanly.)

- [ ] **Step 5: Commit**

```bash
git add messages/en.json messages/es.json
git commit -m "feat: i18n keys for About, amenities, and dashboard form"
```

---

## Task 4: `BusinessAbout` display component

**Files:**
- Create: `components/business-about.tsx`

**Interfaces:**
- Consumes: `AMENITIES` from `@/lib/amenities`; i18n `businesses.profile` + `businesses.amenities` (Task 3).
- Produces: `<BusinessAbout about={string | null} amenities={string[] | null} source={{ about: string | null; amenities: string | null }} />` (server component). Returns `null` when both `about` is empty and `amenities` is empty.

- [ ] **Step 1: Write the component**

Create `components/business-about.tsx`:
```tsx
import { getTranslations } from "next-intl/server"
import {
  Accessibility,
  Armchair,
  Baby,
  CalendarCheck,
  CreditCard,
  Heart,
  PawPrint,
  ShoppingBag,
  SquareParking,
  Toilet,
  Truck,
  Users,
  Utensils,
  Wifi,
  Info,
  type LucideIcon,
} from "lucide-react"
import { AMENITIES } from "@/lib/amenities"

const ICONS: Record<string, LucideIcon> = {
  Accessibility,
  Armchair,
  Baby,
  CalendarCheck,
  CreditCard,
  Heart,
  PawPrint,
  ShoppingBag,
  SquareParking,
  Toilet,
  Truck,
  Users,
  Utensils,
  Wifi,
}

export async function BusinessAbout({
  about,
  amenities,
  source,
}: {
  about: string | null
  amenities: string[] | null
  source: { about: string | null; amenities: string | null }
}) {
  const t = await getTranslations("businesses.profile")
  const tAmenity = await getTranslations("businesses.amenities")

  const hasAbout = !!about && about.trim().length > 0
  // Keep only known slugs, in canonical order
  const shown = AMENITIES.filter((a) => (amenities ?? []).includes(a.slug))
  const hasAmenities = shown.length > 0

  if (!hasAbout && !hasAmenities) return null

  const googleSourced =
    (hasAbout && source.about === "google") ||
    (hasAmenities && source.amenities === "google")

  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        {hasAbout && (
          <div className="space-y-2">
            <h2 className="font-display text-xl font-semibold tracking-tight">
              {t("aboutTitle")}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
              {about}
            </p>
          </div>
        )}

        {hasAmenities && (
          <div className={hasAbout ? "mt-6 border-t pt-6" : ""}>
            <h3 className="mb-3 font-display text-base font-semibold tracking-tight">
              {t("amenitiesTitle")}
            </h3>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((a) => {
                const Icon = ICONS[a.icon] ?? Info
                return (
                  <li key={a.slug} className="flex items-center gap-2 text-sm text-foreground">
                    <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                    {tAmenity(a.slug)}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {googleSourced && (
          <p className="mt-5 flex items-center gap-1 text-[11px] text-muted-foreground/70">
            <Info className="h-3 w-3" />
            {t("aboutFromGoogle")}
          </p>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/business-about.tsx
git commit -m "feat: BusinessAbout card (about + amenities, Google attribution)"
```

---

## Task 5: Render `BusinessAbout` on the profile page

**Files:**
- Modify: `app/[locale]/(public)/biz/[slug]/page.tsx`

**Interfaces:**
- Consumes: `BusinessAbout` (Task 4). `business` already includes the new columns (`getBusinessBySlug` spreads `...biz`).

- [ ] **Step 1: Import the component**

In `app/[locale]/(public)/biz/[slug]/page.tsx`, add to the imports (next to the other `@/components` imports, e.g. after the `BusinessPhotoGallery` import line):
```typescript
import { BusinessAbout } from "@/components/business-about"
```

- [ ] **Step 2: Render the card between the Claim CTA and the 2-column body**

In the same file, find the Claim CTA block that ends with:
```tsx
      {isUnclaimed && (
        <section className="mx-auto mt-6 max-w-6xl px-4">
          <BusinessClaimCta slug={params.slug} />
        </section>
      )}
```
Immediately AFTER that closing `)}`, add:
```tsx
      {/* ─────────────────────────────────────────────────
          ABOUT THIS PLACE — long-form copy + amenities
         ───────────────────────────────────────────────── */}
      <div className="mt-6">
        <BusinessAbout
          about={business.about}
          amenities={business.amenitiesJson as string[] | null}
          source={{ about: business.aboutSource, amenities: business.amenitiesSource }}
        />
      </div>
```

- [ ] **Step 3: Build to verify the profile route compiles**

Run: `npx next build`
Expected: PASS — `/[locale]/biz/[slug]` compiles; no type errors.

- [ ] **Step 4: Commit**

```bash
git add "app/[locale]/(public)/biz/[slug]/page.tsx"
git commit -m "feat: render About + amenities card on business profile"
```

---

## Task 6: Dashboard form — About textarea + amenity checkboxes

**Files:**
- Modify: `app/[locale]/dashboard/profile/profile-form.tsx`

**Interfaces:**
- Consumes: `AMENITIES` from `@/lib/amenities`; i18n `dashboardProfile` (Task 3); `biz.about` and `biz.amenitiesJson` (added to the `Biz` type here; populated by Task 7).
- Produces: form fields `name="about"` and repeated `name="amenities"` checkboxes.

- [ ] **Step 1: Extend the `Biz` type and import AMENITIES**

In `app/[locale]/dashboard/profile/profile-form.tsx`, add the import near the top:
```typescript
import { AMENITIES } from "@/lib/amenities"
```
In the `type Biz = { ... } | null` block, add two fields (e.g. after `description: string | null`):
```typescript
  about: string | null
  amenitiesJson: unknown
```

- [ ] **Step 2: Add the About + amenities section to the form**

In the same file, find the Hours section block that begins with:
```tsx
      <div className="space-y-4 border-t pt-6">
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight">
            {t("hoursTitle")}
          </h3>
```
Immediately BEFORE that `<div className="space-y-4 border-t pt-6">` line, insert a new section:
```tsx
      <div className="space-y-4 border-t pt-6">
        <div className="space-y-2">
          <Label htmlFor="about">{t("aboutLabel")}</Label>
          <Textarea
            id="about"
            name="about"
            rows={6}
            defaultValue={biz?.about ?? ""}
          />
          <p className="text-xs text-muted-foreground">{t("aboutHint")}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-base font-semibold tracking-tight">
            {t("amenitiesTitle")}
          </h3>
          <p className="text-xs text-muted-foreground">{t("amenitiesHint")}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {AMENITIES.map((a) => {
              const checked =
                Array.isArray(biz?.amenitiesJson) &&
                (biz!.amenitiesJson as string[]).includes(a.slug)
              return (
                <label key={a.slug} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="amenities"
                    value={a.slug}
                    defaultChecked={checked}
                  />
                  {tAmenity(a.slug)}
                </label>
              )
            })}
          </div>
        </div>
      </div>
```

- [ ] **Step 3: Add the amenity-label translator**

In the same file, inside the `ProfileForm` component, next to the existing `const t = useTranslations("dashboardProfile")`, add:
```typescript
  const tAmenity = useTranslations("businesses.amenities")
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/[locale]/dashboard/profile/profile-form.tsx"
git commit -m "feat: dashboard About textarea + amenity checkboxes"
```

---

## Task 7: Persist About + amenities in `saveProfileAction` (source 'owner')

**Files:**
- Modify: `lib/biz-actions.ts`

**Interfaces:**
- Consumes: `isAmenitySlug` from `@/lib/amenities`; form fields `about`, `amenities` (Task 6).
- Produces: writes `about`, `aboutSource: "owner"`, `amenitiesJson`, `amenitiesSource: "owner"` on both insert and update; `getMyBusiness()` returns rows including `about` and `amenitiesJson` (already does — `findFirst` returns all columns).

- [ ] **Step 1: Import the slug guard**

In `lib/biz-actions.ts`, add to the imports at the top:
```typescript
import { isAmenitySlug } from "@/lib/amenities"
```

- [ ] **Step 2: Add `about` to the zod schema**

In `lib/biz-actions.ts`, in `profileSchema`, add after `description: z.string().optional(),`:
```typescript
  about: z.string().optional(),
```
And in the `profileSchema.safeParse({ ... })` call, add after `description: formData.get("description") || undefined,`:
```typescript
    about: formData.get("about") || undefined,
```

- [ ] **Step 3: Collect + validate amenity slugs**

In `saveProfileAction`, after the `const socialFields = { ... }` block, add:
```typescript
  // Amenities — keep only known canonical slugs the owner checked.
  const amenitiesPayload = formData
    .getAll("amenities")
    .map((v) => v.toString())
    .filter((s) => isAmenitySlug(s))
```

- [ ] **Step 4: Write the fields on update**

In the `if (existing) { await db.update(businesses).set({ ... })` object, add after `description: data.description ?? null,`:
```typescript
        about: data.about ?? null,
        aboutSource: "owner",
        amenitiesJson: amenitiesPayload,
        amenitiesSource: "owner",
```

- [ ] **Step 5: Write the fields on insert**

In the `else { const [newBiz] = await db.insert(businesses).values({ ... })` object, add after `description: data.description ?? null,`:
```typescript
      about: data.about ?? null,
      aboutSource: "owner",
      amenitiesJson: amenitiesPayload,
      amenitiesSource: "owner",
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/biz-actions.ts
git commit -m "feat: persist About + amenities from dashboard (source=owner)"
```

---

## Task 8: Scraper — seed About + amenities under the source guard

**Files:**
- Modify: `db/scrape-google-places.ts`

**Interfaces:**
- Consumes: `mapGoogleAdditionalInfo` from `../lib/amenities`.
- Produces: scraper sets `about`/`aboutSource` and `amenitiesJson`/`amenitiesSource` from Google data, never overwriting `*Source === "owner"`.

- [ ] **Step 1: Import the mapper**

In `db/scrape-google-places.ts`, add after the existing `import { DAY_KEYS } from "../lib/hours"` line:
```typescript
import { mapGoogleAdditionalInfo } from "../lib/amenities"
```

- [ ] **Step 2: Extend the result interface**

In `db/scrape-google-places.ts`, in `interface GooglePlaceResult`, add two fields (e.g. after `placeId?: string`):
```typescript
  description?: string
  additionalInfo?: unknown
```

- [ ] **Step 3: Request place details from the actor**

In the `client.actor("compass/crawler-google-places").call({ ... })` options object, ensure detail scraping is on so `additionalInfo`/`description` are returned. Add:
```typescript
    scrapePlaceDetailPage: true,
```
(If the actor already returns these without it, this is a harmless no-op. Verify on the sample run in Task 13.)

- [ ] **Step 4: Enrich existing rows (guarded)**

In the enrich path, inside `if (existing) { const updates: Record<string, unknown> = {}` … add after the `googleBusinessUrl` enrich line and before `if (Object.keys(updates).length > 0)`:
```typescript
        if (existing.aboutSource !== "owner" && !existing.about && place.description) {
          updates.about = place.description
          updates.aboutSource = "google"
        }
        if (existing.amenitiesSource !== "owner") {
          const mapped = mapGoogleAdditionalInfo(place.additionalInfo)
          if (mapped.length > 0) {
            updates.amenitiesJson = mapped
            updates.amenitiesSource = "google"
          }
        }
```

- [ ] **Step 5: Set the fields on insert**

In the insert path, in the `await db.insert(businesses).values({ ... })` object, add after the `coverUrl,` line:
```typescript
        about: place.description ?? null,
        aboutSource: place.description ? "google" : null,
        amenitiesJson: (() => {
          const m = mapGoogleAdditionalInfo(place.additionalInfo)
          return m.length > 0 ? m : null
        })(),
        amenitiesSource: mapGoogleAdditionalInfo(place.additionalInfo).length > 0 ? "google" : null,
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add db/scrape-google-places.ts
git commit -m "feat: scraper seeds About + amenities (owner-edit guarded)"
```

---

## Task 9: `lib/business-jsonld.ts` — LocalBusiness builder

**Files:**
- Create: `lib/business-jsonld.ts`
- Test: `lib/business-jsonld.test.ts`

**Interfaces:**
- Consumes: `AMENITIES` from `@/lib/amenities`; the canonical `Hours` shape from `@/lib/hours` (`parseHours`, `isCanonical`, `DAY_KEYS`).
- Produces:
  - `type JsonLdBusiness = { name: string; slug: string; about: string | null; description: string | null; phone: string | null; address: string | null; lat: number | null; lng: number | null; hoursJson: unknown; instagramUrl: string | null; facebookUrl: string | null; tiktokUrl: string | null; youtubeUrl: string | null; yelpUrl: string | null; googleBusinessUrl: string | null }`
  - `function buildLocalBusinessJsonLd(b: JsonLdBusiness, opts: { siteUrl: string; amenities: string[]; photos: string[]; categorySlug: string | null }): Record<string, unknown>`

- [ ] **Step 1: Write the failing test**

Create `lib/business-jsonld.test.ts`:
```typescript
import assert from "node:assert/strict"
import { buildLocalBusinessJsonLd } from "./business-jsonld"

const base = {
  name: "Test Cafe",
  slug: "test-cafe",
  about: null,
  description: null,
  phone: null,
  address: null,
  lat: null,
  lng: null,
  hoursJson: null,
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
  youtubeUrl: null,
  yelpUrl: null,
  googleBusinessUrl: null,
}
const opts = { siteUrl: "https://x.test", amenities: [], photos: [], categorySlug: null }

// minimal: only required keys, no empty/null keys leaked
const min = buildLocalBusinessJsonLd(base, opts)
assert.equal(min["@context"], "https://schema.org")
assert.equal(min["@type"], "LocalBusiness")
assert.equal(min.name, "Test Cafe")
assert.equal(min.url, "https://x.test/biz/test-cafe")
assert.ok(!("telephone" in min))
assert.ok(!("geo" in min))
assert.ok(!("address" in min))
assert.ok(!("aggregateRating" in min))

// food-drink → Restaurant
const food = buildLocalBusinessJsonLd(base, { ...opts, categorySlug: "food-drink" })
assert.equal(food["@type"], "Restaurant")

// full: address parsed, geo, hours, amenities, sameAs, description from about
const full = buildLocalBusinessJsonLd(
  {
    ...base,
    about: "Cozy corner cafe.",
    description: "short",
    phone: "(805) 555-1212",
    address: "123 H St, Lompoc, CA 93436",
    lat: 34.6,
    lng: -120.4,
    hoursJson: { mon: { open: "09:00", close: "17:00" }, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null },
    instagramUrl: "https://instagram.com/x",
    googleBusinessUrl: "https://g.page/x",
  },
  { ...opts, amenities: ["takeout", "free_wifi"], photos: ["https://x.test/p1.jpg"] }
)
assert.equal(full.description, "Cozy corner cafe.")
assert.equal(full.telephone, "(805) 555-1212")
const addr = full.address as Record<string, string>
assert.equal(addr["@type"], "PostalAddress")
assert.equal(addr.streetAddress, "123 H St, Lompoc, CA 93436")
assert.equal(addr.addressLocality, "Lompoc")
assert.equal(addr.addressRegion, "CA")
assert.equal(addr.postalCode, "93436")
const geo = full.geo as Record<string, unknown>
assert.equal(geo["@type"], "GeoCoordinates")
assert.equal(geo.latitude, 34.6)
const hours = full.openingHoursSpecification as Array<Record<string, string>>
assert.equal(hours.length, 1)
assert.equal(hours[0].dayOfWeek, "Monday")
assert.equal(hours[0].opens, "09:00")
assert.equal(hours[0].closes, "17:00")
const af = full.amenityFeature as Array<Record<string, unknown>>
assert.equal(af.length, 2)
assert.equal(af[0]["@type"], "LocationFeatureSpecification")
assert.equal(af[0].value, true)
assert.deepEqual(full.image, ["https://x.test/p1.jpg"])
assert.deepEqual(full.sameAs, ["https://instagram.com/x", "https://g.page/x"])

console.log("business-jsonld.test: all passed")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx lib/business-jsonld.test.ts`
Expected: FAIL — `Cannot find module './business-jsonld'`.

- [ ] **Step 3: Write the implementation**

Create `lib/business-jsonld.ts` (use **relative** imports — this file is unit-tested via `tsx`, which does not resolve the `@/` alias):
```typescript
import { AMENITIES } from "./amenities"
import { DAY_KEYS, isCanonical, parseHours, type Hours } from "./hours"

export type JsonLdBusiness = {
  name: string
  slug: string
  about: string | null
  description: string | null
  phone: string | null
  address: string | null
  lat: number | null
  lng: number | null
  hoursJson: unknown
  instagramUrl: string | null
  facebookUrl: string | null
  tiktokUrl: string | null
  youtubeUrl: string | null
  yelpUrl: string | null
  googleBusinessUrl: string | null
}

// Schema.org day names indexed to match DAY_KEYS order (mon..sun).
const SCHEMA_DAYS: Record<(typeof DAY_KEYS)[number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
}

const CATEGORY_TO_TYPE: Record<string, string> = {
  "food-drink": "Restaurant",
}

const AMENITY_LABEL: Record<string, string> = {
  wheelchair_accessible: "Wheelchair accessible",
  outdoor_seating: "Outdoor seating",
  dine_in: "Dine-in",
  takeout: "Takeout",
  delivery: "Delivery",
  accepts_cards: "Accepts cards",
  free_wifi: "Free Wi-Fi",
  parking: "Parking",
  family_friendly: "Family-friendly",
  pet_friendly: "Pet-friendly",
  restroom: "Restroom",
  reservations: "Reservations",
  good_for_groups: "Good for groups",
  lgbtq_friendly: "LGBTQ+ friendly",
}

function openingHoursSpec(hours: Hours): Array<Record<string, string>> {
  const out: Array<Record<string, string>> = []
  for (const day of DAY_KEYS) {
    const d = hours[day]
    if (isCanonical(d)) {
      out.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: SCHEMA_DAYS[day],
        opens: d.open,
        closes: d.close,
      })
    }
  }
  return out
}

export function buildLocalBusinessJsonLd(
  b: JsonLdBusiness,
  opts: { siteUrl: string; amenities: string[]; photos: string[]; categorySlug: string | null }
): Record<string, unknown> {
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": (opts.categorySlug && CATEGORY_TO_TYPE[opts.categorySlug]) || "LocalBusiness",
    name: b.name,
    url: `${opts.siteUrl}/biz/${b.slug}`,
  }

  const desc = b.about?.trim() || b.description?.trim()
  if (desc) json.description = desc
  if (b.phone) json.telephone = b.phone
  if (opts.photos.length > 0) json.image = opts.photos

  if (b.address) {
    const zip = b.address.match(/\b\d{5}\b/)?.[0]
    json.address = {
      "@type": "PostalAddress",
      streetAddress: b.address,
      addressLocality: "Lompoc",
      addressRegion: "CA",
      addressCountry: "US",
      ...(zip ? { postalCode: zip } : {}),
    }
  }

  if (b.lat != null && b.lng != null) {
    json.geo = { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng }
  }

  const spec = openingHoursSpec(parseHours(b.hoursJson))
  if (spec.length > 0) json.openingHoursSpecification = spec

  const amenityFeature = AMENITIES.filter((a) => opts.amenities.includes(a.slug)).map((a) => ({
    "@type": "LocationFeatureSpecification",
    name: AMENITY_LABEL[a.slug] ?? a.slug,
    value: true,
  }))
  if (amenityFeature.length > 0) json.amenityFeature = amenityFeature

  const sameAs = [
    b.instagramUrl,
    b.facebookUrl,
    b.tiktokUrl,
    b.youtubeUrl,
    b.yelpUrl,
    b.googleBusinessUrl,
  ].filter((u): u is string => !!u)
  if (sameAs.length > 0) json.sameAs = sameAs

  return json
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx lib/business-jsonld.test.ts`
Expected: PASS — prints `business-jsonld.test: all passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/business-jsonld.ts lib/business-jsonld.test.ts
git commit -m "feat: LocalBusiness JSON-LD builder"
```

---

## Task 10: Render JSON-LD on the profile page

**Files:**
- Modify: `app/[locale]/(public)/biz/[slug]/page.tsx`

**Interfaces:**
- Consumes: `buildLocalBusinessJsonLd` (Task 9). `siteUrl` from `process.env.AUTH_URL` (same source the sitemap/layout use).

- [ ] **Step 1: Import the builder**

In `app/[locale]/(public)/biz/[slug]/page.tsx`, add to the imports:
```typescript
import { buildLocalBusinessJsonLd } from "@/lib/business-jsonld"
```

- [ ] **Step 2: Build the structured data after `photos` is computed**

In the `BusinessPage` component, after the `const photos: string[] = ...` block (around line 116), add:
```typescript
  const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"
  const jsonLd = buildLocalBusinessJsonLd(business, {
    siteUrl,
    amenities: (business.amenitiesJson as string[] | null) ?? [],
    photos,
    categorySlug: business.category?.slug ?? null,
  })
```

- [ ] **Step 3: Render the script tag as the first child of the returned fragment**

In the same file, immediately after the opening `<>` of the returned JSX (before the `COVER IMAGE BANNER` comment), add:
```tsx
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
```

- [ ] **Step 4: Build**

Run: `npx next build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/[locale]/(public)/biz/[slug]/page.tsx"
git commit -m "feat: emit LocalBusiness JSON-LD on business profile"
```

---

## Task 11: Enhanced page metadata

**Files:**
- Modify: `app/[locale]/(public)/biz/[slug]/page.tsx` (`generateMetadata`)

**Interfaces:**
- Consumes: the existing `getBusinessBySlug` data (now includes `about`). `siteUrl` from `process.env.AUTH_URL`.

- [ ] **Step 1: Enrich `generateMetadata`**

In `app/[locale]/(public)/biz/[slug]/page.tsx`, replace the body of `generateMetadata` after the `if (!data) return { title: t("metaNotFound") }` line. Currently:
```typescript
  const { name, description } = data.business
  const catLabel = data.business.category?.name ?? "local business"
  const fallbackDescription = t("metaFallbackDescription", { name, catLabel })
  return {
    title: `${name} — ${t("metaTitleSuffix")}`,
    description: description ?? fallbackDescription,
    openGraph: {
      title: `${name} ${t("metaOgSuffix")}`,
      description: description ?? t("metaOgFallback", { name }),
    },
  }
```
Replace with:
```typescript
  const { name, description, about } = data.business
  const catLabel = data.business.category?.name ?? "local business"
  const fallbackDescription = t("metaFallbackDescription", { name, catLabel })
  const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"
  // Prefer the longer About copy (truncated) for the meta description.
  const aboutSnippet = about?.trim()
    ? about.trim().slice(0, 155).replace(/\s+\S*$/, "") + (about.trim().length > 155 ? "…" : "")
    : null
  const metaDescription = aboutSnippet ?? description ?? fallbackDescription
  return {
    title: `${name} — ${t("metaTitleSuffix")}`,
    description: metaDescription,
    keywords: [name, catLabel, "Lompoc CA", "Lompoc"],
    alternates: { canonical: `${siteUrl}/biz/${params.slug}` },
    openGraph: {
      title: `${name} ${t("metaOgSuffix")}`,
      description: metaDescription,
    },
  }
```

- [ ] **Step 2: Build**

Run: `npx next build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/(public)/biz/[slug]/page.tsx"
git commit -m "feat: About-driven meta description + canonical + keywords"
```

---

## Task 12: Related-businesses internal links + sitemap priority

**Files:**
- Modify: `lib/queries.ts` (new `getRelatedBusinesses`)
- Modify: `app/[locale]/(public)/biz/[slug]/page.tsx` (render strip)
- Modify: `app/sitemap.ts` (priority bump)

**Interfaces:**
- Produces:
  - `type RelatedBusinessCard = { name: string; slug: string; logoUrl: string | null; categoryName: string | null }`
  - `function getRelatedBusinesses(categoryId: number | null, excludeId: number, limit?: number): Promise<RelatedBusinessCard[]>`

- [ ] **Step 1: Add the query**

In `lib/queries.ts`, append:
```typescript
export type RelatedBusinessCard = {
  name: string
  slug: string
  logoUrl: string | null
  categoryName: string | null
}

/** Other approved businesses in the same category, for internal linking. */
export async function getRelatedBusinesses(
  categoryId: number | null,
  excludeId: number,
  limit = 4
): Promise<RelatedBusinessCard[]> {
  if (categoryId == null) return []
  const rows = await db
    .select({
      name: businesses.name,
      slug: businesses.slug,
      logoUrl: businesses.logoUrl,
      categoryName: categories.name,
    })
    .from(businesses)
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(
      and(
        eq(businesses.status, "approved"),
        eq(businesses.categoryId, categoryId),
        ne(businesses.id, excludeId)
      )
    )
    .orderBy(businesses.name)
    .limit(limit)
  return rows
}
```
If `ne` is not already imported from `drizzle-orm` in this file, add it to the existing `drizzle-orm` import (the file already imports `and`, `eq`, etc.).

- [ ] **Step 2: Verify the query typechecks**

Run: `npx tsc --noEmit`
Expected: PASS. (`lib/queries.ts` uses `@/`-aliased imports throughout, so verify via `tsc`/`next build` rather than a standalone `tsx` import. A runtime DB check happens during the Task 13 manual pass.)

- [ ] **Step 3: Fetch related businesses in the profile page**

In `app/[locale]/(public)/biz/[slug]/page.tsx`, add the import:
```typescript
import { getRelatedBusinesses } from "@/lib/queries"
```
(Adjust the existing `@/lib/queries` import to include `getRelatedBusinesses` if one already exists.)
After `const isRealEstate = ...` (and before the return), add:
```typescript
  const relatedBusinesses = await getRelatedBusinesses(
    business.categoryId,
    business.id,
    4
  )
```

- [ ] **Step 4: Render the related strip at the end of the body section**

In the same file, inside the final `<section className="mx-auto max-w-6xl px-4 py-10">`, after the closing `</div>` of the 2-column grid (the `grid grid-cols-1 ... lg:grid-cols-[1fr_320px]` block) and before that section's closing `</section>`, add:
```tsx
          {relatedBusinesses.length > 0 && business.category && (
            <div className="mt-12 border-t pt-8">
              <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">
                {t("moreInCategory", { category: business.category.name })}
              </h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {relatedBusinesses.map((rb) => (
                  <li key={rb.slug}>
                    <Link
                      href={`/biz/${rb.slug}`}
                      className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm transition-colors hover:bg-secondary"
                    >
                      <span className="truncate">{rb.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
```
(`Link` and `t` are already imported/defined in this file.)

- [ ] **Step 5: Bump business sitemap priority**

In `app/sitemap.ts`, in the `bizPages` map, change `priority: 0.6,` to `priority: 0.7,`.

- [ ] **Step 6: Build**

Run: `npx next build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/queries.ts "app/[locale]/(public)/biz/[slug]/page.tsx" app/sitemap.ts
git commit -m "feat: related-businesses internal links + sitemap priority bump"
```

---

## Task 13: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Unit tests + typecheck + build**

```bash
npx tsx lib/amenities.test.ts
npx tsx lib/business-jsonld.test.ts
npx tsx lib/gallery.test.ts
npx tsc --noEmit
npx next build
```
Expected: all three tests print `all passed`; tsc clean; build passes.

- [ ] **Step 2: JSON validity of message files**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8')); JSON.parse(require('fs').readFileSync('messages/es.json','utf8')); console.log('json ok')"`
Expected: prints `json ok`.

- [ ] **Step 3: Manual visual + data check (drive the running app)**

Start the dev server on a dedicated port:
```bash
npx next dev -p 3007
```
Then confirm:
- **Profile with seeded About/amenities:** the "About this place" card renders the paragraph + amenity grid; Google attribution caption shows when sourced from Google. (Seed a test business via `npm run db:studio` or a temporary SQL update if none exist yet; revert after.)
- **Profile with neither:** no About card renders (no hollow section).
- **Dashboard edit:** as a business owner, the profile form shows the About textarea + amenity checkboxes; saving persists them and (verify in DB) sets `about_source`/`amenities_source` = `'owner'`.
- **JSON-LD:** view source on a profile — exactly one `<script type="application/ld+json">` with valid `LocalBusiness` (or `Restaurant` for food) JSON; `food-drink` profiles show `"@type":"Restaurant"`; no `aggregateRating` key.
- **Meta:** the profile `<title>`, meta description (About-driven when present), and `<link rel="canonical">` are correct.
- **Related strip:** "More {category} in Lompoc" links render and resolve.

- [ ] **Step 4: Confirm scraper detail option (no destructive run)**

Review the actor options in `db/scrape-google-places.ts`; if running a sample scrape, confirm `place.additionalInfo` and `place.description` are present in the returned items (log one item). Do **not** run a full scrape as part of verification — the enrich path is guarded and safe, but a full run is a separate operation.

- [ ] **Step 5: Stop the dev server**

```bash
lsof -ti :3007 | xargs kill 2>/dev/null || true
```

---

## Notes for the implementer

- The migration (Task 1) must land before any task that reads/writes the new columns (Tasks 5, 7, 8, 10).
- `getBusinessBySlug` returns `{ ...biz, category, ownerEmail }`, so the new columns are automatically present on `business` in the profile page — no query change needed there.
- `getMyBusiness()` uses `findFirst` with no `columns` filter, so it already returns `about`/`amenitiesJson` — no query change needed for the dashboard.
- If the Apify actor does not return `additionalInfo`/`description` even with `scrapePlaceDetailPage: true`, the mapper degrades to `[]`/null and amenities rely on owner entry; the display, dashboard, JSON-LD, and source guard all still function.
