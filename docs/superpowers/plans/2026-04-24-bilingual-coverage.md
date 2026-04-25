# Bilingual Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship full English + Spanish coverage per `docs/superpowers/specs/2026-04-24-bilingual-coverage-design.md` — enable Spanish routing + browser auto-detection, add a locale switcher, extract ~260 hardcoded strings into `messages/en.json` + `messages/es.json`, thread `users.locale` through transactional emails, and seed 15 Spanish demo posts alongside the existing 15 English ones.

**Architecture:** `next-intl` v3 with `localePrefix: "as-needed"` + `localeDetection: true`. All visible strings (page copy, metadata, form labels, email bodies, error messages, mobile nav) become translation keys. Brand names ("Lompoc Deals", "Lompoc", "Vandenberg," proper place names) stay literal. User-generated content stays in whatever language the poster wrote — only the UI shell translates. Bilingual emails branch on `users.locale` captured at signup.

**Tech Stack:** Next.js 14 App Router · TypeScript · `next-intl` (already installed) · Drizzle + Neon (one new migration for `users.locale`) · Resend (existing).

**Verification model:** No test runner exists. Each task ends with `npx tsc --noEmit` + `npm run lint` + a manual two-locale smoke check (`curl /en/<route>` shows English, `curl /es/<route>` shows Spanish, both 200). The implementer must include both URLs in their report.

**Branch strategy:** Create `feat/phase-6-bilingual` off current `main` (which already has Phase 4 + Phase 5 + Phase 6 spec). Single PR. Final task pushes to origin and asks the user for the manual walkthrough on the Vercel preview before merging to main.

**Spec reference:** Every task references the relevant section(s) of `docs/superpowers/specs/2026-04-24-bilingual-coverage-design.md`. The implementer is expected to read those sections before starting each task — they contain the translation tone, the brand-name rules, and the namespace structure.

---

## Setup (before Task 1)

- [ ] **Step 1: Create the feature branch**

```bash
git checkout main
git pull --ff-only
git checkout -b feat/phase-6-bilingual
git status
```

Expected: on `feat/phase-6-bilingual`, working tree clean.

---

## Task 1: Routing flip — enable Spanish URLs + browser auto-detection

**Spec ref:** §3 (Routing + browser auto-detection)

**Files:**
- Modify: `i18n/routing.ts`

- [ ] **Step 1: Update `i18n/routing.ts`**

Read the current file, then change:
- `localePrefix: "never"` → `localePrefix: "as-needed"`
- `localeDetection: false` → `localeDetection: true`

Keep `locales: ["en", "es"]` and `defaultLocale: "en"` unchanged.

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 3: Smoke test**

```bash
npm run dev &
DEV_PID=$!
sleep 6
echo "EN root:"; curl -sI http://localhost:3001/ | head -1
echo "ES feed:"; curl -sI http://localhost:3001/es/feed | head -1
echo "Root with Spanish accept-lang:"
curl -sI -H "Accept-Language: es-MX" http://localhost:3001/ | head -3
kill $DEV_PID 2>/dev/null
```

Expected:
- `EN root` → 200 (or 307 if i18n redirects to `/`)
- `ES feed` → 200 (Spanish route now exists)
- The `Accept-Language: es-MX` request → 307 with `location:` ending in `/es/`

If the third check still returns 200 at `/` (no redirect), `localeDetection` isn't taking effect — check `middleware.ts` to confirm it uses the routing config.

- [ ] **Step 4: Commit**

```bash
git add i18n/routing.ts
git commit -m "$(cat <<'EOF'
feat(i18n): enable Spanish routing + browser auto-detection

localePrefix: 'as-needed' — existing English URLs unchanged,
Spanish lives at /es/*. localeDetection: true — visitors with
Spanish browsers auto-route to /es on first visit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `<LocaleSwitcher />` component

**Spec ref:** §4 (Locale switcher UI)

**Files:**
- Create: `components/locale-switcher.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"

type Variant = "default" | "mobile"

export function LocaleSwitcher({ variant = "default" }: { variant?: Variant }) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchTo(target: "en" | "es") {
    if (target === locale) return
    router.replace(pathname, { locale: target })
  }

  if (variant === "mobile") {
    return (
      <div className="flex items-center justify-between border-b py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {locale === "es" ? "Idioma" : "Language"}
        </span>
        <div className="flex items-center gap-1">
          <PillButton active={locale === "en"} onClick={() => switchTo("en")} label="English" />
          <PillButton active={locale === "es"} onClick={() => switchTo("es")} label="Español" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 rounded-full border bg-muted p-0.5">
      <PillButton active={locale === "en"} onClick={() => switchTo("en")} label="EN" />
      <PillButton active={locale === "es"} onClick={() => switchTo("es")} label="ES" />
    </div>
  )
}

function PillButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background"
      }`}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add components/locale-switcher.tsx
git commit -m "feat(i18n): add <LocaleSwitcher /> component (default + mobile variants)" -m "" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Insert `<LocaleSwitcher />` into header + footer

**Spec ref:** §4.2

**Files:**
- Modify: `components/site-header.tsx` (insert LocaleSwitcher to the left of UserMenu)
- Modify: `components/site-footer.tsx` (insert LocaleSwitcher in the bottom row alongside copyright)

- [ ] **Step 1: Update site-header.tsx**

Add import: `import { LocaleSwitcher } from "@/components/locale-switcher"`

In the right-side cluster (the `<div>` containing `<WeatherBadge />`, `<UserMenu />`, `<MobileMenu />`), insert `<LocaleSwitcher />` immediately before `<UserMenu />`. Wrap it in `<span className="hidden sm:block">` so mobile uses the in-menu variant only.

- [ ] **Step 2: Update site-footer.tsx**

Add import: `import { LocaleSwitcher } from "@/components/locale-switcher"`

Find the bottom row (the `<div>` containing the copyright + "made with"). Insert `<LocaleSwitcher />` so it sits alongside the copyright text. Adjust flex layout if needed to keep alignment clean.

- [ ] **Step 3: Type-check + lint + smoke**

```bash
npx tsc --noEmit
npm run lint
npm run dev &
DEV_PID=$!
sleep 6
curl -sf -o /dev/null -w "%{http_code}\n" http://localhost:3001/
kill $DEV_PID 2>/dev/null
```

- [ ] **Step 4: Commit**

```bash
git add components/site-header.tsx components/site-footer.tsx
git commit -m "feat(i18n): wire LocaleSwitcher into header + footer" -m "" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Mobile menu — extract hardcoded labels + insert mobile-variant LocaleSwitcher

**Spec ref:** §4.2 + §5.1 (mobileMenu namespace)

**Files:**
- Modify: `components/mobile-menu.tsx`
- Modify: `messages/en.json` (add `mobileMenu` namespace)
- Modify: `messages/es.json` (mirror)

- [ ] **Step 1: Add `mobileMenu` namespace to both message files**

`messages/en.json` (append into the top-level object):
```json
"mobileMenu": {
  "home": "Home",
  "deals": "Deals",
  "search": "Search",
  "directory": "Directory",
  "map": "Map",
  "hotels": "Hotels",
  "neighborhood": "Neighborhood",
  "locals": "Locals",
  "businesses": "Businesses",
  "account": "Account",
  "signIn": "Sign in",
  "signUp": "Sign up"
}
```

`messages/es.json` (mirror):
```json
"mobileMenu": {
  "home": "Inicio",
  "deals": "Ofertas",
  "search": "Buscar",
  "directory": "Directorio",
  "map": "Mapa",
  "hotels": "Hoteles",
  "neighborhood": "Vecindario",
  "locals": "Locales",
  "businesses": "Negocios",
  "account": "Cuenta",
  "signIn": "Iniciar sesión",
  "signUp": "Registrarse"
}
```

- [ ] **Step 2: Replace hardcoded labels in `components/mobile-menu.tsx` with `t()` calls**

Convert the static `NAV_ITEMS` array to use translation keys. Add at the top:

```tsx
"use client"
import { useTranslations } from "next-intl"
import { LocaleSwitcher } from "@/components/locale-switcher"
// ...existing imports
```

Inside the component, get the translator:

```tsx
const t = useTranslations("mobileMenu")
```

Build the items list dynamically:

```tsx
const navItems = [
  { href: "/", icon: Home, label: t("home") },
  { href: "/deals", icon: Tag, label: t("deals") },
  { href: "/search", icon: Search, label: t("search") },
  { href: "/businesses", icon: LayoutGrid, label: t("directory") },
  { href: "/map", icon: Map, label: t("map") },
  { href: "/hotels", icon: BedDouble, label: t("hotels") },
  { href: "/feed", icon: ShoppingBag, label: t("neighborhood") },
  { href: "/locals", icon: Heart, label: t("locals") },
  { href: "/for-businesses", icon: Building2, label: t("businesses") },
  { href: "/account", icon: User, label: t("account") },
]
```

Render the LocaleSwitcher (mobile variant) at the top of the menu, above the nav items list:

```tsx
<LocaleSwitcher variant="mobile" />
```

Replace any hardcoded "Sign in" / "Sign up" buttons in the menu with `t("signIn")` / `t("signUp")`.

