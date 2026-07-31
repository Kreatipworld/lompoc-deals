/**
 * The voice of Lompoc Locals — one module so captions and cards can't disagree.
 *
 * The shape of every caption is: a hand-written opener that carries the warmth, then a body
 * derived mechanically from live data so it can't drift or invent. Edit the openers here; the
 * generators read them.
 *
 * See docs/superpowers/specs/2026-07-30-social-content-concept-design.md.
 *
 * Audience is residents about to spend time or money in town — not business owners. Nothing here
 * asks anyone to claim a page, and nothing frames the town or the platform as cheap.
 */

/* ---------- neighbourhoods ---------- */

// Matched against the street line of an address, most specific first. North H is checked before
// the Old Town letter-street pattern so "697 N H St" doesn't read as Old Town.
const NEIGHBOURHOODS = [
  { test: /\b[NS]?\s?H St|North H|South H/i, when: /\bN\.?\s?H St|North H/i, key: "north-h" },
  { test: /\b(N|S|North|South)?\s?[HIJG] St\b|Ocean Ave|Cypress Ave/i, key: "old-town" },
  { test: /Central Ave/i, key: "central" },
  { test: /Chestnut Ave/i, key: "east" },
  { test: /Constellation|Burton Mesa|Vandenberg Village|Mission Hills/i, key: "village" },
  // Lompoc is a lettered grid. Anything on another letter street or a named town avenue is still
  // central Lompoc — without this bucket most addresses fell through to a category opener, and a
  // wrong category then produced a wrong claim (a plumber told to worry about car noise).
  {
    test: /\b(N|S|North|South)?\s?[A-G] St\b|\b(Walnut|College|Pine|Olive|Laurel|Maple|Locust|Cherry|Lupine)\s+(Ave|St)/i,
    key: "grid",
  },
]

const NEIGHBOURHOOD_OPENERS = {
  "old-town": "Old Town regulars already know this one.",
  "north-h": "North H Street, where half the town's errands happen.",
  central: "Out on Central, between the errands.",
  east: "Out east, where the valley's wine actually gets made.",
  village: "Village side.",
  grid: "A few blocks off the main drag.",
}

/**
 * Openers for businesses whose address doesn't place them.
 *
 * Deliberately category-free. The category column is unreliable — it files a tattoo studio under
 * "Retail" and a plumbing contractor under "Auto" — and a category-flavoured opener turns that
 * data error into a claim the post gets wrong in public. These say something true of any business.
 */
const NEUTRAL_OPENERS = [
  "One for the list.",
  "Filed under: good to know.",
  "Worth knowing about.",
  "Adding this one to the record.",
  "Here's one that's been here a while.",
]

/** Stable pick, so the same business always gets the same opener across rebuilds. */
function neutralOpener(seed = "") {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return NEUTRAL_OPENERS[h % NEUTRAL_OPENERS.length]
}

/* ---------- categories ---------- */


// What the page actually has, stated plainly. Never a command.
const CATEGORY_CTA = {
  "Food & Drink": "Menu, hours and directions",
  Retail: "Hours and directions",
  Services: "Services, hours and contact",
  Wineries: "Tasting hours and directions",
  "Health & Beauty": "Services, hours and booking",
  Auto: "Hours, services and directions",
  Entertainment: "What's on, hours and directions",
  "Real Estate": "Listings, hours and contact",
  Dispensaries: "Hours and directions",
}
const CATEGORY_CTA_FALLBACK = "Hours and directions"

const SERIES_OPENERS = {
  weekAhead: "Here's the week, if you're making plans.",
  place: "Worth the stop, if you've got an hour.",
  weekend: "Weekend plans, sorted.",
  // Launch openers take the weekday, so they're built in launchOpener() below.
}

const NO_STOREFRONT_OPENER = "No storefront. Still one of ours."

/* ---------- run-downs ---------- */

