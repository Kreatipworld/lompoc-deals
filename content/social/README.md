# Lompoc Locals — content

Everything we make for social lives here. **Open `index.html` in a browser** to see all of it
laid out — every post image next to the caption that ships with it, the video library, and the
launch kit.

## What's in here

| Path | What it is |
|---|---|
| `index.html` | Visual contact sheet for this whole folder. Start here. |
| `calendar.csv` | The scheduler file. One row per post: date, time, channels, series, caption, link, image. Loads straight into Buffer. |
| `calendar.md` | The same schedule as a readable table. |
| `posts/` | One ready-to-post image per scheduled post, `YYYY-MM-DD-series.png`, 1080×1350. |
| `video/` | Pre-rendered spots. `masters/` holds per-placement aspect ratios. |
| `launch-kit/` | The first round: profile art, intro carousel, brand cards, week-two set. |
| `cards/` | The HTML the post images are rendered from. **Edit these, not the PNGs.** |
| `notes/` | Caption library, bios, and the weeks 2–3 content plan. |

## Regenerating

Every image and caption comes from live site data, so a post can't promise a page that doesn't
exist or a launch that isn't scheduled. Run from the repo root:

```bash
node scripts/build-content-calendar.mjs 4          # captions + slots from live data
node scripts/build-social-cards.mjs --write-csv    # one card per post, fills the media column
node scripts/render-social-cards.mjs content/social/cards/cards-calendar.html content/social/posts
node scripts/build-content-index.mjs               # rebuilds index.html
```

Each step overwrites in place. `build-social-cards.mjs` reads `calendar.csv` rather than the
database, so a card can only ever show the subject its own caption links to.

Both build steps print warnings instead of failing quietly — a business with no usable photo,
an event whose location won't parse, a post whose media is missing. Read that output.

## The series

| Series | When | What it is |
|---|---|---|
| The week ahead | Mon 08:30 | This week's events, from the events table. |
| Worth the stop | Tue 17:30 | One in-town place, carried by its photo. |
| One street | Wed 17:00, fortnightly | Four businesses on one street, with the count for the whole street. |
| The short list | Wed 17:00, fortnightly | Four businesses in one category, with the count for the whole category. |
| On the record | Thu 12:00 | One business, one true sentence from about text we wrote. |
| Upcoming launch / Weekend plans | Fri 16:00 | A launch if one falls this weekend; otherwise a place. |
| Video | Sun 11:00 | The spots, rotating. |

The two run-downs share the Wednesday slot and alternate by week, so each lands fortnightly.
They carry three extra CSV columns — `subjects` (the four business slugs, pipe-separated),
`headline` and `count` — because their link points at a map or a category page, so unlike a
spotlight there's no slug in the URL for the card builder to look the subjects up by.

**No business is named twice.** The pools are independently ordered, which once put the same
restaurant in a run-down, a spotlight and a street post inside eight days. The generator now keeps
a set of everything it has already named and skips it everywhere else.

## Rules baked into the pipeline

- **No deal posts.** Every live deal belongs to a scraper or demo account, so promoting one
  would advertise a discount no owner agreed to. Confirm with the owner, then add by hand.
- **"This weekend" means this weekend.** The launch card only fires for a launch between the
  Friday post and the following Monday; other weekends fall back to a free-place post.
- **Places need photos.** A "you've driven past it 500 times" post is carried by the image, so
  places with no photo are skipped rather than rendered as a blank brand card.
- **No categories on cards.** The DB has a tattoo studio filed under "Retail," so spotlight
  cards say where a business is, not what it supposedly sells.

## Before scheduling

Buffer has Instagram and TikTok connected but **no Facebook channel** — and most posts in
`calendar.csv` target Facebook. Connect it first or drop that channel from the CSV.
