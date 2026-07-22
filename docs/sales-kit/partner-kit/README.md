# Partner Kit — Lompoc Locals

Everything used to pitch and sign business partners. All content is real (live
data, real partner photos, prices from the Stripe config).

**Positioning (current):**
- **Growth $39.99/mo** — the self-serve sale. Coupons, weekly digest, dashboard. Up to 5 deals.
- **Plus** — contact-led *listings* tier (real estate for-sale & for-rent). `hello@lompoclocals.com`.
- **Mission-first:** awareness + keeping Lompoc's economy local — "bigger than a coupon."

---

## Contents

### 01-deck/ — the interactive partner deck (12 slides)
- `partner-guide.html` — the full pitch: mission → reach → placements → coupons → dashboard → features → plans → Plus → why now → get started. Prints to PDF (press **P**).
- **Live on the site:** https://www.lompoclocals.com/partner-guide.html (embedded in `/partners`).
- **Note:** the live copy at `public/partner-guide.html` is *generated from this file* — after editing this deck, re-wrap it into `public/partner-guide.html` (doctype + head) and redeploy.

### 02-intro-page/ — short intro landing
- `partner-intro.html` — a one-scroll intro to text/email a prospect; funnels to signup + the deck.

### 03-video/ — auto-playing motion intros (screen-record → MP4)
- `partner-video-landscape.html` — 16:9, for the site.
- `partner-video-phone-9x16.html` — vertical, for Reels/TikTok/Stories.
- Both auto-play ~56s; press **↻ Replay**. See the avatar-narration script in the team notes if using an AI-avatar tool.

### archive/ — superseded (pre-coupon-system, Jul 18)
- `pitch-deck-jul18.html`, `one-pager-jul18.html` — kept for reference; do not use (stale on pricing + coupons).

---

## The live funnel
| Asset | Where |
|---|---|
| Marketing landing page | **lompoclocals.com/partners** |
| Interactive deck | lompoclocals.com/partner-guide.html |
| Business signup | lompoclocals.com/signup/business |
| Contact (Plus / questions) | hello@lompoclocals.com |

## Related (elsewhere in the repo)
- Strategy & copy: `docs/sales-kit/*.md` (brand story, tiers, benefits, playbook, media kit).
- Outreach pipeline: `docs/marketing/photo-gap-outreach.md`.
