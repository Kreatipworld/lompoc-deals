# Photo-Gap Outreach List

**Generated:** 2026-07-20
**Source:** the 26 approved businesses whose only cover image was a Google Street View
thumbnail. Those URLs began returning 403 (Google restricted the endpoint), so the covers
were cleared to NULL on 2026-07-20. All 26 remain fully listed — nothing was delisted.

**Why these are a pipeline, not a chore:** every business here has a live page on
lompoclocals.com with no photo on it. That is a concrete, specific opening — you are not
cold-pitching a product, you are showing someone a page that already exists and offering to
make it look right.

**The pitch:**
> "You're already listed on Lompoc Locals — here's your page. Right now it doesn't have a
> photo. Claim it and we'll get your real pictures up there."

**No Official Partners are on this list.** Every paying business is unaffected.

---

## Tier A — Best prospects (11)

Independent local businesses, reachable by phone, the kind that pay for local visibility and
usually have a weak online presence. **Trades are the standout group** — electricians and
plumbers rarely have anywhere good to be found online, and they buy local advertising.

| Business | Category | Phone | Page |
|---|---|---|---|
| Wolf Electric Co | Services | (805) 742-0329 | /biz/wolf-electric-co |
| Yanez Electric Inc | Services | (805) 736-7817 | /biz/yanez-electric-inc |
| Debolt Electric | Services | (805) 736-6071 | /biz/debolt-electric |
| Fridrich Quality Plumbing | Services | (805) 735-6869 | /biz/fridrich-quality-plumbing |
| Rooterman Plumbing | Services | (805) 717-3037 | /biz/rooterman-plumbing |
| Trust Auto Repair | Auto | (805) 736-3100 | /biz/trust-auto-repair |
| Julia's Beauty Salon | Health & Beauty | (805) 315-5490 | /biz/julia-s-beauty-salon |
| Abigail's Flowers #2 | Retail | (805) 345-1981 | /biz/abigail-s-flowers-2 |
| Silver Syndicate | Other | (805) 588-7944 | /biz/silver-syndicate |
| Sky 2 Storage | Other | (805) 736-5954 | /biz/sky-2-storage |
| Dr. Scott Dahlquist | Services | (805) 736-6550 | /biz/dr-scott-dahlquist |

⚠️ **Sky 2 Storage has `johndoe@gmail.com` on file** — placeholder/junk data, not a real
address. Do not email it. Worth cleaning up separately (see Data notes below).

## Tier B — Professional offices (6)

Dentists and realtors. Reachable and legitimate, but they market through their own channels
and may see less value in a local deals feed. Worth a call after Tier A.

| Business | Category | Phone | Notes |
|---|---|---|---|
| Brian M. Carey, D.D.S. | Other | (805) 735-1412 | has email: contact@briancareydds.com |
| Dana Manchester DMD | Other | (805) 735-3611 | |
| California Realty Executives | Other | (805) 588-2703 | |
| California-West | Other | (805) 736-1293 | california-west.com |
| Ebberts Heritage Real Estate | Other | (805) 737-0299 | |
| eXp Realty – Lompoc Office | Other | (805) 245-9788 | branch of a national brokerage |

## Tier C — Not sales prospects (9)

Listed for completeness. **Do not pitch these** — they are government, non-profit, national
chains, or trade bodies with no local budget authority. They still belong on the site as
useful local information.

| Business | Why not a prospect |
|---|---|
| Utility Service | City of Lompoc bill-pay page |
| Santa Barbara Veteran's Services | County government |
| Community Health Centers – Lompoc Dental | Non-profit health network |
| Church of Christ | Place of worship |
| Circle K | National chain; no local marketing authority |
| JB Dewar Inc. | Regional fuel distributor, HQ elsewhere |
| Lompoc Valley Board of Realtors | Trade association, not a retail business |
| Car Wash | No real business name or phone on file — likely a Places artifact |
| Nearby Self Storage Units Lompoc CA | SEO-spam-style name, no phone; verify it is a real business |

---

## Data notes (separate cleanup, not outreach)

These surfaced while building the list and are worth fixing regardless of any sales work:

1. **Sky 2 Storage — `johndoe@gmail.com`.** Obvious placeholder in a real production row.
   Should be nulled; also worth checking whether other rows carry junk contact data.
2. **"Car Wash" (id 580)** — no business name, no phone, address is just "E North Ave".
   Probably a low-quality Google Places import. Candidate for review or removal.
3. **"Nearby Self Storage Units Lompoc CA" (id 572)** — the name reads like SEO spam rather
   than a real trading name. Verify it exists before pitching or promoting it.
4. **Photos are genuinely unobtainable for most of this list.** Google Places has no photos
   for these place_ids, and the project's Maps API key is restricted to Places-only — Street
   View Static and Static Maps both return `REQUEST_DENIED`. So automated curation cannot
   fill these gaps. The photo has to come from the owner, which is exactly what makes the
   outreach pitch honest.
