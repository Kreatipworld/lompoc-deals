# Lompoc Locals — Anticipating the Future

*Written 2026-07-27. Grounded in real numbers: 2,335 visitors/week, 474 live
businesses, 13 live deals, 1 confirmed digest subscriber, $0 MRR, ~$50/mo costs.*

---

## 0. The mission: #1 platform in Lompoc — defined so we know when it's true

"Number one" is not a feeling; it's four measurable positions, in order:

1. **#1 where locals check what's happening** — beat the Facebook groups as
   the first tab opened. Measure: 10,000 unique visitors/week (≈¼ of town) and
   500 confirmed digest subscribers.
2. **#1 where deals actually work** — the only place in town a coupon is a
   real code, not a screenshot. Measure: 100+ redemptions/month at counters.
3. **#1 where a business must be** — "are you on Lompoc Locals?" becomes a
   question owners hear. Measure: 50+ paying members; new businesses sign up
   without outreach.
4. **#1 in Google/AI answers for "lompoc + anything local"** — measure: top-3
   organic for deals/events/directory queries (JSON-LD already in place).

Everything below is the route to those four numbers. Current position: the
content moat already exists (no competitor has 474 enriched profiles); the
audience beachhead exists (2,335/wk); the money and habit layers are at zero.

---

## 1. Where the money actually is (the math we run the company on)

| Milestone | Growth members | MRR | Meaning |
|---|---|---|---|
| Ramen | 3 | $120 | Platform pays for itself forever |
| Proof | 10 | $400 | The pitch works; testimonials exist |
| Real | 50 | $2,000 | A business, not a project |
| Town won | 100 + 5 Plus + digest ads | ~$4,800 | Practical ceiling for one town |

The ceiling matters: **Lompoc alone tops out around $4–6k MRR** (474
businesses; 20% paid is a heroic local penetration rate; digest ad inventory
adds ~$500–800). Anticipating the future means knowing this ceiling *before*
hitting it — see §5.

**Unit economics to defend:** costs stay under $100/mo until well past 50
members. Every Growth membership is ~pure margin. There is no venture math
here and that is a strength — 100 members in one small town is a real income.

## 2. The next 90 days decide everything (demand, not supply)

The database says it plainly: content tables full, demand tables empty. The
company's only real risk this quarter is *not asking*. Sequence:

1. **Outreach wave** — 104 curated prospects, 25/day, claim-your-page angle.
   Target: 30 claims, 10 paid in 60 days.
2. **Meta presence** (user-led) — FB is where Lompoc actually talks. Feed it
   real deals + rocket launches; every post ends at a claim page.
3. **Activation loop** — a paying business must see a redemption in the first
   30 days or it churns at renewal. Watch the vitals email: `Redemptions (7d)`
   is the retention number, not MRR. If a member has zero redemptions by day
   14: hand-place their deal in the digest + socials that week.

## 3. Churn is the company-killer to anticipate (not acquisition)

Local SMB SaaS churns 5–10%/mo when value is invisible. Our moat against it is
the thing nobody else in town has: **"you see exactly who walked in."**
Anticipate by building the habit now:
- The Monday vitals email pattern → extend to a per-business monthly
  "your month on Lompoc Locals" email (views, claims, redemptions). A member
  who gets a monthly proof-of-ROI email doesn't cancel. (Build when there are
  ≥5 paying members — not before.)
- Annual plan (2 months free) once ~20 members exist — converts churn risk
  into commitment.

## 4. Risks on the horizon (and the cheap insurance for each)

| Risk | Likelihood | Insurance (mostly already done) |
|---|---|---|
| Facebook Groups stay "good enough" for locals | High | Don't fight FB — feed it. Deals/events posted there link back to claim pages. FB has no redemption codes; we do. |
| AI search eats directory traffic | Medium, slow | We're the *transaction* layer (claims/codes), not just answers. Keep JSON-LD strong so AI cites us. |
| Google photo/data dependencies break | Was high — **solved** (self-hosted Blob, self-healing galleries) | Re-run mirror script after enrichment sweeps. |
| Stripe/account fragility | Was high — **solved** (dedicated account, self-healing customers) | Roll the exposed key (still pending). |
| Key-person risk: one founder + one AI session | High, chronic | Docs + memory + this file. Everything reproducible from the repo. Keep it that way. |
| A funded competitor copies the model | Low in Lompoc | Speed + relationships. 474 enriched profiles and the town's trust aren't clonable by capital. |
| Scraped content goes stale → trust erosion | Medium | Quarterly enrichment sweep; "hide broken content" rule already enforced in code. |

## 5. The expansion question (answer it later, decide the trigger now)

The scope rule stands: **Lompoc Locals is Lompoc + Vandenberg only. Ever.**
But the *company* is bigger than the site: what's been built this year is a
**repeatable town-platform machine** — scraping/enrichment pipeline, coupon
loop, digest engine, bilingual UX, Stripe playbook, outreach kit.

- **Trigger to even think about town #2:** Lompoc at 50+ paying members AND
  churn <3%/mo AND founder time <10 hrs/week on ops. Not before.
- **Form it would take:** a sibling instance ("____ Locals"), own domain, own
  Stripe account (the Ayuda Latina pattern), same codebase. Never a merged
  regional site — the "hyper-local only" promise *is* the brand.
- **Until then:** every ops task we automate in Lompoc is compounding value
  for the machine.

## 6. Ops load will grow — automate ahead of it

At 50 members and 30+ live deals, the manual load becomes: approvals, deal QA,
support email, content freshness. Anticipate with (in order, build as needed):
1. Approval notifications → already emailed; add one-click approve from email.
2. Deal expiry nudges to businesses ("your deal expires Friday — renew?").
3. Monthly per-business ROI email (§3).
4. Self-serve digest ad booking (today it's manual — fine below ~5 advertisers).

## 7. The quarterly rhythm (how we keep anticipating)

- **Monday**: vitals email (automated, live now). MRR, claims, redemptions.
- **Monthly**: one enrichment/content sweep + review churn + top/bottom deals.
- **Quarterly**: reread this file. Update the numbers. Ask: did the
  bottleneck move? (Today: distribution. Next, likely: activation. Then:
  churn. Then: founder time.)

*The pattern to trust: fix the current bottleneck, and the next one is
already named above.*