/**
 * Street names the way people say them, expanded from the postal line.
 *
 * A lookup table would go stale the moment a business lands on a street nobody has listed on yet,
 * and new addresses arrive constantly — so this expands the abbreviations instead. Anything it
 * doesn't recognise (CA-246) passes through untouched, which is also how people say it.
 */
const DIRECTION = { N: "North", S: "South", E: "East", W: "West" }
const STREET_TYPE = {
  St: "Street",
  Ave: "Avenue",
  Rd: "Road",
  Blvd: "Boulevard",
  Ln: "Lane",
  Dr: "Drive",
  Ct: "Court",
  Pl: "Place",
  Hwy: "Highway",
}
export function streetName(s) {
  const words = String(s || "").trim().split(/\s+/)
  return words
    .map((w, i) => {
      const bare = w.replace(/\.$/, "")
      if (i === 0 && DIRECTION[bare]) return DIRECTION[bare]
      if (i === words.length - 1 && STREET_TYPE[bare]) return STREET_TYPE[bare]
      return w
    })
    .join(" ")
}

/**
 * Openers for the two run-down series.
 *
 * Every line here has to stay true of any street or any category the rotation lands on — the
 * pools are picked by a counter, so a line that only works for wineries will eventually run over
 * a tyre shop. Nothing claims walkability, price, or quality; the count and the names do the work.
 */
const STREET_OPENERS = [
  (n, name) => `${n} businesses on ${name}. Four of them:`,
  (n, name) => `One street. ${n} businesses on it.`,
  (n, name) => `${name}, end to end — ${n} businesses.`,
]

/** Keyed to the category slug, because "38 places to eat" and "38 wineries" want different lines. */
const CATEGORY_OPENERS = {
  "food-drink": (n) => `${n} places to eat in town. Four to start with:`,
  wineries: (n) => `${n} wineries in the valley. Four to start with:`,
  retail: (n) => `${n} shops in town. Four of them:`,
  services: (n) => `${n} local services on the record. Four of them:`,
  "health-beauty": (n) => `${n} places in town to get sorted out. Four of them:`,
  auto: (n) => `${n} auto shops in town. Four of them:`,
  entertainment: (n) => `${n} places in town to actually go out. Four of them:`,
  "real-estate": (n) => `${n} real-estate offices in town. Four of them:`,
  dispensaries: (n) => `${n} dispensaries in town. Four of them:`,
}
const CATEGORY_OPENER_FALLBACK = (n, label) => `${n} of them in town, on the record. Four to start with:`

/**
 * What the run-down card's big number is counting.
 *
 * The card sets the count beside this phrase, so it has to say what is being counted: the first
 * cut paired "142" with "North H Street" and the result read as a street address rather than a
 * tally of the businesses on it.
 */
const CATEGORY_NOUN = {
  "food-drink": "places to eat in town",
  wineries: "wineries in the valley",
  retail: "shops in town",
  services: "local services in town",
  "health-beauty": "health & beauty spots in town",
  auto: "auto shops in town",
  entertainment: "places to go out in town",
  "real-estate": "real-estate offices in town",
  dispensaries: "dispensaries in town",
}
export const streetNoun = (key) => `businesses on ${streetName(key)}`
export const categoryNoun = (slug, label) => CATEGORY_NOUN[slug] || `${String(label).toLowerCase()} in town`

/** Stable pick, so the same street always opens the same way across rebuilds. */
export function streetOpener(count, key) {
  const name = streetName(key)
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return STREET_OPENERS[h % STREET_OPENERS.length](count, name)
}

export const categoryOpener = (count, slug, label) =>
  (CATEGORY_OPENERS[slug] || ((n) => CATEGORY_OPENER_FALLBACK(n, label)))(count)

/* ---------- hashtags ---------- */

