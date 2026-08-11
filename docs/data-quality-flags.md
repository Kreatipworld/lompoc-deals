# Data-quality flags from the Aug 6 2026 about-enrichment pass

Raised by the batch writers (skip-don't-guess rule). Each needs a quick human
verification before fixing — the listing's website, name, or address appears
stale or wrong. Fix the row, then re-run `scripts/crawl-abouts.mjs` + a writer
pass for that business.

## Fixed already
- #86 Lompoc Valley Medical Center — website was lvmc.org (serves the Las Vegas
  Mountaineers Club); corrected to lompocvmc.com. About still pending.
- #336/#337 CVS duplicate — merged into #337 (slug `cvs`, name "CVS Pharmacy",
  Google place id transferred).
- #451 Lompoc Family Dental — was categorized "Auto"; moved to Services.
- Event dupes #145/#146/#103 deleted; cross-source dedup guard shipped.

## Pending verification
- #95 Lompoc Dental Group — site says "Lompoc Dental Associates" at 1201 E Ocean
  Ave; listing says 1221 N H St. Wrong website or renamed practice?
- #110 Lompoc Car Wash & Detail — website is a directory page for "Fast Pass Car
  Wash" at another address.
- #127 Mission Auto Care — site is "Automotive Service Center" at 626 N H St
  ("under new ownership"); listing says 820 N H St.
- #184 Mail It Plus — site content is entirely "BOX SHOP" at 740 N H St; listing
  says 1106 N H St.
- #188 Lompoc Beauty College — site now serves "Cosmoton Academy" barber school
  at 736 N H St; listing says 119 N I St. Possible rebrand/relocation.
- #288 Explanada Lompoc — website is the MONARCA ENT/MMG Concerts promoter site,
  no venue content.
- #289 Bodger Trail — site is the Lompoc Trails nonprofit / River Bend Bike
  Park; never mentions Bodger Trail.
- #76 Lompoc Furniture & Mattress — site brands itself "Cal Deals Furniture &
  Mattress"; about written noting the online name. Pull if they're different stores.
- #149 Fiddlehead Cellars — site says they moved to "the Farm" (Jul 2025),
  appointment-only; DB address (1597 E Chestnut Ave, Wine Ghetto) may be stale.
- #558 VTC Enterprises — merged into BEACON (VTC + LOVARC); listing name may
  deserve an update.
- #573 Fort Storage — listing address 925 W Chestnut vs 1013 W Chestnut on its
  own site.
- #583 Extra Space Storage — categorized "Auto"; should likely be Services.
- #612 Circle K (gasoline) — categorized "Retail"; arguably Auto/fuel.

## Resolved by the Aug 6 web-verification pass (all researched, sources in session log)
- Deleted phantom/duplicate rows: Pep Boys #108 (no Pep Boys exists in Lompoc), Lompoc
  Animal Hospital #185 (directory alias of Animal Care Hospital #322), Tachito #495
  (same family/building as Taqueria Don Tacho #492), Lompoc Cuts Barbershop #128,
  Salon Innovations #93 (defunct), Lompoc Dental Group #95 (alias of Lompoc Dental &
  Associates #452), Exxon #610 (the fuel brand on Stuart's Petroleum #598), Regal
  Edwards #111 (theater is in Santa Maria; town cinema is Movies Lompoc), Marian
  Regional #181 (Santa Maria hospital — out of Lompoc scope).
- Century 21: #37 Hometown merged into #522, renamed "CENTURY 21 Masters" (absorbed
  Hometown), local phone (805) 736-5663.
- Motel 6 #311 phone corrected to (805) 735-7631; Target #75 wrong phone cleared
  (real store number still needed).
- Ocean's Seven Café #205 kept deliberately — it's LVMC's in-hospital café, a real
  place locals can eat; shares the hospital main line by design.
- Earlier same-brand merges: Kaizen, Planet Fitness, Compass, Keller Williams,
  Grocery Outlet, La Botte, CVS ×2, Circle K.

