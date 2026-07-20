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

/**
 * Fill `limit` showcase slots from two pools, giving the preferred pool (paying
 * partners) a weighted chance at each slot rather than a hard reservation.
 *
 * Each slot is drawn independently: `preferredChance` of the time from `preferred`,
 * otherwise from `others`. Partners dominate on average, but every business keeps a
 * genuine shot at the homepage.
 *
 * Deliberately weights the SLOT, not the individual business. Per-business weighting
 * looks equivalent today but silently decays as the directory grows — 11 partners at
 * 60x beat 340 free listings, but the same weights lose badly against 3,400. Slot
 * probability is stable at any catalogue size.
 *
 * When one pool runs out, the remaining slots fall through to the other so we never
 * return fewer items than we could fill.
 */
export function weightedSlots<T>(
  preferred: T[],
  others: T[],
  limit: number,
  preferredChance = 0.7
): T[] {
  const p = fairShuffle(preferred)
  const o = fairShuffle(others)
  const out: T[] = []
  let pi = 0
  let oi = 0
  while (out.length < limit && (pi < p.length || oi < o.length)) {
    const wantPreferred = Math.random() < preferredChance
    if (wantPreferred && pi < p.length) out.push(p[pi++])
    else if (!wantPreferred && oi < o.length) out.push(o[oi++])
    else if (pi < p.length) out.push(p[pi++])
    else out.push(o[oi++])
  }
  return out
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
