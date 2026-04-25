# Bilingual Coverage (English + Spanish) — Design Spec

**Date:** 2026-04-24
**Status:** Approved (awaiting implementation plan)
**Scope:** Phase 6 — make the entire app fully bilingual (English + Spanish). Replaces ~260 hardcoded English strings with `t()` calls, translates all of them via AI first pass + human review on high-impression pages, enables Spanish URL routing + browser auto-detection, adds a locale switcher, and threads user locale through transactional emails. Demo seed content gets bilingual coverage by adding 15 Spanish demo posts alongside the existing English ones.

---

## 1. Goal

The Lompoc community has a large Spanish-speaking population. Reaching them — both residents and Latin American visitors — is a significant growth opportunity. The directory currently presents English-only to every visitor, even though `messages/es.json` already contains 190 partially-translated keys. This phase ships full bilingual coverage in one PR: every visible string is translatable, browser-language detection works, a locale switcher is visible in the header + footer, and emails send in the recipient's preferred language.

**Personality / tone:** Spanish copy should feel native (not a literal English translation). Tone is warm-local, matching the brand voice already established on the English side. Brand names ("Lompoc Deals", "Lompoc", "Vandenberg", proper place names) stay untranslated everywhere — they are not translated.

**Non-goals:** auto-translating user-generated content, RTL language support, adding a third language, hreflang sitemap (deferred), per-page Spanish-only featured content (the `feed_posts.locale` filter is explicitly NOT added — both feeds show all posts).

---

## 2. Current state — context for the work

Audit performed 2026-04-24. Findings:

| Surface | Coverage |
|---|---|
| `next-intl` configuration | Wired but **disabled** — `localePrefix: "never"` and `localeDetection: false` in `i18n/routing.ts`. Spanish is currently unreachable. |
| `messages/en.json` and `messages/es.json` | 16 namespaces, ~190 keys each, parallel structure, zero drift. Partial coverage. |
| Site header, footer, user menu | Fully translated (use `getTranslations`). |
| Mobile menu | Fully hardcoded. |
| Homepage | ~95% hardcoded. |
| Town Feed (`/feed`, `/feed/[id]`, `/feed/post`, `/feed/my`, `/admin/feed`) | 100% hardcoded — Phase 5 shipped without translation. |
| For-businesses, deals, businesses directory, hotels, search, biz profile | ~95% hardcoded. |
| Login, signup forms | ~90% hardcoded. |
| Page `metadata` (titles + descriptions) | 100% hardcoded across every page sampled. |
| Email templates (`lib/email.ts`) | 100% hardcoded English. |
| Demo seed (`db/seed-feed-demo.ts`) | 100% English content. |
| Locale switcher UI | Does not exist. |

**Estimated work:** ~260 hardcoded strings to extract + translate, ~20 files modified, plus locale-switcher component, plus schema change for `users.locale`, plus demo seed expansion. Single PR.

---

## 3. Routing + browser auto-detection

### 3.1 `i18n/routing.ts` changes

```ts
// before
{ locales: ["en", "es"], defaultLocale: "en", localePrefix: "never", localeDetection: false }

// after
{ locales: ["en", "es"], defaultLocale: "en", localePrefix: "as-needed", localeDetection: true }
```

**Effect:**
- `localePrefix: "as-needed"` — English URLs stay unchanged (`/feed`, `/deals`, `/businesses`); Spanish lives at `/es/feed`, `/es/deals`, etc. **Zero SEO impact on existing English URLs** (no rewrites, no redirects).
- `localeDetection: true` — visitors with `Accept-Language: es-*` are redirected to `/es` on first visit; their choice is stored in the `NEXT_LOCALE` cookie and respected on return visits.
- Default locale stays `en` — visitors with no detected preference, or with `Accept-Language: en-*`, see English at the unprefixed URL.

### 3.2 Edge cases

- A logged-in user who set their preference via the switcher always wins over browser detection. The switcher writes the cookie; `next-intl` reads it on every request.
- Search engine crawlers will see two index-able versions of every page (`/feed` in English, `/es/feed` in Spanish). Hreflang is intentionally NOT added in this phase (deferred to a follow-up SEO phase).