- [ ] **Step 3: Type-check + lint + smoke**

```bash
npx tsc --noEmit
npm run lint
npm run dev &
DEV_PID=$!
sleep 6
curl -sf -o /dev/null -w "%{http_code}\n" http://localhost:3001/
kill $DEV_PID 2>/dev/null
```

- [ ] **Step 4: Commit**

```bash
git add components/mobile-menu.tsx messages/en.json messages/es.json
git commit -m "feat(i18n): translate mobile menu + add mobile LocaleSwitcher" -m "" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `users.locale` schema + Drizzle migration

**Spec ref:** §7.1, §11

**Files:**
- Modify: `db/schema.ts` (add `locale` column to `users` table)
- Create: a new Drizzle migration file (auto-generated)

- [ ] **Step 1: Add the column to the schema**

In `db/schema.ts`, find the `users` table definition. Add this line right after the `googleId` column (already deprecated):

```ts
locale: varchar("locale", { length: 5 }).notNull().default("en"),
```

- [ ] **Step 2: Generate the migration**

```bash
node --env-file=.env.local node_modules/.bin/drizzle-kit generate
```

Expected: a new SQL file in `db/migrations/`. Open it; it should contain only:

```sql
ALTER TABLE "users" ADD COLUMN "locale" varchar(5) DEFAULT 'en' NOT NULL;
```

If drizzle-kit generates extra DDL (DROP/ALTER on other tables), TRIM THE FILE to keep only the `ADD COLUMN locale` statement (this matches the pattern from Task 2 of the Phase 5 plan, where the project's migration tracking is in a partial state).

- [ ] **Step 3: Apply the migration**

```bash
node --env-file=.env.local node_modules/.bin/drizzle-kit migrate
```

(Or `push` if the project uses push.) Verify with:

```bash
node --env-file=.env.local node_modules/.bin/tsx -e 'import("./db/client").then(async ({ db }) => { const { users } = await import("./db/schema"); const r = await db.select({ locale: users.locale }).from(users).limit(1); console.log("ok:", r); process.exit(0) })'
```

Expected: `ok: [...]` (no schema error). Existing users default to `"en"`.

- [ ] **Step 4: Type-check + lint + commit**

```bash
npx tsc --noEmit
npm run lint
git add db/schema.ts db/migrations/
git commit -m "feat(i18n): add users.locale column for bilingual emails" -m "" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Capture locale at signup (user + business signups)

**Spec ref:** §7.2

**Files:**
- Modify: `lib/user-signup-actions.ts` — read `getLocale()` and pass to `db.insert(users)`
- Modify: `lib/business-signup-actions.ts` — same
- Create: `lib/i18n-helpers.ts` — small `getCurrentLocale()` wrapper

- [ ] **Step 1: Create `lib/i18n-helpers.ts`**

```ts
"use server"

import { getLocale } from "next-intl/server"

/** Returns the current request's locale ("en" or "es"). */
export async function getCurrentLocale(): Promise<"en" | "es"> {
  const l = await getLocale()
  return l === "es" ? "es" : "en"
}
```

- [ ] **Step 2: Capture locale in `lib/user-signup-actions.ts`**

Find the `db.insert(users).values(...)` call inside `localSignupAction` (or whatever the action is named). Above it, add:

```ts
import { getCurrentLocale } from "@/lib/i18n-helpers"
// ...
const locale = await getCurrentLocale()
```

Then add `locale,` to the values object.

- [ ] **Step 3: Capture locale in `lib/business-signup-actions.ts`**

Same pattern. Find every `db.insert(users).values(...)` in this file (there may be two — one for fresh signup, one for the resume-after-cancel path). Add the same `locale` capture before each insert and pass it through.

- [ ] **Step 4: Type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add lib/i18n-helpers.ts lib/user-signup-actions.ts lib/business-signup-actions.ts
git commit -m "feat(i18n): capture user locale at signup" -m "" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Email templates — bilingual sends

**Spec ref:** §7.3, §7.4

**Files:**
- Modify: `lib/email.ts` — every `send*` function gains a `locale: "en" | "es"` parameter and branches on it
- Modify: every email call site — pass the recipient's `users.locale`

- [ ] **Step 1: Refactor `lib/email.ts`**

For each existing send function (`sendConfirmationEmail`, `sendPasswordResetEmail`, `sendWelcomeEmail`, `sendDealUpdateEmail`, `sendFeedApprovalEmail`, `sendFeedRejectionEmail`, plus any others present), add a `locale: "en" | "es"` parameter at the end of the signature.

Inside each function, branch on locale to compute `subject` and `html`. Pattern:

