# "The Flyer" (master, 28 s) + "The Number" (15 s owner cutdown)

Chosen Sep 24 2026 after the owner rejected the narrated "then vs now" cut as too long, repetitive and unoriginal
("Our marketing has been a little bit lacking in originality"). Both are silent films: a music bed and synthesized
sound (typewriter clacks, counter ticks, one bass hit) — no narrator.

Projects: `content/social/video/out/flyer/` (kit format `flyer-story`) and `out/number/` (`number-ad`). Masters in each `masters/`.

**Status: review cuts delivered Sep 24 ~2:15 PM PT. Not posted.**

## The Flyer — beats

| t | Beat | Source |
|---|---|---|
| 0–2.4 | Close-up, the flyer crisp — typed `LOMPOC, 1978.` | designed prop (`props/flyer-0-crisp.html`) |
| 2.2–5.4 | The pole, blank paper in the wind, a truck's shadow — `You found Ray on a pole.` | Seedance clip-0 + film treatment |
| 5.2–7.0 | Close-up, folded and creased | prop 1 |
| 6.8–9.8 | Wallet on a truck bench seat, the folded paper with the bills — `Or in your dad's wallet.` | clip-1 |
| 9.6–12.6 | Avocado fridge, paper under a magnet by a child's drawing — `On the fridge. For twenty years.` | clip-2 |
| 12.4–14.3 | Close-up, faded, magnet, pen note "736-4471 now" | prop 2 |
| 14.1–17.1 | Junk drawer: rubber bands, matchbook, brass key, the yellowed paper — `Until nobody could find it.` | clip-3 |
| 16.9–18.5 | Close-up, yellowed, corner torn | prop 3 |
| 18.3–22.3 | Phone: search "plumber" → results (Wm Rieck first) — `Now you type it.` | live captures |
| 22.1–25.3 | Wm Rieck Plumbing's page → tap-to-call — `And you call.` | live captures |
| 25.1–27.9 | 62,285 · people looked this month · lompoclocals.com | end card |

Ray's Plumbing, LOMPOC 6-4471 and "since 1961" are fictional period props and stay in the past. Every "now" frame is the live site; the plumber shown is a real member.

## The Number — beats

Black + one tick → counter 0 → 62,285 over 9 s (power2 ease-in, ticks accelerate), ten two-frame flashes of real member photos (Eddie's, In&Out, Hangar 7, Florist, Sweet Baking, Vargas, Clark Builders, Paisano's, Coastal Tint, Focus PT) → slam + bass hit: *times someone in Lompoc opened a page here this month.* → *Was it yours?* → lompoclocals.com/partners. 14.8 s. Frame 0 is black by design — set `thumbnailOffset` to the slam (~10.2 s) in Buffer.

## Facts

62,285 = `analytics_events` page_viewed + business_page_viewed, Sep 1–24 2026 (raw, same definition as the /partners hero; owner's decision Sep 24). Re-pull on posting day and re-render if it moved.

## Credits (Higgsfield, 748.52 → 736.04)

| Item | Credits |
|---|---|
| Seedance 1.5 × 4 object shots (9:16, 4 s, 720p) | 9.60 |
| sonilo: Flyer bed 30 s + Number pulse 16 s | ≈ 2.9 |
| **Total** | **12.48** of the 27 cap |

Sound design (clacks, ticks, hit) is synthesized in `_kit/sfx.py` — owned, deterministic, no credits.

## Captions — DRAFT

**The Flyer (IG Reel / FB)**
> 1978: you found Ray on a pole. Then in your dad's wallet. Then on the fridge for twenty years — until nobody could find it.
>
> Now you type it. 62,285 people looked on Lompoc Locals this month.
>
> lompoclocals.com · #Lompoc #LompocLocals #ShopLocal #CentralCoast

**The Number (IG Reel / FB, owners)**
> 62,285. That's how many times someone in Lompoc opened a page here this month. Was it yours?
>
> Get found by the whole valley: lompoclocals.com/partners
> #Lompoc #LompocLocals #SmallBusiness #ShopLocal

TikTok: video only, link in first comment. IG Story: The Flyer with link sticker → lompoclocals.com; a second Story for owners with The Number → /partners.