---

## 4. Locale switcher UI

### 4.1 New component — `components/locale-switcher.tsx`

A two-pill toggle: `[ EN | ES ]`. Active pill has the brand-primary background; inactive pill is bordered. Clicking the inactive pill swaps the URL's locale prefix using `next-intl`'s `Link` (or programmatic `useRouter().replace`) and persists via the `NEXT_LOCALE` cookie. No full page reload.

**Variants:**
- Default (`<LocaleSwitcher />`) — used in header + footer
- Mobile (`<LocaleSwitcher variant="mobile" />`) — labeled row "Idioma: English / Español" inside `<MobileMenu />`

### 4.2 Placement

| Surface | Placement |
|---|---|
| `components/site-header.tsx` | Insert immediately to the left of `<UserMenu />` (desktop only, `hidden sm:block`) |
| `components/site-footer.tsx` | Insert in the bottom row alongside `madeWith` and `copyright` |
| `components/mobile-menu.tsx` | Insert as a row at the top of the menu, above `Home` |

### 4.3 Translation

Two new keys in the `locale.*` namespace:
- `locale.english` → "English" / "English" (en+es both say "English" — the English language label is "English" in both)
- `locale.spanish` → "Spanish" / "Español"
- `locale.label` → "Language" / "Idioma" (used as a small label above the toggle on mobile)

---

## 5. Message file structure + key naming

