# What the content actually does

The point of this file is to stop us guessing. Every post that goes out is generated from a
known series, at a known time, on a known channel, in a known shape — the ledger records all
four — so once the numbers land we can say which of those things is doing the work.

## How to read a result

`ledger.csv` maps a Buffer post ID to the things we chose:

| Column | The question it answers |
|---|---|
| `series` | Do run-downs beat spotlights? Do videos beat cards? |
| `due_at_local` | Does a working town look at its phone at 08:30 or at 17:30? |
| `channel` | Is the effort on both platforms paying, or is one carrying it? |
| `shape` | Is the per-platform sizing (4:5 vs 9:16) worth the extra render? |
| `opener` | Which hand-written opener earns the tap — the neighbourhood line or the neutral one? |
| `media` | Which specific card, so a winner can be looked at rather than guessed about. |

Buffer's metrics refresh **daily** and can lag the network by up to ~24h, so a post is not
worth judging until the day after it sends. `metricsUpdatedAt: null` means no data yet, not
zero performance — those are different things and the difference matters early on when a
handful of zeros could otherwise read as failure.

## Pulling the numbers

In a session with Buffer connected:

- `get_aggregated_post_metrics` for the totals over a window.
- `list_posts` with `includeMetrics: true`, filtered to `status: ["sent"]`, for per-post rows.

Join those rows to `ledger.csv` on the post ID, then group by `series`, by hour of
`due_at_local`, and by `channel`. Three groupings, three answers.

## Baseline

**Checked 2026-07-31, ~09:30 PT — no data yet.** Every metric returned 0 with
`metricsUpdatedAt: null`. Two posts had published about an hour earlier, which is inside the
refresh window, so this is a starting line rather than a result.

| Published | Series | Channel | Link |
|---|---|---|---|
| 2026-07-31 08:49 | Worth the stop (Wine Ghetto) | Instagram | https://www.instagram.com/p/Dbdn6YfoDo-/ |
| 2026-07-31 08:50 | Worth the stop (Wine Ghetto) | TikTok | https://tiktok.com/@lompoclocals/video/7668719557497867534 |

Both were scheduled for Aug 4 and went out early — their due time was rewritten to 08:48 on
Jul 31 and both carry `sharedNow: true`. Worth remembering when reading their numbers: they
landed on a Friday morning, not the Tuesday evening slot the series is designed around, so
they are not a fair test of the 17:30 slot.

## Questions worth answering first

1. **Do the run-downs earn their slot?** "One street" and "The short list" are the only posts
   that show four businesses at once and the only ones with a 2×2 grid. If a grid card beats a
   single-photo spotlight, more of the calendar should become run-downs.
2. **Is 08:30 a real slot?** The week-ahead post assumes people plan their week on Monday
   morning. That is an assumption, not a finding.
3. **Does the 9:16 cut pay for itself?** Every card renders twice. If TikTok performs the same
   on a centre-cropped 4:5, that whole branch of the pipeline can go.
4. **Which video cover pulls?** Four spots now pin four deliberately different frames — a neon
   sign, a brand card, a rocket, a map. That is a natural four-way test of what stops a scroll.

## What not to conclude

The account is days old and posting to a small following, so early numbers say more about
reach than about the writing. Don't retire a series on one bad post; a series has earned an
opinion after it has run three or four times.