export const HASHTAGS = {
  general: "#Lompoc #LompocCA #CentralCoast #805",
  business: "#Lompoc #LompocBusiness #ShopLocalLompoc #805",
  oldTown: "#Lompoc #OldTownLompoc #ShopLocalLompoc #805",
  food: "#Lompoc #LompocCA #LompocEats #ShopLocalLompoc #805",
  wine: "#LompocWine #SantaRitaHills #Lompoc #LompocCA #805",
  outdoors: "#Lompoc #LompocCA #ThingsToDoLompoc #CentralCoast #805",
  space: "#VandenbergSFB #RocketLaunch #Lompoc #CentralCoast #805",
}

/* ---------- helpers ---------- */

export const street = (addr) => (addr || "").split(",")[0].trim()

/** Which part of town, or null when the address doesn't say. */
export function neighbourhood(address) {
  const s = street(address)
  if (!s) return null
  for (const n of NEIGHBOURHOODS) {
    if (n.when) {
      if (n.when.test(s)) return n.key
      continue
    }
    if (n.test.test(s)) return n.key
  }
  return null
}

/**
 * The warm line. Where a place sits, never what bucket it's filed under: the category column is
 * unreliable enough that a category-flavoured opener once told a plumbing contractor's audience
 * to worry about car noise. Unplaced addresses get a neutral line instead.
 */
export function opener({ address, slug }) {
  if (!street(address)) return NO_STOREFRONT_OPENER
  const n = neighbourhood(address)
  if (n && NEIGHBOURHOOD_OPENERS[n]) return NEIGHBOURHOOD_OPENERS[n]
  return neutralOpener(slug || street(address))
}

export const seriesOpener = (key) => SERIES_OPENERS[key] || ""

/**
 * Short location tag for a card eyebrow. Shares the matcher with the caption opener so a card
 * can't label a North H address "Old Town" while its own caption says otherwise.
 */
const NEIGHBOURHOOD_LABELS = {
  "old-town": "in Old Town Lompoc —",
  "north-h": "on North H Street —",
  central: "on Central Ave —",
  east: "east side of Lompoc —",
  village: "in Vandenberg Village —",
  grid: "in Lompoc —",
}
export function neighbourhoodLabel(address) {
  if (!street(address)) return "serving Lompoc —"
  return NEIGHBOURHOOD_LABELS[neighbourhood(address)] || "in Lompoc, California —"
}

