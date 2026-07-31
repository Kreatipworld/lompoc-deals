# Social calendar — 4 weeks from 2026-07-30

Generated from live data: 64 upcoming events, 23 places, 60 photo-complete businesses.

**Load `calendar.csv` into Buffer** (or any scheduler that takes CSV). Columns are date, time, channels, series, text, link, media. Media paths are repo-relative — upload those files when the scheduler asks.

**No deal posts.** Every live deal belongs to a scraper or demo account, so promoting one would advertise a discount no owner agreed to. Confirm with the owner first, then add those by hand.

**Images come from the cards step**, not from this script. After regenerating this calendar, run:

```bash
node scripts/build-social-cards.mjs content/social/calendar.csv --write-csv
node scripts/render-social-cards.mjs content/social/cards/cards-calendar.html content/social/posts
```

That renders one card per post — this week's events, this weekend's launch, this business's own photo — and fills in the media column. Every post gets its own image; nothing is shared between weeks.

| Date | Time | Series | Channels | Opening line |
|---|---|---|---|---|
| 2026-07-30 | 12:00 | On the record | instagram,tiktok | North H Street, where half the town's errands happen.… |
| 2026-07-31 | 16:00 | Upcoming launch | instagram,tiktok | Look up Friday night. 🚀… |
| 2026-08-02 | 11:00 | Video | instagram,tiktok | All of Lompoc, in one place.… |
| 2026-08-03 | 08:30 | The week ahead | instagram,tiktok | Here's the week, if you're making plans.… |
| 2026-08-04 | 17:30 | Worth the stop | instagram,tiktok | Worth the stop, if you've got an hour.… |
| 2026-08-06 | 12:00 | On the record | instagram,tiktok | For when the car starts making that noise.… |
| 2026-08-07 | 16:00 | Upcoming launch | instagram,tiktok | Look up Saturday night. 🚀… |
| 2026-08-09 | 11:00 | Video | instagram,tiktok | All of Lompoc, in one place.… |
| 2026-08-10 | 08:30 | The week ahead | instagram,tiktok | Here's the week, if you're making plans.… |
| 2026-08-11 | 17:30 | Worth the stop | instagram,tiktok | Worth the stop, if you've got an hour.… |
| 2026-08-13 | 12:00 | On the record | instagram,tiktok | Village side.… |
| 2026-08-14 | 16:00 | Weekend plans | instagram,tiktok | Weekend plans, sorted.… |
| 2026-08-16 | 11:00 | Video | instagram,tiktok | All of Lompoc, in one place.… |
| 2026-08-17 | 08:30 | The week ahead | instagram,tiktok | Here's the week, if you're making plans.… |
| 2026-08-18 | 17:30 | Worth the stop | instagram,tiktok | Worth the stop, if you've got an hour.… |
| 2026-08-20 | 12:00 | On the record | instagram,tiktok | Old Town regulars already know this one.… |
| 2026-08-21 | 16:00 | Weekend plans | instagram,tiktok | Weekend plans, sorted.… |
| 2026-08-23 | 11:00 | Video | instagram,tiktok | All of Lompoc, in one place.… |
