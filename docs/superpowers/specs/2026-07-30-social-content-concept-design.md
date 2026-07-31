# Social content concept — Lompoc Locals

**Date:** 2026-07-30
**Scope:** Instagram + TikTok content concept, voice, and the generator changes that enforce them.
**Channels:** `instagram` (lompoclocals_) and `tiktok` (lompoclocals). Facebook is deliberately
excluded — no Facebook channel exists on the Buffer account, so targeting it queues posts that
cannot send.

## Audience

**Residents of Lompoc who are about to spend time or money in town.** The person deciding where
to eat tonight, what to do Saturday, whether the thing on Central is worth stopping for.

Business owners are *not* the audience for this calendar. They are recruited by the email waves
already running (`scripts/send-claim-campaign.mjs`). A strong resident audience is what makes
owners want a page; the content earns that audience rather than asking for signups. Concretely:
**no "claim your page" CTA appears in any post in this calendar.**

Every post must answer, for a resident: *why would I care, and what do I do with this?*

## Concept — "The town, on the record"

Lompoc Locals is the account that actually knows the town: what's open, what's happening, what's
overhead, what's worth the drive. Authority comes from being specific and being right. Warmth
comes from writing like a neighbour, not a brand.

The tension to hold: **neighbourhood-warm on the opening line, professional in the body.** The
opener is hand-written and earns attention. Everything under it is mechanically derived from live
data and cannot drift.

## Voice rules

1. **Warm opener, factual body.** Line one is written by a person. Lines two onward are generated.
2. **One concrete sourced detail per post.** Never a generic compliment ("a great local spot").
3. **No accusatory second person.** "You've driven past it 500 times" is retired.
4. **One emoji maximum**, only when it carries information (🚀 for a launch). Never as punctuation.
5. **No price framing, ever.** No "free", "$0", "cheap", "budget". No "deal" unless an owner has
   authorised a specific offer. Framing the town as cheap undersells the town and the brand.
   This extends to the platform itself — see "Retired language" below.
6. **The CTA states what's on the page.** "Portfolio, hours and directions:" — not a command like
   "Tell everyone what to order 👇".
7. **Category-appropriate always.** No food CTA on a tire shop. Derived from category, or omitted.
8. **Four to six hashtags**, place-led, no filler.

## Caption structure

Four blocks, every post:

```
<warm opener — hand-written, keyed to neighbourhood, then category>

<Name> — <street, or "Lompoc" for service-area members>
<sourced detail sentence — mechanically derived>

<what's on the page>:
lompoclocals.com/<path>

<4–6 hashtags>
```

## Series

| Day | Series | Serves the resident by | Was |
|---|---|---|---|
| Mon 08:30 | The week ahead | Planning their week | This Week in Lompoc |
| Tue 17:30 | Worth the stop | Giving them somewhere to go | You've driven past it 500 times |
| Thu 12:00 | On the record | Helping them pick a business | Local spotlight |
| Fri 16:00 | Upcoming launch | Telling them when to look up | Free in Lompoc |
| Fri 16:00 | Weekend plans | Filling a launch-free weekend | Free in Lompoc |
| Sun 11:00 | Video | Brand reach | Video |

`Upcoming launch` fires only when a launch falls between the Friday post and the following
Monday. Otherwise the slot becomes `Weekend plans`. This is already implemented.

## The sourced detail sentence

Derived from `businesses.about` by taking sentence one and stripping the parts a caption doesn't
need:

- Remove a leading `"<Name> is "` / `"<Name> are "`.
- Remove any street-address clause — **consume the full house number**, not a partial digit. The
  first draft of this transform turned "697 N H St" into "97 N H St" and "112 S." into "12 S.".
- Remove a trailing `" in Lompoc"` (the account is the Lompoc account).
- Collapse whitespace; ensure terminal punctuation.

Worked example:

```
about:  "Fortified Tattoo Co. is a tattoo studio at 119 South J Street in Lompoc
         specializing in fine electric tattooing."
detail: "A tattoo studio specializing in fine electric tattooing."
```

### Provenance restriction (copyright)

`businesses.about_source` records where the text came from. Of the 163 businesses with an about
text and 4+ photos, **68 have `about_source = 'google'`** — that text is Google's prose:

> "Carry-out chain featuring chicken wings, signature breadsticks & pizza tossed from housemade dough."

Reusing it in a caption republishes third-party copy. The standing project rule is to reuse only
facts and official names, never prose.

**Spotlights are restricted to `about_source IN ('website', 'owner', 'news', 'enriched', 'instagram', 'bbb')`**
— text authored for this project. That leaves **95 eligible businesses**, about two years of
Thursday spotlights, and the pool grows with each enrichment pass.

