# Enrichment Wave 2A — Food & Drink (25 businesses)

**Run:** 2026-07-17 · 5 parallel agents (F–J) using the `enrich-business` skill.
**Result: 22 of 25 fully enriched** (curated photos, factual about, contacts, socials).
1 exposed as fake seed data, 2 interrupted by session limits (queued to finish).

## Status

| Batch | Businesses | Status |
|---|---|---|
| F Restaurants | Alfie's, American Host, Angela's, Big Jayke's, Burritos Lalo | ✅ all 5 |
| G Grills/delis | Carbaugh's ✅, Dave's Place ✅, Eddie's Grill ✅, Cattaneo Bros ⏳, Eye on I ⏳ | 3 of 5 (agent hit session limit) |
| H Pizza/cafés | Fatte's, Grill & Chill/Señor Taco, Izzie's, Jasper's ✅ · Flower Field ❌ fake | 4 of 5 |
| I Mexican/cafés | La Botte, La Reyna, Mama's Caffè, Mariscos El Palmar, Mr. Taco | ✅ all 5 |
| J Wine Ghetto | Brewer-Clifton, Civilization, Dierberg, Foley, Lompoc Wine Factory | ✅ all 5 |

## New contacts captured

| Business | Email | Notes |
|---|---|---|
| Alfie's Fish & Chips | mrmike336@hotmail.com | owner Mike Sewall |
| Big Jayke's | thatsbigjayke@gmail.com | + phone (805) 944-7290 added |
| Mama's Caffè | mamascaffe805@gmail.com | + catering line (805) 325-3625 |
| Brewer-Clifton | info@brewerclifton.com | |
| Civilization Wine | CivWineCo@Gmail.com | replaced wrong-entity scraped email |
| Dierberg | reservations@dierbergvineyard.com | |
| Foley Estates | tastingroom@foleywines.com | |
| Lompoc Wine Factory | info@lompocwinefactory.com | verified on site |
| Eddie's Grill | j.carlosmeza1995@yahoo.com | |
| Dave's Place | dave.jaskolski@villageinnca.com | |

## Standout SEO hooks / content angles

- **Alfie's Fish & Chips** — the last remaining Alfie's; English fish & chips since **1969**
  (fixed our wrong "1972"); Scottish founders; red telephone box. "Lompoc institutions" series.
- **American Host** — diner since 1982; restored 1960 **"Hi! Let's Eat"** sign, Lompoc's
  first designated landmark sign (news coverage exists).
- **Big Jayke's** — launched on Instagram 2018, sold out first pop-up in 2 hours. His
  IG-first story mirrors the Lompoc Locals pitch — top outreach candidate.
- **Mama's Caffè + La Botte** — same building (112 S I St), same family; Mama Caterina,
  45 years serving Lompoc. Cross-linked profiles; "date night" + breakfast angles.
- **Izzie's Foodies Place** — KSBY covered its rebrand from Herb Home Thai (press backlink).
- **Mr. Taco** — Aguascalientes recipes since 2016, Vandenberg Village; active IG/FB + VIP
  email list → digest-ad receptive.
- **La Reyna / Mariscos El Palmar** — bilingual hooks: menudo weekends, fresh tortillas
  daily, "House of the Homemade Tortilla," est. 2003.
- **Brewer-Clifton** — founded 1996, helped establish the Sta. Rita Hills AVA; production
  home is Lompoc (public tasting room is Los Olivos — say it right in outreach).
- **Dierberg** — the destination estate in 93436: open 7 days, barrel cave, pet-friendly.
- **Foley Estates** — winery in converted thoroughbred stables; 59 micro-blocks.
  ⚠ tastings may currently be Solvang pop-ups — confirm before promoting visits.
- **Lompoc Wine Factory** — co-op "winemaking incubator" hosting Turiya, CORE, Civilization
  et al. Great "where Lompoc wine is actually made" feature.
- **Fatte's Pizza** — always-on BOGO + $35 Pizza Tuesday → ready-made deal content.
- **Burritos Lalo** — $2.25 Mon/Tue Taco Nights; 3-location Central Coast mini-chain.

## Data-quality actions taken

- Nulled 2 fake auto-generated "websites" (La Reyna, Mariscos El Palmar — SEO template
  pages, not business-owned). Replaced 2 dead domains (Alfie's, Dierberg redirect).
- Dropped photos: identifiable children (2 businesses), personal cell on a business card,
  wrong-location shots (Brewer-Clifton Los Olivos, Civilization Hermosa Beach), pre-move
  storefronts, outdated signage/menus, city murals attached to a bar listing.
- Phones verified against Google on all 22; Big Jayke's phone added from business card.

## Cleanup queue (admin decisions — nothing deleted by agents)

1. **Flower Field Coffee Co. (id 125) — probable fake.** 555 phone, wrong-entity website,
   zero Google/web presence. Recommend unpublish/delete.
2. **La Botte duplicate:** id 132 `la-botte-italian-restaurant` (holds the place_id) vs
   id 373 `la-botte-italian-restaurant-catering` (enriched). Merge; then move place_id.
3. **Municipal Winemakers (id 167) holds Lompoc Wine Factory's place_id** (wrong entity).
   Fix 167, then: `UPDATE businesses SET google_place_id='ChIJydjL0ZUe7IARsggfwR8FGLc' WHERE slug='lompoc-wine-factory';`
4. Prior flags still open: South Side Coffee dupe (621), Solvang/Hoptions dupe (287),
   Floriano's Pizzeria (628), Lompoc Cuts Barbershop (128, holds Barber Lounge's place_id),
   Valley Vines (126, corrupt seed row), O'Cairns Inn separate-but-legit (315).
5. Miscategorized as Food & Drink: Bella Florist (332), Lompoc Valley Florist (331),
   SB County Public Health center (266). Recategorize.
6. **Big Jayke's address is fluid** (VSFB vs 112 S I St vs food-truck pop-ups) — confirm
   with owner. Angela's posted hours may be stale (COVID-era site).

## Remaining Food & Drink queue

- **Finish wave 2A:** Cattaneo Bros. (171 — verify it's genuinely Lompoc, may be the SLO
  jerky brand), Eye on I (62).
- **Wave 2B (~30 with websites):** Montemar, Sandhi, Spear, Zotovich, Sake Sushi, Umami ya,
  taquerias (Don Tacho, El Culichi, La Michoacana, El Tizon), Thai Cuisine, Rice Bowl,
  Pink Pig BBQ, PJ's Deli, Sweet Baking Co., Santi's Bakery, Susi's Kitchen, Toro Loco,
  Super Grill, Hook & Slice, Ocean's Seven, One Room Escapes, PCH STREET, Pizza Garden, etc.
- **Wave 2C:** ~50 without websites (Google-only sources).
- Chains deliberately deprioritized: Albertsons ×2, Circle K, Jersey Mike's, Ono Hawaiian.
