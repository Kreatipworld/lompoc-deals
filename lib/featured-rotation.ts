// Pure rotation helpers for the Featured row. Kept dependency-free (no DB / no
// queries import) so they can be unit-tested without DATABASE_URL.

/** Seed derived from the calendar date (UTC) — stable within a day, changes daily. */
export function dateSeed(date: Date): number {
  const key = date.toISOString().slice(0, 10) // YYYY-MM-DD
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Per-request fair shuffle — a fresh random order on every call.
 *
 * Used for showcase rows (featured deals, sponsors, homepage businesses) so every
 * business gets an equal turn at the top slot instead of the same few winning by
 * alphabet or deal count. Unlike `seededShuffle`, this is intentionally NOT stable:
 * two renders of the same page give different orders, which is the whole point.
 *
 * Callers must render dynamically (no full static prerender) or the shuffle is
 * frozen at build time and the fairness is silently lost.
 */
export function fairShuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Shuffle within priority tiers: higher-ranked groups always come first, but the
 * order INSIDE each group is randomized per request. Paying partners keep the top
 * billing they bought, while competing fairly against their own peers.
 */
export function fairShuffleByRank<T>(items: T[], rankOf: (item: T) => number): T[] {
  const groups = new Map<number, T[]>()
  for (const item of items) {
    const rank = rankOf(item)
    const bucket = groups.get(rank)
    if (bucket) bucket.push(item)
    else groups.set(rank, [item])
  }
  return Array.from(groups.keys())
    .sort((a, b) => b - a) // highest rank first
    .flatMap((rank) => fairShuffle(groups.get(rank) as T[]))
}

/** Deterministic, non-mutating shuffle (mulberry32 PRNG). */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items]
  let s = seed >>> 0
  const rand = () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
