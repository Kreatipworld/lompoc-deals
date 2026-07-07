# Admin Command Center + Comms Hub — Design Spec

*Date: 2026-07-06 · Approved*

## Goal

Rebuild `/admin` as a command center (pulse, unified action queue, new people, growth strip) and add `/admin/comms` — digest preview/test-send, safeguarded broadcast to confirmed subscribers, welcome monitor, connectors + CSV exports.

## Part A — /admin (rebuild)

1. **Pulse row** — tiles linking to detail pages: approved businesses, live deals, claims/redeems (7d, from analytics_events), confirmed subscribers, new users (7d). Attention badge (destructive dot) when the linked queue has pending items.
2. **Action queue** — one list: pending businesses, pending deals, pending feed posts, pending events, businesses missing hours (reuse existing admin queries where present). Each row: count + link. Empty state: "Inbox zero."
3. **New people (7d)** — users (name, role, joined) + subscribers (email, confirmed?) newest first.
4. **Growth strip** — last 4 ISO weeks: signups, business_page_viewed, deal_claim counts as simple CSS bars (no chart lib).

## Part B — /admin/comms (new)

1. **Digest panel** — confirmed-subscriber count; live preview of next digest content (extract the top-10 query from `app/api/cron/digest/route.ts` into `lib/digest.ts` `getDigestDeals()`; cron reuses it); "Send test to me" server action → `sendDigestEmail` to the signed-in admin's email; cron schedule text (Saturday 9am).
2. **Broadcast composer** (client) — fields: subject, body EN, body ES (optional; falls back to EN). Flow enforced client+server: (a) "Send test to me" (required before enabling send), (b) confirm screen showing exact recipient count, (c) send. Server action batches over confirmed subscribers, per-subscriber locale template with unsubscribe link (`/subscribe/unsubscribe?token=`), Resend, 600ms delay between batches of 10. Result summary (sent/failed).
3. **Welcome monitor** — last 14 days of signups with `mailto:` quick-welcome links (prefilled subject/body EN/ES by user role).
4. **Connectors card** — Telegram status (telegramSettings row exists?) + link `/api/telegram/setup` docs note; CSV export links.

## Plumbing

- `lib/digest.ts` — `getDigestDeals()` (moved query).
- `lib/email.ts` — add `sendBroadcastEmail(email, unsubToken, subject, html, locale)`.
- `lib/admin-comms-actions.ts` — `"use server"`: `sendTestDigestAction`, `sendBroadcastTestAction(formData)`, `sendBroadcastAction(formData)`; every action verifies `role === "admin"`.
- `app/api/admin/export/route.ts` — `?what=subscribers|businesses`, admin-gated, returns CSV.
- Admin layout nav gains "Comms".

## Guardrails

- Broadcast only to `confirmedAt IS NOT NULL` subscribers; server re-checks test-sent flag can't be spoofed to skip count-confirm (server just requires `confirm === "yes"` field set by the confirm step).
- All new admin actions check the session role server-side (same pattern as existing admin actions).
- Admin UI English-only; broadcast content bilingual.

## Verification

tsc + lint clean; manual: /admin renders with real counts; test digest lands in admin inbox; broadcast test lands; CSV downloads; broadcast to the (currently 0) confirmed subscribers reports 0 sent without error.
