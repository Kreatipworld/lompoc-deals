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