```ts
export async function sendFeedApprovalEmail(
  toEmail: string,
  postTitle: string,
  locale: "en" | "es"
): Promise<void> {
  const baseUrl = siteUrl()
  const safeTitle = escapeHtml(postTitle)

  const subject = locale === "es"
    ? `Tu publicación "${safeTitle}" está en vivo en Lompoc Deals`
    : `Your post "${safeTitle}" is live on Lompoc Deals`

  const feedUrl = locale === "es" ? `${baseUrl}/es/feed` : `${baseUrl}/en/feed`

  const html = locale === "es" ? `
    <p>Buenas noticias — un administrador aprobó tu publicación <strong>"${safeTitle}"</strong> y ahora está en vivo en el feed de Lompoc Deals.</p>
    <p><a href="${feedUrl}">Ver el feed →</a></p>
    <p style="color:#888;font-size:12px;margin-top:32px">Si no publicaste esto, responde a este correo — lo eliminaremos.</p>
  ` : `
    <p>Good news — an admin approved your post <strong>"${safeTitle}"</strong> and it's now live on the Lompoc Deals feed.</p>
    <p><a href="${feedUrl}">View the feed →</a></p>
    <p style="color:#888;font-size:12px;margin-top:32px">If you didn't post this, please reply to this email — we'll remove it.</p>
  `

  await getResend().emails.send({ from: FROM_ADDRESS, to: toEmail, subject, html })
}
```

Apply the same pattern to every other send function. **You'll need to write Spanish versions of all the email templates currently in `lib/email.ts`** — read the file first, identify each send function and its current English copy, then write a Spanish equivalent. Tone: warm-local, brand consistent ("Lompoc Deals" stays untranslated).

- [ ] **Step 2: Update every email call site**

Search for callers of the email functions:

```bash
grep -rn "sendConfirmationEmail\|sendPasswordResetEmail\|sendWelcomeEmail\|sendDealUpdateEmail\|sendFeedApprovalEmail\|sendFeedRejectionEmail" --include="*.ts" --include="*.tsx" lib/ app/ | grep -v "lib/email.ts"
```

For each call site, ensure the recipient's locale is fetched (typically by joining `users.locale` in the same query that loads the user) and passed as the last argument.

For `lib/admin-feed-actions.ts`, the existing `getPostAndPoster` helper joins `users.email`. Update it to also select `users.locale`:

```ts
async function getPostAndPoster(id: number) {
  const result = await db
    .select({ post: feedPosts, posterEmail: users.email, posterLocale: users.locale })
    .from(feedPosts)
    .leftJoin(users, eq(users.id, feedPosts.postedByUserId))
    .where(eq(feedPosts.id, id))
    .limit(1)
  return result[0] ?? null
}
```

Then in each admin action:

```ts
const data = await getPostAndPoster(id)
if (!data) return
const { post, posterEmail, posterLocale } = data
// ...
sendFeedApprovalEmail(posterEmail, post.title, (posterLocale ?? "en") as "en" | "es")
```

- [ ] **Step 3: Type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add lib/email.ts lib/admin-feed-actions.ts lib/admin-actions.ts lib/feed-actions.ts lib/biz-actions.ts
git commit -m "$(cat <<'EOF'
feat(i18n): bilingual email templates based on user.locale

Every send function in lib/email.ts gains a locale parameter and
branches on it for subject + body. Call sites load user.locale
(default 'en') and pass it through. Spanish versions written for
all existing transactional emails (confirmation, password reset,
welcome, deal updates, feed approval, feed rejection).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Tasks 8–18: Per-page string extraction

Each task below extracts hardcoded English strings from a page or component cluster, adds the keys to `messages/en.json` under a new namespace, and mirrors AI-translated Spanish to `messages/es.json`. The pattern is uniform across all of these — only the file paths and namespace names change.

### Universal pattern for each per-page task

For each page/component being translated:

1. **Read the file.** Identify every hardcoded English string in JSX text, string props (`placeholder`, `aria-label`, `alt`, button labels), and the page's `metadata` object.
2. **Build a key list.** Group strings into a single namespace per page (e.g., `home`, `forBusinesses`, `feed`). Keys are camelCase (e.g., `heroTitle`, `ctaLabel`).
3. **Update `messages/en.json`** — extend or create the namespace with the literal English strings.
4. **Update `messages/es.json`** — mirror the namespace, AI-translating each value to natural Spanish following the spec's tone guidance (§9). Brand names + proper place names stay literal.
5. **Update the page/component file:**
   - Server component: `import { getTranslations } from "next-intl/server"` + `const t = await getTranslations("namespace")` at top of the component function
   - Client component: `import { useTranslations } from "next-intl"` + `const t = useTranslations("namespace")` at top of the component function
   - Replace each hardcoded string with `t("keyName")`