## Resolved by the Aug 6 wrong-website fixer pass
- #110 renamed Fast Pass Car Wash (638 N H St, real identity of the row); #184 renamed
  Box Shop (740 N H St, FedEx ShipCenter, about written); #188 renamed Cosmoton Academy
  (barbering school, 736 N H St, about written); #289 Bodger Trail confirmed real —
  website now the Explore Lompoc trail page, about written; #573 Fort Storage address
  corrected to 1013 W Chestnut + phone filled; #583 Extra Space recategorized Services;
  #558 VTC name kept (BEACON not yet the public Lompoc name), address moved to 116 N I St;
  #149 Fiddlehead moved to "the Farm" (appointment-only, new address unpublished) —
  address/coords nulled to service-area pattern; #288 Explanada verified real (jaripeo
  venue, MMG is its promoter).
- Deleted after verification: #127 Mission Auto Care (phantom duplicating #214, fake 555
  number, address is an office building) and #75 Target Lompoc (no Target exists in
  Lompoc per Target's own store directory).
- Rows renamed to their true identity (#110/#184/#188) kept their old slugs — cosmetic,
  fix only if it ever matters for SEO.
- Fiddlehead's existing about may still reference the Wine Ghetto location — needs a
  human read.

## Social-research pass results (Aug 6, batches A+B)
- 74 abouts written from verified social/directory/news sources; 45 social links and
  8 recovered websites added. Logs: scratchpad social-log-A/B.jsonl (per-row sources).
- Deleted junk rows: #572 "Nearby Self Storage Units" (SEO spam), #580 generic
  "Car Wash" (unverifiable), #595 Conservmart (parcel-number address, dup of Conserv
  Fuel #609).
- Manual-look queue: #501 Cinco De Mayo (503 N H St now a tire shop — closed or moved
  truck?), #559 Second Shot, #514 Black Rose TATTOOS (no verifiable trace), #387 La
  Cherry Moda (IG hints at possible closure), #326 Thacker Verne DVM = Village
  Veterinary Clinic (same phone — merge candidate), #290 "Permanantly Closed Off Base
  at Hangar7" (delete candidate, name says closed).
- Address discrepancies to verify before touching: Silver Syndicate (205 vs 1010 N H
  St), California Realty Executives (312 N H St on own site vs 129 N I St), John Maida
  (124 vs 120 N A St).
- #439 Reliability Works flagged "unlicensed contractor" on Angi — left as-is; owner's
  matter, not ours to adjudicate.

## Closure checks (Aug 6 evening)
- Deleted: #290 Hangar7 "Permanantly Closed" row; #559 Second Shot (zero web footprint,
  no phone — phantom).
- Kept: #387 La Cherry Moda (ACTIVE — LLC filed May 2025, live IG/TikTok, recent pop-up
  sale); #501 Cinco De Mayo (real per menu directories, current address unconfirmed);
  #514 Black Rose Tattoos (possible home-based artist, "Black Rose Tattoo Co" FB may be
  them — unverified).

## Aug 11 2026 — enrichment sweep (5 agents) flags for owner judgment
- #524 California Realty Executives: site says 312 N H St; DB has 129 N I St ste A — verify address.
- #558 VTC Enterprises: rebranded BEACON (VTC–LOVARC merger) — rename once local branding confirmed.
- #549: name carries "(UNDER NEW MANAGEMENT)" — keep or drop?
- #267 SB Veterans Services: apostrophe vs official spelling.
- #456 Warren & McCune DDS: Dr. Warren retired; practice now Village Dental Center (Dr. McCune).
- #501 Cinco De Mayo: listing shows 640 N H St vs our 503 N H St.
- #442 Wolf Electric: BBB "out-of-business suspected" but license active — re-check.
- #510 Fortified Tattoo: Retail vs Health & Beauty categorization call.
- Dead/wrong website URLs to clear: #240, #254 (security-flagged domain), #416, #528, #600, #608.
- #605 Lompoc Fuel / #609 Conserv Fuel: existence unverified — candidates for closed status pending a drive-by.
- Closed (status='closed'): #302 Dark Water Winery, #514 Black Rose TATTOOS, #341 Sav-On Pharmacy (dup of #339).