/** Street line for display: drop suite/unit noise that adds nothing on a card. */
export const streetLine = (addr) =>
  street(addr)
    .replace(/[,\s]+(?:STE\.?|Suite|Unit|#)\s*[\w-]+$/i, "")
    .trim()

/**
 * The " — street" suffix after a name, or nothing.
 *
 * Suppressed when the street just restates the name: several parks have an address whose first
 * line is the park itself, which produced "Ryon Park — Ryon Memorial Park".
 */
export function nameSuffix(title, address) {
  const s = streetLine(address)
  if (!s) return ""
  const norm = (v) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
  const a = norm(title)
  const b = norm(s)
  if (!b || a === b) return ""
  const shorter = a.length <= b.length ? a : b
  const longer = a.length <= b.length ? b : a
  if (shorter.length > 3 && longer.includes(shorter)) return ""
  return ` — ${s}`
}

export const launchOpener = (date) =>
  `Look up ${date.toLocaleDateString("en-US", { weekday: "long" })} night. 🚀`

/* ---------- launch cards ---------- */

/**
 * Launches are the one series that fires most weeks, so two of its cards land side by side in a
 * profile grid more often than any other. The first cut wrote one card — same eyebrow, same
 * "There's a launch.", same pill — and a scrolled grid read it as the same post twice.
 *
 * So the card's three written lines come from a bank instead. Nothing here asserts a time of day
 * or a time of night: the launch time we publish comes from the events table and the card doesn't
 * repeat it, so a line like "tonight" would eventually run over a morning launch.
 *
 * Every variant keeps "southwest" — the wayfinding is the genuinely useful part for a resident
 * and it's true of every Vandenberg launch seen from town.
 */
const LAUNCH_CARD_LINES = [
  { eyebrow: (when) => `${when} — over our valley,`, headline: ["There's a", "launch."], look: "Look southwest 👀" },
  { eyebrow: (when) => `${when} — out at Vandenberg,`, headline: ["Something's", "going up."], look: "Face southwest 👀" },
  { eyebrow: (when) => `${when} — from the base,`, headline: ["Eyes on", "the sky."], look: "Southwest, over the hills 👀" },
  { eyebrow: (when) => `${when} — over the valley,`, headline: ["Another", "one up."], look: "Look southwest 👀" },
]

/**
 * Which week of the epoch a date falls in.
 *
 * Launch posts sit a week apart, so a week counter is what makes consecutive cards differ —
 * a hash of the date would be stable but could hand two neighbouring weeks the same slot.
 * Shared with the photo bank so the picture turns over on the same beat as the words.
 */
export const launchWeek = (date) => Math.floor(Date.parse(`${date}T00:00:00Z`) / 604_800_000)

/** The written lines for one launch card. `when` is the pre-formatted day, e.g. "Fri · Jul 31". */
export function launchCardVoice(date, when) {
  const v = LAUNCH_CARD_LINES[Math.abs(launchWeek(date)) % LAUNCH_CARD_LINES.length]
  return { eyebrow: v.eyebrow(when), headline: v.headline, look: v.look }
}

/** What's on the page. Drops "hours" when we don't actually have them. */
export function cta(category, { hasHours = true } = {}) {
  let label = CATEGORY_CTA[category] || CATEGORY_CTA_FALLBACK
  if (!hasHours) {
    label = label
      .replace(/,\s*hours\s+and\s+/i, " and ")
      .replace(/^Hours\s+and\s+/i, "")
      .replace(/\s*hours\s*,\s*/i, " ")
    label = label.charAt(0).toUpperCase() + label.slice(1)
  }
  return label
}

export function hashtagsFor(category, address) {
  if (neighbourhood(address) === "old-town") return HASHTAGS.oldTown
  if (category === "Food & Drink") return HASHTAGS.food
  if (category === "Wineries") return HASHTAGS.wine
  return HASHTAGS.business
}

/**
 * One specific, true sentence about a business, taken from the about text we authored.
 *
 * Only sentence one is used, with the parts a caption doesn't need removed: the business-name
 * prefix (the name is already on the line above), and the street address (also above). The address
 * pattern must consume the whole house number — an earlier version left "97 N H St" behind from
 * "697 N H St", and "12 S." from "112 S.".
 */
// Abbreviations that end in a period without ending a sentence. "Sta. Rita Hills" is the one that
// bit us: a naive split produced "...from its 40-acre estate vineyard in the northern Sta."
const ABBREV = /\b(?:Sta|St|Ave|Blvd|Rd|Dr|Ste|Hwy|Mt|Inc|Co|Corp|Ltd|Jr|Sr|vs|etc|approx|No)\.$/i

/** First sentence, respecting abbreviations. */
function firstSentence(text) {
  const parts = String(text).split(/(?<=[.!?])\s+/)
  let out = ""
  for (const p of parts) {
    out = out ? `${out} ${p}` : p
    if (!ABBREV.test(out.trim())) break
  }
  return out.trim()
}

// Verbs an about text uses right after the business name.
const LEAD_VERB = /^(?:is|are|was|were|has|have|serves?|specializes?|offers?|blends?|provides?|brings?|opened|founded)\b/i

export function detailSentence(name, about) {
  if (!about) return ""
  let s = firstSentence(about)
  if (!s) return ""

  // Strip a leading business name even when spacing or case differs from the DB name
  // ("In&Out Tires Lpc" in the name column vs "In & Out Tires LPC" in the prose).
  const loose = (v) => v.toLowerCase().replace(/[^a-z0-9]+/g, "")
  const target = loose(name)
  if (target) {
    const words = s.split(/\s+/)
    for (let i = Math.min(words.length, 8); i > 0; i--) {
      const head = words.slice(0, i).join(" ")
      const cleaned = loose(head.replace(/[—,"'"]/g, ""))
      if (cleaned && (cleaned === target || (cleaned.length > 6 && target.startsWith(cleaned)))) {
        let rest = words.slice(i).join(" ").replace(/^[—,\s]+/, "")
        // Drop a copula so the sentence reads as a description, keep a real verb.
        rest = rest.replace(/^(?:is|are)\s+/i, "")
        if (rest && (LEAD_VERB.test(rest) || /^[a-z]/.test(rest))) s = rest
        break
      }
    }
  }

  // Whole address clause, house number included. The terminator list matters: addresses are
  // followed by an em-dash or a parenthetical as often as by a comma.
  // Terminators: a relative clause ("whose tagline is") ends an address as surely as a comma does.
  const ADDR_END = String.raw`(?=\s+in\s+(?:downtown\s+|Old Town\s+)?Lompoc\b|\s+(?:whose|which|where|that|serving|offering|specializing)\b|\s*[—–(]|,|$)`
  s = s.replace(new RegExp(String.raw`,?\s+(?:at|on)\s+\d[\w.-]*(?:\s+[\w.'-]+)*?${ADDR_END}`, "i"), "")
  // Same clause when it opens the sentence, once the business name has been removed.
  s = s.replace(new RegExp(String.raw`^(?:at|on)\s+\d[\w.-]*(?:\s+[\w.'-]+)*?${ADDR_END}`, "i"), "")
  s = s.replace(/,?\s+(?:located|based)\s+(?:at|on|in)\s+[^,.]*/i, "")
  s = s.replace(/,?\s+in\s+(?:downtown\s+|Old Town\s+)?Lompoc\b/gi, "")
  s = s.replace(/\s*[,(]\s*(?:Suite|Ste\.?|Unit)\s*[\w-]+\)?/i, "")

  s = s
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .replace(/,\s*,+/g, ",")
    .trim()
  // A removal can leave the name dangling before a comma: "One Room Escapes & Coffee, blends ..."
  s = s.replace(/^([^,]{3,}),\s+(?=[a-z])/, "$1 ")
  s = s.replace(/^[,\s—]+/, "").replace(/[,\s]+$/, "")
  if (!s) return ""

  s = s.charAt(0).toUpperCase() + s.slice(1)
  s = trimToClause(s, 170)
  if (!/[.!?"]$/.test(s)) s += "."
  return s
}

/**
 * Some about texts open with a 260-character sentence. Cut at a clause boundary rather than
 * mid-phrase — a truncated clause can change what the sentence claims, which matters when the
 * whole point is that the body is verifiable.
 */
function trimToClause(s, max) {
  if (s.length <= max) return s
  const head = s.slice(0, max)
  const cut = Math.max(head.lastIndexOf(" — "), head.lastIndexOf(" – "), head.lastIndexOf(", "))
  if (cut > max * 0.5) return s.slice(0, cut).replace(/[,\s—–]+$/, "")
  const word = head.lastIndexOf(" ")
  return (word > 0 ? head.slice(0, word) : head).replace(/[,\s—–]+$/, "")
}

/**
 * Guard: nothing that frames the town or the platform on price ships.
 *
 * "free" must not be preceded by a hyphen — "herbicide-free" and "gluten-free" are descriptions,
 * not price claims, and an earlier version of this rule wrongly rejected a winery for one.
 */
const BANNED = /(?<!-)\bfree\b|\$0\b|\bcheap\b|\bbudget-friendly\b|\bno account needed\b/i
export function assertNoPriceFraming(text, label) {
  const m = text.match(BANNED)
  if (m) throw new Error(`price framing "${m[0]}" in ${label} — see the voice spec, rule 5`)
}

/** about_source values whose prose is ours to reuse. Google's blurbs are not. */
export const OWN_ABOUT_SOURCES = ["website", "owner", "news", "enriched", "instagram", "bbb"]