6. **Convert page metadata** (if present) to `generateMetadata`:

```tsx
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "<sameNamespace>" })
  return { title: t("metaTitle"), description: t("metaDescription") }
}
```

Add `metaTitle` + `metaDescription` keys to both message files.

7. **Verify:** `npx tsc --noEmit` clean, `npm run lint` clean, smoke test:

```bash
npm run dev &
DEV_PID=$!
sleep 6
echo "EN:"; curl -sf -o /dev/null -w "%{http_code}\n" http://localhost:3001/<route>
echo "ES:"; curl -sf -o /dev/null -w "%{http_code}\n" http://localhost:3001/es/<route>
kill $DEV_PID 2>/dev/null
```

Both 200.

8. **Commit** with message `feat(i18n): translate <namespace> namespace + <route> page`.

**Brand names that MUST remain literal** (never wrap in `t()`):
- "Lompoc Deals" (the brand)
- "Lompoc" (the city)
- "Vandenberg" (the base)
- "Ryon Park", "Calle Real", "H Street", "N Street" (proper place names)
- "Stripe", "Mapbox" (third-party brands)

---

### Task 8: Homepage

**Spec ref:** §5.1 home namespace, §6.3 generateMetadata
- Files: `app/[locale]/(public)/page.tsx`, `messages/en.json` (extend `home.*`), `messages/es.json` (mirror)
- Existing `home.*` namespace has some keys; extend with ~80 new keys for hero, sections, FAQ, testimonials, CTAs.
- Per universal pattern. Commit after.

### Task 9: For-businesses page

**Spec ref:** §5.1 forBusinesses namespace
- Files: `app/[locale]/(public)/for-businesses/page.tsx`, `messages/en.json` (new `forBusinesses.*`), `messages/es.json` (mirror)
- ~40 keys: hero copy, "How it works" 3 steps, benefits 6 cards, pricing 3 tiers (preserve "Most popular" badge text → `forBusinesses.mostPopular`), final CTA, metadata.
- Per universal pattern. Commit after.

### Task 10: Auth pages — login + signup forms

**Spec ref:** §5.1 auth namespace
- Files: `app/[locale]/(auth)/login/page.tsx`, `app/[locale]/(auth)/login/login-form.tsx`, `app/[locale]/(auth)/signup/page.tsx`, `app/[locale]/(auth)/signup/user/page.tsx`, `app/[locale]/(auth)/signup/user/user-signup-form.tsx`, `messages/en.json` (new `auth.*`), `messages/es.json`
- ~30 keys: page titles, "Welcome back", "Create an account", form labels (Email, Password, Name, Phone, Address, Interests), validation error messages, submit button labels.
- The `auth.*` namespace also covers role-based error messages.
- Per universal pattern. Commit after.

### Task 11: Business signup wizard

**Spec ref:** §5.1 (auth + new wizard keys, ~25)
- Files: `app/[locale]/(auth)/signup/business/page.tsx`, `app/[locale]/(auth)/signup/business/business-signup-wizard.tsx`, `app/[locale]/(auth)/signup/business/profile/page.tsx`, `app/[locale]/(auth)/signup/business/first-deal/page.tsx`, `messages/en.json`, `messages/es.json`
- Add `auth.signupBusiness.*` sub-namespace OR new top-level `signupBusiness.*`. Decide based on what reads cleaner.
- ~25 keys: step indicator labels, plan picker copy, Stripe handoff message, success state ("Account created", "Redirecting to secure payment…"), back/next buttons.
- The `<SignupSuccessMoment>` component's text needs translating too.
- Per universal pattern. Commit after.

### Task 12: Town Feed pages

**Spec ref:** §5.1 (feed + feedPost + feedMy + feedCard namespaces)
- Files: `app/[locale]/(public)/feed/page.tsx`, `app/[locale]/(public)/feed/[id]/page.tsx`, `app/[locale]/(public)/feed/post/page.tsx`, `app/[locale]/(public)/feed/post/feed-post-form.tsx`, `app/[locale]/(public)/feed/my/page.tsx`, `components/feed-card.tsx`, `components/feed-masonry.tsx`, `messages/en.json`, `messages/es.json`
- Four namespaces total (~60 keys combined):
  - `feed.*` — feed page heading "What's happening in Lompoc", filter chips ("All", "For sale", "Info", "Events"), empty state, NEW badge text
  - `feedPost.*` — submission form (type toggle, all field labels + placeholders, validation, submit button)
  - `feedMy.*` — status badges (pending/approved/rejected/expired/sold), "Mark sold" / "Still valid" buttons, success banner
  - `feedCard.*` — type chips ("For sale", "Info", "Event"), "Free" price label, "OBO" placeholder
