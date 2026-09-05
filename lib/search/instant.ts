/**
 * Instant, in-browser search over a compact index of every approved business,
 * the curated word pages, and the categories. Pure: no DB, no React, no I/O —
 * so it runs on every keystroke with no debounce and is unit-testable.
 *
 * Ranking (lower is better), members first within a rank:
 *   0 name starts with the query            "hod"  → Hodges Automotive
 *   1 a word in the name starts with it     "auto" → Hodges Automotive
 *   2 a keyword/description word starts     "brake"
 *   3 fuzzy name word (edit distance ≤ 2)   "hudges" → Hodges
 *   4 category synonym fallback             "comida" → every Food & Drink place
 */

export type IndexBiz = {
  i: number
  n: string
  s: string
  /** category slug */
  c: string | null
  /** logo url; relative to `lb` when it starts with "~/" */
  l: string | null
  /** member tier: Plus 2, Growth 1, Free 0 */
  t: number
  /** extra lowercase words: category + distinctive description words */
  k: string
}
export type IndexWordPage = { s: string; en: string; es: string; a: string[] }
export type IndexCategory = { s: string; n: string; c: number; k: string }
export type SearchIndex = { v: 1; lb: string; b: IndexBiz[]; w: IndexWordPage[]; c: IndexCategory[] }

export type BizHit = IndexBiz & { rank: number; logoUrl: string | null }
export type InstantResults = {
  wordPages: IndexWordPage[]
  categories: IndexCategory[]
  businesses: BizHit[]
}

/** Lowercase, strip accents, keep letters/digits/spaces. "Café Ñandú" → "cafe nandu". */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Damerau-Levenshtein (optimal string alignment), early-exit above `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  const la = a.length, lb = b.length
  let prev2: number[] = []
  let prev: number[] = Array.from({ length: lb + 1 }, (_, j) => j)
  for (let i = 1; i <= la; i++) {
    const cur: number[] = [i]
    let rowMin = i
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + cost)
      cur[j] = v
      if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return max + 1
    prev2 = prev
    prev = cur
  }
  return prev[lb]
}

type Prepared = {
  name: string
  words: string[]
  kw: string[]
}
const prepCache = new WeakMap<SearchIndex, { biz: Prepared[]; cat: Map<string, string[]> }>()

function prepare(index: SearchIndex) {
  let p = prepCache.get(index)
  if (p) return p
  const biz = index.b.map((b) => {
    const name = fold(b.n)
    return { name, words: name.split(" ").filter(Boolean), kw: fold(b.k).split(" ").filter(Boolean) }
  })
  const cat = new Map<string, string[]>()
  for (const c of index.c) cat.set(c.s, [fold(c.n), ...fold(c.k).split(" ")].filter(Boolean))
  p = { biz, cat }
  prepCache.set(index, p)
  return p
}

export function logoUrl(index: SearchIndex, l: string | null): string | null {
  if (!l) return null
  return l.startsWith("~/") ? index.lb + l.slice(2) : l
}

/** Best rank for one query token against one business, or -1 for no match. */
function tokenRank(tok: string, p: Prepared, catWords: string[] | undefined): number {
  if (p.name.startsWith(tok)) return 0
  if (p.words.some((w) => w.startsWith(tok))) return 1
  if (p.kw.some((w) => w.startsWith(tok))) return 2
  if (tok.length >= 4 && p.words.some((w) => w.length >= 4 && editDistance(tok, w, tok.length >= 6 ? 2 : 1) <= (tok.length >= 6 ? 2 : 1))) return 3
  if (catWords && tok.length >= 3 && catWords.some((w) => w.startsWith(tok) || (tok.length >= 4 && w.length >= 4 && editDistance(tok, w, 1) <= 1))) return 4
  return -1
}

export function instantSearch(index: SearchIndex, query: string, limit = 8): InstantResults {
  const q = fold(query)
  const empty: InstantResults = { wordPages: [], categories: [], businesses: [] }
  if (q.length < 2) return empty
  const toks = q.split(" ").filter(Boolean)
  const { biz, cat } = prepare(index)

  // Word pages: slug words, titles, aliases — prefix on any word, or the query inside an alias.
  const wordPages = index.w
    .filter((w) => {
      const hay = [w.s.replace(/-/g, " "), w.en, w.es, ...w.a].map(fold)
      return hay.some((h) => h === q || h.startsWith(q) || h.split(" ").some((x) => x.startsWith(q)) || (q.length >= 4 && h.includes(q)))
    })
    .slice(0, 3)

  // Categories: name or synonym prefix.
  const categories = index.c
    .filter((c) => c.c > 0 && c.s !== "other" && (cat.get(c.s) ?? []).some((w) => toks.every((t) => w.startsWith(t) || t.startsWith(w) && w.length >= 4) || w.startsWith(q)))
    .sort((a, b) => b.c - a.c)
    .slice(0, 3)

  // Businesses: every token must match; the hit's rank is its worst token.
  const hits: BizHit[] = []
  for (let n = 0; n < index.b.length; n++) {
    const b = index.b[n]
    const p = biz[n]
    const catWords = b.c ? cat.get(b.c) : undefined
    let worst = -1
    let ok = true
    for (const tok of toks) {
      const r = tokenRank(tok, p, catWords)
      if (r < 0) { ok = false; break }
      if (r > worst) worst = r
    }
    if (!ok) continue
    // Whole-query name prefix beats per-token ranks ("hangar 7" → rank 0).
    if (p.name.startsWith(q)) worst = 0
    hits.push({ ...b, rank: worst, logoUrl: logoUrl(index, b.l) })
  }
  hits.sort((a, b) => a.rank - b.rank || b.t - a.t || a.n.localeCompare(b.n))
  // Category-fallback hits (rank 4) only fill in when the query found little else.
  const direct = hits.filter((h) => h.rank < 4)
  const businesses = (direct.length >= 3 ? direct : hits).slice(0, limit)
  return { wordPages, categories, businesses }
}
