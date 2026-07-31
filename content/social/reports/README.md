# Performance reports

`ledger.csv` maps each Buffer post id to the labels the generator used — series, opener,
channel, slot time, media. Metrics come back from Buffer keyed by post id, so this file is what
turns them into decisions instead of impressions.

Two rules from the spec, so a good week doesn't get mistaken for a trend:

1. **No bucket is ranked below 6 posts.** Report it as not enough data yet.
2. **Compare against the account's own rolling median**, never a fixed number. This account's
   baseline moves weekly as the follower count changes.

Unavailable metrics are recorded as unavailable, not as zero — a zero drags a median down and
quietly biases every comparison after it.

Append to the ledger whenever posts are scheduled. Buffer's own ids are the join key; a caption
edited by hand inside Buffer stays attributable because the id doesn't change.
