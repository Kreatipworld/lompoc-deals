# Business Outreach Email — "Claim your Lompoc Deals profile"

Cold B2B outreach to the ~141 Lompoc/Vandenberg businesses with scraped emails.
Angle: their profile already exists — claim it free and post a deal.

**Merge fields:** `{{business_name}}`, `{{profile_url}}` (= `https://lompoc-deals.vercel.app/biz/<slug>`), `{{greeting}}` (default "there").
**Fill before sending:** `[Your name]`, `[reply email]`, `[phone]`, `[mailing address]`.

---

## Subject line options (A/B test these)

1. `{{business_name}} is already on Lompoc Deals — want to claim it?`  ← recommended
2. `Your Lompoc Deals profile is ready, {{business_name}}`
3. `A free way for {{business_name}} to reach more Lompoc locals`

---

## Email 1 — initial

**Subject:** {{business_name}} is already on Lompoc Deals — want to claim it?

Hi {{greeting}},

I'm [Your name], and I run **Lompoc Deals** — a free local site where Lompoc and Vandenberg neighbors find restaurants, shops, and services right here in town.

I've already set up a page for {{business_name}} so locals can find you:
**{{profile_url}}**

It's yours to claim — free. Once you do, you can:

- Post a deal or special that shows up in our weekly local digest
- Keep your hours, photos, and info current
- See how many people viewed your page and where they came from

No cost and no catch — I'm just trying to help local businesses get found by people nearby.

To claim it, click **"Claim this business"** on your page, or just reply and I'll set it up for you.

Thanks for being part of Lompoc,
[Your name]
Lompoc Deals
[reply email] · [phone]
[mailing address]

*Prefer not to hear from me? Reply "unsubscribe" and I won't email again.*

---

## Email 2 — follow-up (send 4–5 days later, only to non-openers/non-repliers)

**Subject:** Re: {{business_name}} is already on Lompoc Deals

Hi {{greeting}}, floating this back up — no pressure.

Your {{business_name}} page ({{profile_url}}) is still there and free to claim whenever you like. If it's not for you, a quick "no thanks" and I'll stop reaching out.

Either way, thanks for everything you do for the community.

[Your name] · Lompoc Deals
[reply email]

*Reply "unsubscribe" to opt out.*

---

## Sending notes (read before you send)

**Legal (CAN-SPAM — required):**
- Use a truthful subject and a real "From" name/address.
- Include a physical mailing address (a PO box is fine).
- Include a working opt-out and honor it within 10 business days.

**Deliverability (protect your domain):**
- Send from your real domain with **SPF + DKIM + DMARC** set up. Consider a subdomain (e.g. `hello@mail.lompocdeals.com`) so cold outreach can't hurt the digest/transactional reputation.
- **Send in small batches** — ~20–30/day, not all 141 at once. A sudden blast looks like spam.
- **Plain text or very light HTML.** Skip open-tracking pixels — they hurt deliverability and trust; measure by replies/claims instead.
- Personalize `{{profile_url}}` per business so every email is unique (reduces spam scoring).
- Watch the first batch's bounces/complaints before sending more.

**Tone:** neighborly and local. You're a community member helping local businesses, not a vendor pitching software.