Stay with the existing convention: nested namespaces in `messages/en.json` and `messages/es.json`, parallel keys, kebab-case file names but camelCase JSON keys (matches what's already there).

### 5.1 Namespace inventory after this phase

```
nav.*               ✓ exists, no new keys
footer.*            ✓ exists, no new keys
userMenu.*          ✓ exists, no new keys
home.*              ✓ exists, +~80 new keys (hero, sections, FAQ, testimonials)
auth.*              new — login + signup form labels, validation messages
deals.*             ✓ exists, +~10 new keys (page heading, filter chips, empty state)
forBusinesses.*     new — hero, "How it works", benefits, pricing, final CTA, ~40 keys
hotels.*            ✓ exists, +~10 keys
businesses.*        new — directory page + biz profile, ~25 keys
feed.*              new — Town Feed page heading, filter chips, NEW badge, empty state, ~12 keys
feedPost.*          new — submission form labels + validation, ~25 keys
feedMy.*            new — "My posts" status labels (pending, live, rejected, expired, sold), buttons, ~15 keys
feedAdmin.*         new — admin moderation queue, ~15 keys
feedCard.*          new — type chips ("For sale", "Info", "Event"), price formats, NEW badge, ~8 keys
search.*            ✓ exists, +~5 keys
mobileMenu.*        new — mobile nav items, ~12 keys
locale.*            new — switcher labels ("English", "Español", "Language"/"Idioma"), 4 keys
emails.*            new — every transactional email subject + body, ~30 keys
errors.*            new — common error messages used by Zod validation + auth guards, ~10 keys
```

**Total after phase:** ~25 namespaces, ~450 keys. Single `messages/en.json` and `messages/es.json` files (no per-namespace splitting — keeps translation review simple).

### 5.2 Naming convention rules

- **Camel-case keys.** `feedPost.priceLabel`, never `feed-post.price-label`.
- **One namespace per page or feature.** Don't reuse `home.title` for the for-businesses page; use `forBusinesses.title`.
- **Avoid clever interpolation when a verbatim string works.** ICU MessageFormat (`{count, plural, one {...} other {...}}`) is used ONLY where pluralization actually matters (e.g., "1 post pending" / "12 posts pending"). Otherwise, plain strings.
- **Keys mirror the page hierarchy** when reasonable (e.g., `feedAdmin.queueEmpty` not `admin.feed.queue.empty`) — keeps the namespace tree shallow.

---

## 6. Per-page extraction workflow

For each page or component with hardcoded strings:

### 6.1 Server components (most pages)

```tsx
import { getTranslations } from "next-intl/server"

export default async function FeedPage(...) {
  const t = await getTranslations("feed")
  return (
    <h1>{t("heroTitle")}</h1>
    <p>{t("heroBody")}</p>
  )
}
```

### 6.2 Client components

```tsx
"use client"
import { useTranslations } from "next-intl"

export function FeedPostForm(...) {
  const t = useTranslations("feedPost")
  return <button type="submit">{t("submit")}</button>
}
```

### 6.3 Page metadata — `generateMetadata` async function

```tsx
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "feed" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}
```

Replaces every `export const metadata = {...}` on pages whose titles/descriptions vary by locale.

### 6.4 Mechanical replacement rules

- Replace JSX text: `Submit for review` → `{t("submit")}`
- Replace string props (placeholder, aria-label, alt): `placeholder="Enter address"` → `placeholder={t("addressPlaceholder")}`
- Don't touch identifiers, class names, route paths, or data values — only user-visible English copy.
- Brand names — "Lompoc Deals", "Lompoc", "Vandenberg," etc. — stay literal, NOT in `t()` calls. They appear as plain strings in JSX.
- Currency formatting (`$120`) and date formatting use existing `Intl.NumberFormat` / `Intl.DateTimeFormat` calls already in the codebase. Locale-aware automatically.

---

## 7. Email templates — bilingual sends based on user locale

### 7.1 Schema change — `users.locale`

```ts
// In db/schema.ts users table
locale: varchar("locale", { length: 5 }).notNull().default("en"),
```

`varchar(5)` accommodates `"en"` and `"es"` plus a buffer for future codes (e.g., `"es-MX"`) — though we never store more than 2 chars in v1. New Drizzle migration `0009_users_locale.sql`.

### 7.2 Capture at signup

The current locale of the request is already accessible via `next-intl`'s `getLocale()` helper from `next-intl/server`. Both `localSignupAction` (in `lib/user-signup-actions.ts`) and `businessSignupSubmitAction` (in `lib/business-signup-actions.ts`) read it before inserting the new user row:

```ts
import { getLocale } from "next-intl/server"

const locale = await getLocale()  // "en" or "es"
await db.insert(users).values({ email, passwordHash, role: "local", locale })
```

Existing rows default to `"en"` — fine; their behavior is unchanged.

### 7.3 Email function signature change

Each email function in `lib/email.ts` accepts a `locale` parameter:

```ts
export async function sendFeedApprovalEmail(
  toEmail: string,
  postTitle: string,
  locale: "en" | "es"
): Promise<void> {
  const subject = locale === "es"
    ? `Tu publicación "${postTitle}" está en vivo en Lompoc Deals`
    : `Your post "${postTitle}" is live on Lompoc Deals`

  const body = locale === "es"
    ? `<p>Buenas noticias — un administrador aprobó tu publicación...</p>`
    : `<p>Good news — an admin approved your post...</p>`

  await resend.emails.send({ from: FROM_ADDRESS, to: toEmail, subject, html: body })
}
```

Email functions don't use `t()` because they're not React. They use a per-function locale switch on inline message constants.

### 7.4 Call-site updates

Every email send call in `lib/admin-feed-actions.ts`, `lib/admin-actions.ts`, etc., must pass the recipient's `users.locale`. The query that loads the post + poster (e.g., `getPostAndPoster` in admin-feed-actions) selects `users.locale` and passes it to the email function.

---

## 8. Demo content — 15 EN + 15 ES posts (30 total)

`db/seed-feed-demo.ts` is extended with a parallel `DEMO_POSTS_ES: DemoFeedPost[]` array of 15 posts. Each Spanish post is a culturally-native equivalent (NOT a literal translation of the English ones — it's a separate set of plausible Spanish-language posts that read naturally to a Spanish speaker).

Examples of the Spanish demo content:
- `for_sale`: "Sofá vintage de mediados de siglo — buen estado", "Bicicleta de niño con rueditas", "Leña gratis — ya cortada"
- yard sales: "Venta familiar — sábado y domingo", "Venta de mudanza — todo debe irse"
- `info`: "Gato perdido — atigrado naranja cerca de Calle Real", "Reunión de la cuadra el sábado", "Aviso: corte de agua martes en la mañana"

Both arrays seed at run time. Total `feed_posts` rows after seeding: 30. Both `/feed` and `/es/feed` show all 30 — content is mixed-language in either feed view, mirroring how a real bilingual community board reads.

The 3 demo `events` get the same treatment: 3 in English, 3 in Spanish, 6 total.

---

## 9. Translation method recap

**Hybrid: AI first pass + human review on high-impression pages.** Locked.

- I (Claude) write the Spanish copy directly into `messages/es.json` myself in this session (no DeepL API key, no external service). Claude is fluent enough for utility copy and decent on marketing copy — sufficient for the first pass.
- After the AI pass, the user reviews the following high-impression pages for tone:
  - Homepage hero + section copy (`home.*`)
  - For-businesses page (`forBusinesses.*`)
  - Signup wizard (`auth.*` + business signup steps)
  - Town Feed page header (`feed.*` heroTitle/heroBody)
  - Locale switcher labels (`locale.*`)
- Other pages — admin, deals, dashboard, search, mobile menu, errors — ship with the AI pass without explicit user review. Easy to fix later if anything reads off.

Spanish demo seed content (the 15 Spanish posts in `db/seed-feed-demo.ts`) is also AI-generated by Claude and embedded directly in the script.

---

## 10. Files

### Created
- `components/locale-switcher.tsx`
- `lib/i18n-helpers.ts` — small helper to read current locale in server actions (`getCurrentLocale()`)
- `db/migrations/0009_users_locale.sql` — Drizzle-generated migration for the new column

### Modified — i18n setup
- `i18n/routing.ts` — `localePrefix: "as-needed"`, `localeDetection: true`
- `db/schema.ts` — `users.locale` column
- `messages/en.json` — extend ~190 → ~450 keys
- `messages/es.json` — mirror ~450 keys (AI-translated)

### Modified — page extraction (the bulk)
Server-component pages converted to use `getTranslations`:
- `app/[locale]/(public)/page.tsx` (homepage)
- `app/[locale]/(public)/deals/page.tsx`
- `app/[locale]/(public)/for-businesses/page.tsx`
- `app/[locale]/(public)/hotels/page.tsx`
- `app/[locale]/(public)/businesses/page.tsx`
- `app/[locale]/(public)/biz/[slug]/page.tsx`
- `app/[locale]/(public)/search/page.tsx`
- `app/[locale]/(public)/feed/page.tsx`
- `app/[locale]/(public)/feed/[id]/page.tsx`
- `app/[locale]/(public)/feed/my/page.tsx`
- `app/[locale]/(public)/locals/page.tsx`
- `app/[locale]/(auth)/login/page.tsx`
- `app/[locale]/(auth)/signup/page.tsx`
- `app/[locale]/(auth)/signup/user/page.tsx`
- `app/[locale]/(auth)/signup/business/page.tsx`
- `app/[locale]/(auth)/signup/business/profile/page.tsx`
- `app/[locale]/(auth)/signup/business/first-deal/page.tsx`
- `app/[locale]/admin/page.tsx`
- `app/[locale]/admin/feed/page.tsx`
- `app/[locale]/admin/events/page.tsx`
- `app/[locale]/admin/businesses/page.tsx`

Client components converted to use `useTranslations`:
- `components/mobile-menu.tsx`
- `components/feed-card.tsx`
- `components/feed-masonry.tsx`
- `app/[locale]/(public)/feed/post/feed-post-form.tsx`
- `app/[locale]/(auth)/signup/business/business-signup-wizard.tsx`
- `app/[locale]/(auth)/login/login-form.tsx`
- `app/[locale]/(auth)/signup/user/user-signup-form.tsx`

Other modifications:
- `components/site-header.tsx` — inject `<LocaleSwitcher />`
- `components/site-footer.tsx` — inject `<LocaleSwitcher />`
- `lib/email.ts` — locale parameter on every send function + per-locale message constants for each email type
- `lib/admin-feed-actions.ts`, `lib/admin-actions.ts`, etc. — pass `posterLocale` to email sends (load from joined `users.locale` column)
- `lib/business-signup-actions.ts`, `lib/user-signup-actions.ts` — capture `getLocale()` at signup, write to new `users.locale` column
- `db/seed-feed-demo.ts` — add 15 Spanish demo posts + 3 Spanish events

### Page metadata converted to `generateMetadata`
Every page that had `export const metadata = {...}` with English title/description gets converted to an async `generateMetadata({ params })` function reading from the corresponding namespace.

---

## 11. Schema migration

Single new migration `0009_users_locale.sql`:

```sql
ALTER TABLE users ADD COLUMN locale varchar(5) NOT NULL DEFAULT 'en';
```

Existing 23+ users default to `"en"` — their email behavior is unchanged. New users get whatever locale is detected at signup.

No index on `locale` — the column is read-only on the per-user lookup that already filters by `id` or `email`. No query benefits from indexing `locale`.

---

## 12. Performance + accessibility

- **Bundle size:** `next-intl` and the message JSON are already in the bundle. Adding ~260 keys grows `messages/*.json` by roughly 2-3 KB each (gzipped). Negligible.
- **SSR:** all pages stay server-rendered; `getTranslations` is server-only. No new client JS for translations.
- **Locale switcher:** ~1 KB component, server-rendered with a client-only swap on click via `next-intl`'s `<Link>`.
- **Accessibility:** locale switcher is a pair of `<Link>` elements (or `<button>` if using a programmatic swap), each with an `aria-pressed` indicating active state. Screen readers announce "Switch to Spanish" / "Switch to English."
- **Reduced motion:** unchanged — no new animations.

---

## 13. Open questions resolved

1. **Translation method?** → Hybrid: AI first pass + human review for homepage, for-businesses, signup, feed page, locale labels.
2. **Rollout?** → Full bilingual in one ship. Single PR.
3. **Demo posts?** → Add 15 Spanish demo posts alongside existing 15 English (30 total). Both feeds show all.
4. **Email locale?** → Bilingual based on user's locale. Schema change to add `users.locale` column.
5. **Routing prefix?** → `localePrefix: "as-needed"` so existing English URLs are unchanged.
6. **Browser detection?** → `localeDetection: true` so Spanish browsers auto-route to `/es`.
7. **Locale switcher placement?** → Header (next to UserMenu), footer (bottom row), and inside MobileMenu.
8. **Brand name handling?** → Untranslated. "Lompoc Deals", "Lompoc", "Vandenberg", proper place names stay literal.

---

## 14. Success criteria

Phase 6 is done when:

1. Visitor with `Accept-Language: es-MX` first-time visit lands on `/es` automatically. UI is in Spanish.
2. Visitor with `Accept-Language: en-US` first-time visit lands on `/` (English, unchanged URLs from production today).
3. Locale switcher in header swaps language; choice persists via cookie across sessions.
4. No hardcoded English strings remain on any page or component listed in §10. Brand names + user-generated content + proper place names allowed to remain literal.
5. Page `<title>` and `<meta description>` tags translate per locale.
6. Signup captures the user's current locale into `users.locale`.
7. Transactional emails (welcome, password reset, deal updates, feed approval, feed rejection, etc.) send in the recipient's locale.
8. `/feed` and `/es/feed` both show all 30 demo posts (15 English + 15 Spanish, mixed) — UI chrome translates per page locale, post content stays in whatever language it was written.
9. The 3 demo events appear in both languages (3 English + 3 Spanish, 6 total).
10. `prefers-reduced-motion` (Phase 4) and Lompoc ZIP guard (Phase 4 data) continue to work unchanged.
11. Lighthouse SEO score on `/` and `/es/` is unchanged or improved vs current production.
12. No console errors, no missing translation key warnings in dev logs after the seeder runs and a logged-in user navigates each main flow in both locales.
