# Deal-Ask Outreach — "Your page is getting views. Post a deal."

The strongest pitch we've ever had, because it's now **true and measurable**: these
businesses' Lompoc Locals pages are already getting real local traffic. We lead with the
number, then ask for one real deal.

**Why this works:** the generic "claim your free page" ask (see `business-outreach-email.md`)
gets a shrug. "Your page got **{{views}} views last month** — turn those into customers
with one deal" is concrete, flattering, and self-evidently worth 5 minutes.

**Honesty guardrails (non-negotiable):**
- We only quote **real** 30-day view counts from `analytics_events`. Never inflate.
- We never post a deal on a business's behalf that they didn't authorize. This outreach
  *asks them* to post (or to tell us the deal and we enter it with their OK).
- Follow the email-send rule: **nothing sends until the exact message is shown to Andres
  and explicitly approved.** These are drafts + a tracker, not a send queue.

**Merge fields:** `{{business_name}}`, `{{views}}` (30-day page views), `{{profile_url}}`
(= `https://www.lompoclocals.com/biz/<slug>`), `{{greeting}}` (default "there").
**Reply address:** `hello@lompoclocals.com` (active — Resend send + inbound forward to Andres).
**Fill before sending:** `[Your name]`, `[phone]`, `[mailing address]`.

Target list + live view counts: `deal-ask-targets.csv`.

---

## Channel 1 — Email

**Subject options (A/B):**
1. `{{business_name}} got {{views}} views on Lompoc Locals last month` ← recommended
2. `Locals are finding {{business_name}} — want to give them a reason to come in?`
3. `Turn {{views}} page views into paying customers, {{business_name}}`

**Body:**

Hi {{greeting}},

I'm [Your name] — I run **Lompoc Locals**, the free local site where Lompoc and Vandenberg
neighbors find places to eat, shop, and get things done in town.

Quick, good-news reason I'm writing: your page got **{{views}} views on Lompoc Locals in
the last 30 days** — real locals looking you up.

**{{profile_url}}**

Right now they see your info, but there's nothing giving them a reason to come in *this
week*. That's what a deal does. Post one special — 10% off, a free side, first-visit
discount, whatever fits — and it shows up in the feed and our weekly local digest.

Two easy ways to do it:
- **You post it:** claim your page (free) and add the deal in about 2 minutes, or
- **I post it for you:** just reply with the offer and I'll set it up — you approve it
  before it goes live.

No cost, no catch. I only put up deals a business actually wants.

Thanks for being part of Lompoc,
[Your name]
Lompoc Locals · hello@lompoclocals.com · [phone]
[mailing address]

*Prefer not to hear from me? Reply "unsubscribe" and I won't email again.*

---

## Channel 2 — Phone script (for the no-email targets)

> "Hi, is this the owner/manager? Great — I'm [Your name] with Lompoc Locals, the local
> site for Lompoc and Vandenberg. I'm not selling anything. I'm calling because your page
> on our site got **{{views}} views last month** from locals, and I wanted to help you
> turn that into walk-ins. If you give me one special — even something simple like a
> first-visit discount — I'll put it up free and it goes out in our weekly digest. Want me
> to set one up? … Perfect, what would you like to offer?"

Log the outcome and the offer in the tracker. If they say yes but have no offer ready,
suggest the category default (below) and confirm.

---

## Channel 3 — Text / DM (short)

> Hi {{business_name}}! This is [Your name] from Lompoc Locals. Your page got {{views}}
> views from locals last month 🎉 Want to turn those into customers? Reply with one deal
> (even 10% off) and I'll post it free — you approve before it's live. Your page: {{profile_url}}

---

## Category default deal suggestions (only if the owner asks "like what?")

Offer these as *examples* to unstick the conversation — the business picks and confirms.

- **Food & Drink:** "Free drink or side with any entrée," "10% off first order," "Kids eat free Tuesdays."
- **Wineries / Tasting rooms:** "2-for-1 tasting for locals," "Free tasting with bottle purchase."
- **Retail:** "15% off one item," "Free gift over $50."
- **Health & Beauty:** "$10 off first appointment," "Free add-on service for new clients."
- **Services / Auto:** "Free estimate/inspection," "$25 off first service."
- **Dispensaries:** follow their compliance rules — "local first-visit discount" where allowed.

---

## Prioritization

Work `deal-ask-targets.csv` top-down (highest views first). The top ~15 are the beachhead:
a deal on Eddie's Grill (92 views), LAUNCHpad (73), or Jasper's Saloon (61) both fills the
feed and gives every future pitch a live example to point at.

**Batching / deliverability:** same rules as `business-outreach-email.md` — ~20–30 emails/day,
real domain with SPF+DKIM+DMARC, personalize the merge fields, watch bounces. Calls and
texts have no such cap; those are the fastest path for the no-email targets.
