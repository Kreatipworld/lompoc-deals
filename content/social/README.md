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