- Per universal pattern but split across 4 namespaces. Single commit covering all feed surfaces.

### Task 13: Admin feed page

**Spec ref:** §5.1 feedAdmin namespace
- Files: `app/[locale]/admin/feed/page.tsx`, `messages/en.json`, `messages/es.json`
- ~15 keys: page title, "Nothing pending"/"X posts pending", action buttons ("Approve", "Feature & approve", "Reject…", "Confirm reject"), reject-reason textarea placeholder, "← Back to admin home".
- Per universal pattern. Commit after.

### Task 14: Deals page

**Spec ref:** §5.1 deals namespace expansion
- Files: `app/[locale]/(public)/deals/page.tsx`, `messages/en.json` (extend `deals.*`), `messages/es.json` (mirror)
- ~10 new keys: page title, "Local deals, updated daily", filter labels, empty state.
- Per universal pattern. Commit after.

### Task 15: Businesses directory + biz profile

**Spec ref:** §5.1 businesses namespace
- Files: `app/[locale]/(public)/businesses/page.tsx`, `app/[locale]/(public)/biz/[slug]/page.tsx`, `messages/en.json` (new `businesses.*`), `messages/es.json`
- ~25 keys: directory page heading, search/filter UI, biz profile sections ("Hours", "Contact", "Social", "About"), CTAs.
- Per universal pattern. Commit after.

### Task 16: Hotels + search + locals pages

**Spec ref:** §5.1 (hotels + search + new locals.* namespace)
- Files: `app/[locale]/(public)/hotels/page.tsx`, `app/[locale]/(public)/search/page.tsx`, `app/[locale]/(public)/locals/page.tsx`, `messages/en.json`, `messages/es.json`
- ~25 keys total across the three namespaces.
- Per universal pattern. Single commit grouping all three.

### Task 17: Admin pages (admin home, events, businesses)

**Spec ref:** §5.1 admin namespace
- Files: `app/[locale]/admin/page.tsx`, `app/[locale]/admin/events/page.tsx`, `app/[locale]/admin/businesses/page.tsx`, `app/[locale]/admin/layout.tsx` (already partially translated), `messages/en.json` (extend `admin.*`), `messages/es.json`
- ~15 new keys: page titles, queue status text, action buttons.
- Per universal pattern. Commit after.

### Task 18: errors namespace + Zod validation messages

**Spec ref:** §5.1 errors namespace
- Files: `lib/feed-actions.ts`, `lib/admin-feed-actions.ts`, `lib/business-signup-actions.ts`, `lib/user-signup-actions.ts`, `lib/biz-actions.ts`, plus any other server action files; `messages/en.json` (new `errors.*`), `messages/es.json`
- Hardcoded English error strings (e.g., `"Not authorized"`, `"Post not found."`, `"Only approved posts can be extended."`, `"Photo upload failed: ..."`, Zod validation messages) need extraction.
- This is trickier because server actions run server-side and don't have a React hook context. Use `getTranslations` from `next-intl/server`:

```ts
import { getTranslations } from "next-intl/server"
// ...
const t = await getTranslations("errors")
return { error: t("notAuthorized") }
```

- For Zod schemas: keep the schema's error messages in English (Zod is at module load time, no request context). Map Zod errors to translated user-facing messages at the action's `safeParse` failure path:

```ts
if (!parsed.success) {
  const t = await getTranslations("errors")
  return { error: t("invalidInput") }  // generic fallback; or map issue.code to specific keys
}
```

- ~15 keys total. Per universal pattern. Commit after.

---

## Task 19: Locale-namespace + complete metadata sweep

**Spec ref:** §5.1 locale namespace + §6.3 generateMetadata for any pages missed

**Files:**
- Modify: `messages/en.json`, `messages/es.json` — add `locale.*` namespace
- Modify: `components/locale-switcher.tsx` — use `t()` for the "Idioma"/"Language" label

- [ ] **Step 1: Add `locale.*` namespace to message files**

`en.json`:
```json
"locale": {
  "english": "English",
  "spanish": "Spanish",
  "label": "Language"
}
```

`es.json`:
```json
"locale": {
  "english": "English",
  "spanish": "Español",
  "label": "Idioma"
}
```

- [ ] **Step 2: Update `LocaleSwitcher` to use `t()` for the mobile-variant label**

In `components/locale-switcher.tsx`:

