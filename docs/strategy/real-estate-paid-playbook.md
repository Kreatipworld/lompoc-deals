# Real estate on Lompoc Locals — the paid playbook (borrowed from Zillow, sized for Lompoc)

Written Sep 11 2026, the day the first realtor went live. Sources: Zillow FY2025 10-K, Zillow Premier Agent
program page, The Close / Ylopo / RealTrends coverage of Premier Agent and Flex.

## What Zillow actually sells (and what we copy)

| Zillow mechanism | What it is | Our version (paid) |
|---|---|---|
| **Premier Agent, share of voice** | Agents buy a share of a ZIP code; buyer contacts are routed in proportion to what they bought. | **Featured Agent, Lompoc.** A fixed number of "Featured agent" slots on `/homes` and on every listing page's "Contact an agent" rail (max 3). Sold monthly, one ZIP (93436/37/38 is one market). Plus members get the base listing; Featured is the upsell. |
| **Flex (pay at closing)** | Zillow hands leads free and takes ~35–40% of commission at closing. Invite-only. | Not for us at this size (no way to audit closings). Skip. |
| **Listing pages own the buyer** | Every home page has an agent contact form; Zillow sells the buyer's attention, not the listing. | **Request a showing** and **Contact agent** on every listing page go to the listing agent by email (hello@ copied) and are COUNTED in the dashboard as leads. Leads are the number we sell on. |
| **Zestimate / data = traffic** | Free, indexable content that pulls the whole town in. | **Every home has its own indexable page** (already), `/homes` in the sitemap, "Homes in Lompoc" on the homepage, a Home of the Week in the Monday digest, and Lompoc Locals News covering the market (facts only). Traffic is the product we give Featured agents. |
| **Agent profile with reviews + sales** | Trust signals on the agent page. | Agent profile = Zillow-style: photo, brokerage, licensed-since, active listings, Google reviews button. Later: "Sold in Lompoc" count entered by the agent (owner-verified, not scraped). |
| **Home loans, rentals, showing tools** | Adjacent revenue. | Later: Featured lender / inspector / title slots on listing pages ("Local pros for this home"), sold like the Featured Agent slot. |

## The paid ladder (what an agent can buy)

1. **Plus, $99.99/mo** — the base: agent profile, unlimited listings on `/homes`, listing pages, homepage section, Monday digest, member spotlight video. This is what Maressa is previewing.
2. **Featured Agent, $149/mo** (3 slots max, first-come) — pinned card on `/homes`, "Featured agent" rail on every listing page that is not theirs, first position in the Real Estate directory, one extra spotlight per quarter. Sold only once ≥3 agents are on Plus, so the slot is scarce and visibly valuable.
3. **Featured Listing, $29/listing/30 days** — pinned to the top of `/homes` and the homepage section, "Featured" chip, one dedicated Instagram/TikTok card + story. Impulse buy at listing time.
4. **Home of the Week** (included for Featured Agents, $49 one-off for Plus) — the digest slot + a news mention.

## What makes it work here (not on Zillow)

- **Scarcity.** Lompoc has maybe 40 active agents. Three Featured slots is a real fight; on Zillow nobody notices.
- **Owned traffic.** 20,000+ people reached in August across site + social, and the Monday email. Every Featured agent gets a monthly "your homes were seen N times, N leads" email from the dashboard numbers.
- **No referral fee.** We never touch commission; agents keep it. That is the pitch against Zillow, not a copy of it.
- **Consent + own media.** Agents post their own homes and photos. No scraping, ever.

## Build order

1. Leads: wire "Request a showing" / "Contact agent" to an email to the agent (+ hello@) and a `leads` count in the dashboard. (Small.)
2. Featured Agent slot: `businesses.featured_agent_until` + rail on `/homes` and listing pages; sell by hand at first (billing-action endpoint), Stripe price later.
3. Featured Listing: `property_listings.featured_until` + pin + chip; Stripe price.
4. Home of the Week in the digest + news chip "HOMES".
5. Monthly agent numbers email.

First realtor: Maressa Martinez (Empire Real Estate Group). Second and third agents make the Featured slot sellable.