Google-sourced businesses are not broken and not hidden from the site. They are simply not
spotlight subjects until someone writes original about text for them.

## Opener bank

Hand-written once, reused. Neighbourhood match wins; category is the fallback.

**By neighbourhood** (matched on street address):

| Match | Opener |
|---|---|
| H / I / J St, Ocean Ave, Cypress Ave | Old Town regulars already know this one. |
| N H St | North H Street, where half the town's errands happen. |
| W/E Central Ave | Out on Central, between the errands. |
| E Chestnut Ave | Out east, where the valley's wine actually gets made. |
| Constellation Rd, Burton Mesa, Vandenberg Village, Mission Hills | Village side. |

**By category** (when no neighbourhood matches):

| Category | Opener |
|---|---|
| Food & Drink | One more for the rotation. |
| Retail | Worth a look next time you're by. |
| Services | The number you want saved *before* you need it. |
| Wineries | Made in the valley, poured in the valley. |
| Health & Beauty | Book it local. |
| Automotive | For when the car starts making that noise. |
| Lodging | For when family visits. |
| anything else | Filed under: good to know. |

**Service-area members** (no street address): "No storefront. Still one of ours."

**Non-spotlight series:**

- The week ahead — "Here's the week, if you're making plans."
- Worth the stop — "Worth the stop, if you've got an hour."
- Upcoming launch — "Look up <weekday> night. 🚀"
- Weekend plans — "Weekend plans, sorted."

Openers recur. At four spotlights a month a neighbourhood opener returns every few months, which
reads as a signature. **If the cadence rises to daily, the bank must grow** — this is the known
limit of the approach.

## Retired language

**"Free" is retired as a value proposition, including for the platform itself.**

Attaching "free" to information does not make sense as a pitch. Of course the town's calendar is
free to read — saying so invites the question of why it needed saying, and frames a complete,
accurate, bilingual record of Lompoc as a discount instead of a resource. The value is that it is
*complete and correct*, not that it costs nothing.

Retired from all resident-facing copy:

| Retired | Replaced by |
|---|---|
| "Free, forever" | "All of Lompoc, in one place" |
| "free to browse, no account" | "no sign-in, nothing to install" (friction, not price) |
| "no account needed" | dropped — say nothing |
| "Best free views" | "Best vantage points" |
| "This weekend, for $0" | "Weekend plans, sorted" |
| "It's free." (video VO) | "It's all of it, in one place." |

"No sign-in, nothing to install" survives because it describes *friction*, not price — that is a
real and useful promise to a resident and says nothing about cost.

Owner-facing "claiming your page is free" is a different claim on a different audience, and is out
of scope here (see Audience). It also sits awkwardly beside a $39.99 Growth tier and should be
reviewed on the sales side.

The historical planning docs in `content/social/notes/` still contain the retired framing. They are
kept as a record rather than rewritten, so each gets a header pointing at this spec — otherwise the
old language leaks back into new content.

## Category → CTA map

| Category | CTA line |
|---|---|
| Food & Drink | Menu, hours and directions: |
| Retail | Hours and directions: |
| Services | Services, hours and contact: |
| Wineries | Tasting hours and directions: |
| Health & Beauty | Services, hours and booking: |
| Automotive | Hours, services and directions: |
| Lodging | Rooms, rates and directions: |
| anything else | Hours and directions: |

Where the business has no hours on file, the CTA drops "hours" rather than promising a section
the page doesn't have.

## Learning loop

The point of generating content from structured data is that every post carries labels — series,
opener, neighbourhood, category, weekday, time, channel. When Buffer returns performance numbers,
those labels turn results into decisions instead of impressions.

### What gets measured

Buffer exposes per-post metrics (`list_posts` with `includeMetrics`) and range totals
(`get_aggregated_post_metrics`). For each sent post we record reach/impressions, engagement
(reactions + comments + saves/shares where the platform reports them), and link clicks where
available.

### Joining metrics back to labels

Buffer returns metrics keyed by its own post id. To attribute them we need id → labels:

- **Now:** join on caption text. The generator's captions are distinctive enough to match exactly,
  and `calendar.csv` holds the labels. Works for posts loaded into Buffer by hand.
- **Later:** when posts are created through the API, write the returned post id into a ledger
  (`content/social/reports/ledger.csv`) at creation time. Exact, no text matching.

### What each bucket decides

