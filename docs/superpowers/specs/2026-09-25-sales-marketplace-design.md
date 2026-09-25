# Lompoc Sales — a local marketplace (design)

**Date:** 2026-09-25 · **Status:** approved in conversation, phase 1 to build · **Owner ask:** "let's build a space called Sales… garage sales, yard sales, sales for individuals… car sales and used things, just like the Facebook groups. We are trying to fight with the Facebook groups so we can bring attention to the platform. They need an account to sell. Make it like a marketplace and categorize their announcements."

Decisions taken with the owner (2026-09-25): buyer contacts seller through a **contact form (email relay) + optional phone**; **admin approves every listing before it goes live**.

## 1. What it is

`/sales` (en) / `/es/sales` — *Lompoc Sales*: a categorized marketplace for locals in Lompoc + Vandenberg (93436/37/38). Post a garage sale, a used couch, a truck. **Account required to post** (existing `local` or `business` account). **Free for individuals.** Every listing is approved by an admin before it appears.

Not in scope: payments between people, shipping, in-app chat, anything outside the Lompoc valley.

## 2. Data model

New tables (Drizzle, `db/schema.ts`):

```
sale_listings
  id serial pk
  user_id int not null → users.id (on delete cascade)
  kind          enum sale_kind: item | garage-sale | vehicle
  category      varchar(32): garage-sales | vehicles | furniture | electronics | tools | baby-kids |
                clothing | home-garden | sports-outdoors | appliances | free | other
  title         varchar(120) not null
  description   text not null;  description_es text (auto-translated via lib/translate-content.ts)
  price_cents   int null (null = garage sale)   price_type varchar(8): fixed | obo | free
  condition     varchar(12) null: new | like-new | good | fair       (items + vehicles)
  attrs         jsonb null   — vehicles: {year, make, model, mileage, transmission?}
  photos        jsonb string[] (max 8, Blob URLs, client re-encoded via lib/client-image.ts)
  address       text null     — garage sales only (exact); items/vehicles store `area` only
  area          varchar(60) null — a neighborhood / cross streets, free text, shown publicly
  lat, lng      double null   — geocoded for garage sales (lib/geocode.ts), must land in 93436/37/38
  starts_at, ends_at timestamptz null — garage sales (date + hours)
  contact_phone varchar(30) null;  show_phone boolean default false
  status        enum sale_status: pending | active | sold | expired | hidden | rejected
  reject_reason text null
  expires_at    timestamptz not null — items/vehicles: approved_at + 30 days; garage sales: ends_at
  view_count    int default 0
  approved_at timestamptz, approved_by int → users.id
  created_at, updated_at

sale_messages   (buyer → seller, relayed by email; the seller's address never leaves the server)
  id, listing_id → sale_listings (cascade), name varchar(200), email varchar(320), phone varchar(50) null,
  message text, source_path varchar(300), created_at, emailed_at

sale_reports
  id, listing_id → sale_listings (cascade), reporter_user_id int null, reporter_email varchar(320) null,
  reason varchar(40) (scam | prohibited | wrong-category | duplicate | other), note text null, created_at,
  resolved_at timestamptz null
```

Migration: the 4 rows in `garage_sales` become `sale_listings` with `kind = 'garage-sale'`, `status = 'expired'` (they are from April), `user_id` from `posted_by_user_id` (rows with no user are dropped). `/garage-sales` and `/garage-sales/[id]` redirect permanently to `/sales/c/garage-sales` and `/sales/[id]`. The old table and API route are removed in the same migration.

Indexes: `(status, expires_at)`, `(category, status)`, `(user_id)`.

## 3. Flows

### Post — `/sales/post` (signed in; otherwise `/login?next=/sales/post`)
1. Kind: *Item · Garage sale · Vehicle* (three big buttons).
2. Category (filtered by kind), title, description, photos (up to 8; first = cover), price + type (or free), condition; vehicles: year / make / model / mileage; garage sales: address, date, hours.
3. Location: garage sales → full address (geocoded; refused outside the three ZIPs); items/vehicles → `area` text ("North side, near Ryon Park").
4. Contact: the message form is always on; phone optional with a "show my number" toggle.
5. Submit → `status = pending`. Confirmation screen: "We review every post; you'll get an email when it's live — usually the same day." `notifyPlatform("🛒 New sale listing to review", …)` to hello@.

Limits: a user may have at most **5 pending** listings; a listing needs at least one photo except *free* and garage sales; title and description are plain text (no links in title). `users.email_verified` must be set to post — if signup does not set it today, phase 1 adds a one-click verify email on first post attempt.