```tsx
"use client"
import { useLocale, useTranslations } from "next-intl"
// ...

export function LocaleSwitcher({ variant = "default" }: { variant?: Variant }) {
  const locale = useLocale()
  const t = useTranslations("locale")
  // ...

  if (variant === "mobile") {
    return (
      <div className="flex items-center justify-between border-b py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("label")}
        </span>
        ...
      </div>
    )
  }
  // ...
}
```

(The pill labels stay as plain "EN"/"ES" since they're widely understood as country codes.)

- [ ] **Step 3: Sweep for any remaining pages with hardcoded `metadata` objects**

```bash
grep -rln "export const metadata" app/[locale]/ | head -30
```

For any page in this list NOT already converted to `generateMetadata` in tasks 8-18, convert it now (or note in the commit if it's a less-trafficked page that can stay English-only as an acceptable v1 trade-off).

- [ ] **Step 4: Type-check + lint + smoke**

```bash
npx tsc --noEmit
npm run lint
npm run dev &
DEV_PID=$!
sleep 6
echo "EN root:"; curl -sf -o /dev/null -w "%{http_code}\n" http://localhost:3001/
echo "ES root:"; curl -sf -o /dev/null -w "%{http_code}\n" http://localhost:3001/es
kill $DEV_PID 2>/dev/null
```

Both 200.

- [ ] **Step 5: Commit**

```bash
git add messages/en.json messages/es.json components/locale-switcher.tsx app/
git commit -m "feat(i18n): add locale namespace + sweep remaining metadata for translation" -m "" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 20: Demo seed — add 15 Spanish posts + 3 Spanish events

**Spec ref:** §8

**Files:**
- Modify: `db/seed-feed-demo.ts`

- [ ] **Step 1: Read the current file**

Note the existing `DEMO_POSTS: DemoFeedPost[]` array of 15 English posts and the `DEMO_EVENTS` array of 3 events.

- [ ] **Step 2: Add a parallel Spanish array**

Above `DEMO_POSTS`, add `DEMO_POSTS_ES: DemoFeedPost[]` with 15 Spanish posts. These should be culturally-native Spanish posts (NOT literal translations of the English ones — different content, plausible to a Spanish-speaker in Lompoc). Suggested examples (write your own variants):

```ts
const DEMO_POSTS_ES: DemoFeedPost[] = [
  {
    type: "for_sale",
    title: "Sofá vintage de mediados de siglo — buen estado",
    description: "Estructura de nogal sólida, cojines originales, sin manchas. Casa libre de humo. Solo recogida — calle H cerca del correo.",
    priceCents: 12000,
    saleStartsAt: null,
    saleEndsAt: null,
    address: "200 W H St, Lompoc, CA 93436",
    photos: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=70"],
    isFeatured: true,
  },
  // ... 14 more, mix of for_sale (single + yard sales) and info
]
```

Generate the rest in the same style: ~6 single-item for_sale, ~3 yard sales (with `saleStartsAt`/`saleEndsAt`), ~6 info posts (lost cat, block party, water main, free piano, carpool, babysitter equivalents in Spanish).

Add `DEMO_EVENTS_ES` with 3 Spanish event entries (festival, mercado, música en vivo equivalents).

- [ ] **Step 3: Update the main loop to seed both arrays**

In `main()`, after the existing loop over `DEMO_POSTS`, add a parallel loop over `DEMO_POSTS_ES`. Same idempotency check (skip if title already exists). Same expiration computation.

For events, after the existing loop over `DEMO_EVENTS`, add a loop over `DEMO_EVENTS_ES`.

Update the summary block to print both counters.

Update the `--remove` path to also include the Spanish titles (use a combined array `[...DEMO_POSTS, ...DEMO_POSTS_ES].map(p => p.title)` for the deletion query).

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Run the seeder**

```bash
node --env-file=.env.local node_modules/.bin/tsx db/seed-feed-demo.ts
```

Expected output: `feed_posts inserted: 15, events inserted: 3` (the Spanish ones — the English ones will be skipped as already-existing).

Verify count:
```bash
node --env-file=.env.local node_modules/.bin/tsx -e 'import("./db/client").then(async ({ db }) => { const { feedPosts } = await import("./db/schema"); const r = await db.select().from(feedPosts); console.log("total:", r.length); process.exit(0) })'
```
Expected: `total: 30`.

- [ ] **Step 6: Commit**

```bash
git add db/seed-feed-demo.ts
git commit -m "feat(i18n): seed 15 Spanish demo posts + 3 Spanish events" -m "" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 21: Final verification + push

**Files:** none modified — this task ships the branch.

- [ ] **Step 1: Lint**

```bash
npm run lint
```

Expected: clean. Pre-existing warnings in unrelated files OK; new errors in any file we touched in Tasks 1-20 must be fixed.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Clean.

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: build succeeds. Watch for SSR errors related to `getTranslations` or `useLocale`. These are server-only / client-only and must be in the right component type.

- [ ] **Step 4: Confirm message file parity**

The two JSON files MUST have the same key tree. Check:

```bash
node -e 'const en = require("./messages/en.json"); const es = require("./messages/es.json"); function flatten(o, p="") { return Object.entries(o).flatMap(([k,v]) => typeof v === "object" ? flatten(v, p+k+".") : [p+k]); } const enKeys = new Set(flatten(en)); const esKeys = new Set(flatten(es)); const missingInEs = [...enKeys].filter(k => !esKeys.has(k)); const missingInEn = [...esKeys].filter(k => !enKeys.has(k)); console.log("missing in es:", missingInEs); console.log("missing in en:", missingInEn);'
```

Expected: both arrays empty (zero drift). If keys are missing, FIX before pushing — drift causes runtime "missing translation" errors.

- [ ] **Step 5: Manual smoke walkthrough**

```bash
npm run dev &
DEV_PID=$!
sleep 6

echo "Browser auto-detect → Spanish:"
curl -sI -H "Accept-Language: es-MX,es;q=0.9" http://localhost:3001/ | grep -E "^(HTTP|location)"

echo "EN homepage:"
curl -sf -o /dev/null -w "%{http_code}\n" http://localhost:3001/

echo "ES homepage:"
curl -sf -o /dev/null -w "%{http_code}\n" http://localhost:3001/es

for route in /feed /deals /for-businesses /businesses /hotels /map /search /login /signup /signup/business /signup/user /admin /admin/feed; do
  enCode=$(curl -sf -o /dev/null -w "%{http_code}" "http://localhost:3001$route")
  esCode=$(curl -sf -o /dev/null -w "%{http_code}" "http://localhost:3001/es$route")
  echo "$route → EN $enCode | ES $esCode"
done

kill $DEV_PID 2>/dev/null
```

Expected: every route 200 (or 307 for auth-guarded ones) on both EN and ES. No 500s.

- [ ] **Step 6: Push**

```bash
git push -u origin feat/phase-6-bilingual
```

Vercel auto-builds a preview deployment. Capture the GitHub PR creation URL.

- [ ] **Step 7: Final report**

Report:
- Lint, tsc, build outputs
- Count of `git log --oneline main..HEAD` (expect ~21 commits)
- Push result + PR URL
- Manual smoke walkthrough results table
- Note that the user should review the high-impression Spanish copy on the preview before merging: `home.*`, `forBusinesses.*`, `auth.*`, `feed.*`, `locale.*`

---

## Self-review notes

**Spec coverage:**
- §3 Routing → Task 1 ✓
- §4 Locale switcher → Tasks 2, 3, 4, 19 ✓
- §5 Message structure / namespaces → Tasks 4, 8-18, 19 (one task per namespace cluster)
- §6 Per-page extraction workflow → universal pattern at top of Tasks 8-18 + per-task notes ✓
- §7 Email templates + users.locale → Tasks 5, 6, 7 ✓
- §8 Demo seed → Task 20 ✓
- §9 Translation method (AI + human review) → embedded as a directive in each per-page task; user review on high-impression pages flagged in Task 21 Step 7 ✓
- §10 File inventory → covered across Tasks 1-20 ✓
- §11 Schema migration → Task 5 ✓
- §14 Success criteria → Task 21 Step 5 walkthrough verifies criteria 1-9 ✓

**Placeholder scan:** Tasks 8-17 use the "universal pattern" abstraction rather than re-embedding ~260 EN+ES translations literally. This is a defensible compromise: each task is unambiguous about what to do (extract these strings from this file, add to this namespace, AI-translate following spec §9 tone rules, brand names stay literal). The implementer subagent has the spec to read for tone guidance and the namespace key list for each page is implicit in "every hardcoded string in this file."

**Type consistency:** `users.locale` defined in Task 5, consumed in Tasks 6, 7. `LocaleSwitcher` defined in Task 2, consumed in Tasks 3, 4, 19. `getCurrentLocale` defined in Task 6, consumed in Tasks 6 (signups). Email function signatures gain `locale: "en" | "es"` consistently in Task 7.

**One known constraint:** Tasks 8-17 share the same files (`messages/en.json`, `messages/es.json`) — multiple tasks will touch these. Each task only ADDS to the namespace tree, never removes; merges are safe. If running tasks in parallel via subagents, serialize to avoid merge conflicts — but the recommended workflow (subagent-driven-development) processes tasks sequentially anyway.