| Bucket | Question it answers | Action when the answer is clear |
|---|---|---|
| Series | Which formats residents actually want | Cut or retime the weakest series |
| Opener | Whether the warm line is doing work | Retire weak openers, write more like the strong ones |
| Weekday + time | When Lompoc is actually looking | Edit `SLOTS` |
| Category | Which kinds of business resonate | Prioritise enrichment there, since enrichment gates the pool |
| Neighbourhood | Which parts of town pull | Balance the spotlight rotation |
| Channel | Whether 1080×1350 is costing us on TikTok | Decide the 9:16 crop on evidence |

### Guard against reading noise

At four posts per series per month, a single good post can look like a trend. Two rules:

1. **No bucket is acted on below 6 posts.** Report it as "not enough data yet" — never rank it.
2. **Compare against the account's own rolling median**, not against absolute numbers or another
   account. A new account's baseline moves every week as the follower count changes, so a fixed
   threshold would mislabel normal growth as a win.

The report states sample size beside every number and names what it dropped for being too thin.
Silent truncation would read as "we measured everything" when we didn't.

### Implementation

`scripts/analyze-social-performance.mjs` writes a dated markdown report to
`content/social/reports/`. Two paths to the data:

- **Agent-driven (works today, no setup):** the Buffer MCP tools are available in-session, so the
  metrics can be pulled and joined on request. Zero configuration.
- **Script-driven (unattended, needs a key):** a Buffer API key from
  `publish.buffer.com/settings/api` in `.env.local` lets the script run on a schedule and feed the
  existing admin Automation page.

Start agent-driven; graduate to the key when there is enough history to be worth a cron.

**Caveat:** Instagram is connected as a `business` account, so analytics should report. Buffer's
TikTok metrics are thinner than Instagram's — expect reach and engagement but not necessarily
clicks. The report marks unavailable metrics as unavailable rather than as zero, because a zero
would drag a median down and quietly bias every comparison.

## What changes in code

**`scripts/build-content-calendar.mjs`**
- `CHANNELS = "instagram,tiktok"` *(done)*
- `weekend` slot splits into `Upcoming Launch` / `Weekend Plans`, no price language *(done)*
- Spotlight query gains the `about_source` restriction and selects `about`
- Spotlight caption rebuilt to the four-block structure; drop "Tell everyone what to order"
- Series renamed per the table above
- Place and week-ahead captions rebuilt to the same structure

**`scripts/build-social-cards.mjs`**
- Series-name branches updated to the new names
- Card eyebrows carry no price language

**New `scripts/lib/voice.mjs`** — the opener bank, the category→CTA map, the lead-sentence
transform, and the neighbourhood matcher. One module so the calendar and the cards agree, and so
the openers can be edited without touching generator logic.

**New `scripts/analyze-social-performance.mjs`** — joins Buffer metrics to calendar labels and
writes the dated report described under Learning loop.

**Headers on `content/social/notes/*.md`** pointing at this spec, so the retired "free" framing
doesn't leak back into new content.

## Out of scope

- Facebook copy, until a Facebook channel exists.
- Buffer publishing. The calendar produces a CSV; nothing pushes to Buffer, and nothing will
  without explicit sign-off on the queue.
- The 9:16 TikTok crop. Cards are 1080×1350 and post to both channels as-is until the channel
  bucket in the learning loop says otherwise.
- Owner-facing "claim your page" copy and its "free" framing — different audience, sales side.
- Rewriting the historical planning docs in `content/social/notes/`. They get headers, not edits.

## Known limits

Stated rather than discovered later:

1. **Openers repeat.** Fifteen-odd lines at four spotlights a month means a neighbourhood opener
   returns every few months. Fine as a signature; visibly thin at daily cadence.
2. **The spotlight pool is gated by enrichment**, not by the number of businesses. 95 of 472 are
   eligible. Enriching Google-sourced businesses is what grows it.
3. **Buffer's free plan caps 10 scheduled posts** and 3 channels. A four-week calendar of 18 posts
   cannot be fully queued on the current plan.
4. **The metrics join is text-based until posts are created via API**, so a hand-edited caption in
   Buffer breaks attribution for that post.

## Success criteria

1. No caption contains "free", "$0", "cheap", or "deal".
2. No caption contains a category-inappropriate CTA.
3. Every spotlight names a business whose about text this project authored.
4. Every caption's detail sentence traces to a real `about` field with no invented facts.
5. No caption targets Facebook.
6. A resident reading any post can say what it is, where it is, and what to do next.
7. No resident-facing copy in `content/social/` presents "free" as a reason to use the platform.
8. Every sent post can be traced back to its series, opener, slot and category, so the first
   performance report can rank buckets that clear the 6-post minimum and name the ones that don't.