### Approve — `/admin/sales`
Queue of pending listings with photos, poster's account (name, email, join date, prior listings), category, price. **Approve** → `active`, `approved_at`, `expires_at`, email the seller ("your listing is live" with the link). **Reject** with a reason → `rejected`, email the seller with the reason. Also: **Hide** any active listing (abuse), **Block user** (flag on `users`: `sales_blocked_at` — blocked users cannot post), and a **Reports** tab listing open `sale_reports` with the same actions.

### Browse — `/sales`
ISR (`revalidate = 300`). Category chips, filters *Free* / *Under $100* / *Vehicles*, sort newest; instant client-side search over title/description like `/search`. Card: cover photo, title, price (or FREE / dates for a garage sale), area, "posted 2h ago". `/sales/c/[category]` — same grid, one category, its own title/description for SEO ("Used cars for sale in Lompoc"). Empty state per category invites posting.

### Listing — `/sales/[id]`
Gallery (reuse `components/property-photos.tsx` / `photo-lightbox.tsx` patterns), price, condition/attrs, area or (garage sale) address + map pin + dates, description EN/ES, seller first name + "member since", **Message seller** (name, email, phone optional, message → `sale_messages`; Resend email to the seller with reply-to = buyer; hello@ NOT copied — private), **tap-to-call / text** when `show_phone`, **Report** (reason picker → `sale_reports`, thanks screen), share button. Own OG image (photo + price + "Lompoc Sales"). Sold/expired listings render with a banner and no contact form; hidden/rejected/pending → 404 for everyone but the owner/admin.

### Mine — `/account/sales`
My listings with status; actions: mark sold, edit (edits of an active listing go back to `pending` only if title/photos/price changed), renew (+30 days, max 3 renewals), delete.

### Expiry
Daily cron (`/api/cron/sales-expire`) flips `active` past `expires_at` to `expired` and emails the seller a "renew?" link once.

## 4. Pages, i18n, SEO, social

- Routes: `app/[locale]/(public)/sales/{page,c/[category]/page,[id]/page,[id]/opengraph-image,post/page}.tsx`, `app/[locale]/account/sales/page.tsx`, `app/[locale]/admin/sales/page.tsx`, `app/api/cron/sales-expire/route.ts`, actions in `lib/sales-actions.ts`, queries in `lib/sales-queries.ts`.
- `t()` everywhere, `messages/en.json` + `messages/es.json` under `sales.*`; descriptions translated on approval (not on submit — don't pay to translate spam).
- Sitemap: active listings + category pages. JSON-LD `Product` on listings with a price.
- Homepage tile and the nav tab **wait for inventory** (nav rule: no new tabs without data). Phase 3: Monday-email "Sales this week" block, a weekly "Sales of the week" video format in the kit, "posted on Lompoc Locals" share card sized for Facebook groups.
- Never "Explore" wording; no owner name anywhere; costs: all public pages ISR, images through the existing optimizer rules.

## 5. Abuse and privacy

Admin approval is the gate. Additional: verified email to post, 5-pending cap, blocked-user flag, report button, message relay (seller email hidden; buyer email shown to seller as reply-to), rate limit on `sale_messages` (5 per listing per email per day), phone shown only on opt-in, garage-sale exact addresses shown only while the sale is active (then hidden). Prohibited categories are handled by rejection with a canned reason list (weapons, animals, counterfeit, tickets above face, anything illegal).

## 6. Phases

1. **MVP (ship first):** schema + migration + redirects · `/sales`, `/sales/c/[category]`, `/sales/[id]` · `/sales/post` · `/admin/sales` approve/reject/hide/block · message-seller relay · seller emails · `check-production.mjs` section for `/sales`.
2. `/account/sales` (sold/edit/renew/delete) · reports · expiry cron · OG share cards · Spanish descriptions · sitemap/JSON-LD.
3. Homepage tile · nav tab · digest block · "Sales of the week" video · optional paid *Featured* boost (Stripe, later decision).

## 7. Testing

- Unit: listing validation (ZIP fence, photo/price rules, pending cap), status transitions, expiry computation, relay rate limit.
- Playwright smoke (desktop + iPhone): post as a local → pending → approve in admin → live on `/sales` and `/sales/[id]` → message seller → email captured (Resend test mode / mocked) → report → hide.
- `scripts/check-production.mjs`: `/sales` 200 + CDN HIT, `/sales/c/vehicles` 200, a known listing 200, `/garage-sales` → 301.
