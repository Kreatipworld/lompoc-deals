# /locals Reinvention — Design Spec

*Date: 2026-07-06 · Approved: interactive-demo approach*

## Goal

Replace the text-heavy /locals pitch with an inviting, image-rich page that sells the FREE local membership by letting visitors play with the coupon flow directly on the page.

## Sections (in order)

1. **Hero** — flower-field photo (`/lompoc-flowers-4.jpg`) under the purple brand wash (homepage-locked style), compact height (~py-14). H1 "Your town. Your deals. Free forever." + body line; primary CTA → `/signup/user` ("Join free — no credit card"), secondary → `/deals`. Live stat line from `getSiteStats()`.
2. **Try a coupon (interactive demo)** — new client component `components/coupon-demo.tsx`. State machine: `card → coupon → used`. Card state: realistic demo deal (taco special, discount badge, clearly chip-labeled "Demo"), button "Claim deal". Coupon state: mirrors the real claim screen — business name, offer, dashed code box `LOMPOC-DEMO`, "Show this screen at the register", terms line, button "I used this deal". Used state: success check + "That's all it takes" + reset link ("Play again"). All strings via props from the server page (client component; labels object, serializable). No DB writes, no tracking.
3. **Real deals strip** — `getActiveDeals(3)` + real `DealGrid` (tripadvisor variant) with `fromPath="/locals"`; heading "These are live right now"; link → `/deals`. Section hidden when empty.
4. **Member value grid** — 4 cards (icon, title, body): Save favorites (Heart), Follow businesses (Bell — email when they post), Saturday digest (Mail — top 10 weekly), Claim history (Ticket). Grid CTA → `/signup/user`. Every claim is a real current feature — no vaporware.
5. **Experiences photo band** — 4 photo tiles (real local shots): flower fields → `/activities/lompoc-flower-fields`, Wine Ghetto → `/activities/lompoc-wine-ghetto`, Jalama → `/activities/jalama-beach`, launches → `/activities/vandenberg-launches`. Title overlay per tile.
6. **Final CTA band** — purple gradient panel: "Join free" button + quiet `/subscribe` link.

## Constraints

- Full EN/ES parity; new keys live in the existing `forLocals` namespace; unused old `forLocals` keys are deleted from BOTH locales after grepping for other usages.
- Brand tokens only. Real photos only (public/ + our blob). No new dependencies.
- Old page (480 lines) fully replaced. `components/coupon-demo.tsx` is the only new file.
- Copy truths: digest = Saturday, top 10; membership = free forever; no invented numbers.

## Verification

tsc + lint clean; manual smoke `/en/locals` + `/es/locals` (demo flip works, real deals render, links resolve).
