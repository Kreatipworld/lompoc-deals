#!/usr/bin/env node
/**
 * Composes the Highlight of the Week narration for a member, from the member's own row.
 *
 * The point of the series is that it runs every week without anyone writing copy, so the script
 * has to be generated, not authored. Everything here traces to the database or to signage the
 * owner put up themselves — no invented history, no adjectives the row can't support, no rating
 * (there isn't one), and no claim about membership that `plan_override` doesn't back.
 *
 * Length is the hard constraint: the film is 20s, so the read has to land near 18s or it runs over
 * the end card. Spoken English is roughly 2.6 words/second at this pace, so the target is ~46
 * words. The builder drops optional clauses in priority order until it fits rather than speeding
 * the read up — a rushed VO is worse than a shorter one.
 *
 * Numbers are spelled out because TTS reads "1974" as "one thousand nine hundred seventy-four".
 *
 * Usage:
 *   node scripts/highlight-narration.mjs <slug>
 *   node scripts/highlight-narration.mjs <slug> --seconds=18
 */
import fs from "node:fs"
import { neon } from "@neondatabase/serverless"

const slug = process.argv[2]
if (!slug) throw new Error("usage: highlight-narration.mjs <slug> [--seconds=18]")
const TARGET_SECONDS =
  Number((process.argv.find((a) => a.startsWith("--seconds=")) || "--seconds=18").slice(10)) || 18
// Measured, not guessed: Sterling reads 37 words in 20.28s = 1.82 w/s. The first version assumed
// 2.6 — a conversational rate — and let a 20.3s script through labelled "14.2s", which is how a
// read ends up 4.5% too long for its film. A calm broadcast read is slower than speech.
const WORDS_PER_SECOND = 1.82
const MAX_WORDS = Math.round(TARGET_SECONDS * WORDS_PER_SECOND)

const sql = neon(
  fs.readFileSync(".env.local", "utf8").match(/^DATABASE_URL=(.*)$/m)[1].replace(/^["']|["']$/g, "")
)

const [biz] = await sql`
  select b.id, b.name, b.slug, b.address, b.about, b.description, b.hours_json,
         b.owner_user_id, b.plan_override, c.name as category
  from businesses b left join categories c on c.id = b.category_id
  where b.slug = ${slug} and b.status = 'approved'`
if (!biz) throw new Error(`no approved business with slug ${slug}`)

/** "640 N H St, Lompoc, CA 93436" → "North H Street" — how a local says it, not how mail does. */
function streetOf(address) {
  if (!address) return null
  const m = address.match(/^\s*\d+\s+([^,]+)/)
  if (!m) return null
  return m[1]
    .replace(/\bN\b\.?/i, "North").replace(/\bS\b\.?/i, "South")
    .replace(/\bE\b\.?/i, "East").replace(/\bW\b\.?/i, "West")
    .replace(/\bSt\b\.?/i, "Street").replace(/\bAve\b\.?/i, "Avenue")
    .replace(/\bBlvd\b\.?/i, "Boulevard").replace(/\bRd\b\.?/i, "Road")
    .trim()
}

/** TTS says "one thousand nine hundred seventy-four" unless the year is spelled. */
function spellYear(y) {
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
  const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen"]
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
  const two = (n) => (n < 10 ? ones[n] : n < 20 ? teens[n - 10] : `${tens[Math.floor(n / 10)]}${n % 10 ? "-" + ones[n % 10] : ""}`)
  const hi = Math.floor(y / 100), lo = y % 100
  if (lo === 0) return `${two(hi)} hundred`
  return `${two(hi)} ${lo < 10 ? "oh " + ones[lo] : two(lo)}`
}

/** The first clause of the about text, minus the address the film already prints. */
function offerClause(about, description, name) {
  const src = (about || description || "").replace(/\s+/g, " ").trim()
  if (!src) return null
  const first = src.split(/(?<=\.)\s/)[0] || src
  // Owners write about text starting with a SHORT form of their name ("Vargas Jewelers is a…")
  // while the row holds the full one ("Vargas Jewelers Trophies & Awards"). Matching only the full
  // name left the name in, and the line then said it twice in eight seconds.
  const words = name.split(/\s+/).filter(Boolean)
  const prefixes = []
  for (let n = words.length; n >= 1; n--) prefixes.push(words.slice(0, n).join(" "))
  let s = first
  for (const p of prefixes) {
    const re = new RegExp(`^${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+(is|are)\\s+`, "i")
    if (re.test(s)) {
      s = s.replace(re, "")
      break
    }
  }
  s = s
    .replace(/\s+(at|on)\s+\d+[^,.]*(,\s*)?/i, " ")
    .replace(/\bin (Old Town )?Lompoc\b/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .trim()
  if (!s) return null
  s = s.charAt(0).toLowerCase() + s.slice(1)
  return s.replace(/\.$/, "")
}

/**
 * Last pass over any generated clause, applied to all of them.
 *
 * Three things this exists to stop, each found by running the generator over real members rather
 * than the one it was written against:
 *   • Parentheticals get sliced mid-bracket — "Licensed and bonded (CSLB Lic." — because clause
 *     trimming doesn't know brackets. Drop them entirely.
 *   • Licence and certification numbers are the owner's to publish and verify, not ours to recite.
 *   • The street gets named twice when the about text repeats what the opener already said.
 */
function tidy(clause, { street } = {}) {
  if (!clause) return null
  let s = clause
    .replace(/\([^)]*\)?/g, " ")
    .replace(/\b(CSLB|Lic\.?|License|Licence|Cert(ificate|ification)?)\b[^.,;]*/gi, " ")
    .replace(/\bstate\s+licen[cs]e[^.,;]*/gi, " ")
  if (street) {
    const re = new RegExp(`\\s*(on|at|in)\\s+${street.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "ig")
    s = s.replace(re, " ")
  }
  s = s
    .replace(/\s+([,;.])/g, "$1")
    .replace(/[,;]\s*\./g, ".")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,;—-]+/, "")
    .replace(/[\s,;—-]+$/, "")
    .trim()
  if (!s || s.split(/\s+/).length < 3) return null
  return /[.!?]$/.test(s) ? s : `${s}.`
}

const OPEN_DAYS = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday" }

/** "Monday through Saturday" — a span a listener can hold, not seven open/close times. */
function daysClause(hours) {
  if (!hours || typeof hours !== "object") return null
  const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
  const open = order.filter((d) => hours[d] && hours[d].open)
  if (!open.length) return null
  const firstIdx = order.indexOf(open[0]), lastIdx = order.indexOf(open[open.length - 1])
  const contiguous = open.length === lastIdx - firstIdx + 1
  if (contiguous && open.length > 1) return `open ${OPEN_DAYS[open[0]]} through ${OPEN_DAYS[open[open.length - 1]]}`
  if (open.length === 1) return `open ${OPEN_DAYS[open[0]]}`
  return null
}

const street = streetOf(biz.address)
const offer = offerClause(biz.about, biz.description, biz.name)

/**
 * The second sentence of the about text, when there is budget for it.
 *
 * This is usually where the distinctive thing lives — Vargas's in-house jeweler and on-site
 * engraving are the reason to walk in, and the first sentence only says "jewelry store". Trimmed
 * to its own first clause so a long paragraph can't blow the word budget.
 */
function detailClause(about) {
  const src = (about || "").replace(/\s+/g, " ").trim()
  const sentences = src.split(/(?<=\.)\s/).filter(Boolean)
  if (sentences.length < 2) return null
  let s = sentences[1].replace(/\.$/, "").trim()
  if (s.split(/\s+/).length > 16) s = s.split(/,\s*/)[0]
  if (!s || s.split(/\s+/).length < 3) return null
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}.`
}
const detail = detailClause(biz.about)
const days = daysClause(biz.hours_json)
// Only from their own signage, and only when the about text or name carries it.
const sinceMatch = (biz.about || "").match(/\bsince\s+(19|20)(\d{2})\b/i)
const since = sinceMatch ? spellYear(Number(sinceMatch[0].match(/\d{4}/)[0])) : null

// Ordered by what a listener would most want. Optional clauses drop from the bottom up to fit.
const REQUIRED = [
  `This week on Lompoc Locals:`,
  `${biz.name}${street ? `, on ${street}` : ""}.`,
]
// Ordered by what earns its seconds. Hours go last because the film prints them on screen anyway;
// the detail sentence is what a listener can't get from the card.
const cap = (s) => (s ? `${s.charAt(0).toUpperCase()}${s.slice(1)}` : null)
const OPTIONAL = [
  since ? `Serving Lompoc since ${since}.` : null,
  tidy(cap(offer), { street }),
  tidy(detail, { street }),
  days ? `${cap(days)}.` : null,
].filter(Boolean)
const CLOSE = [`Find them on Lompoc Locals dot com.`]

const wordCount = (parts) => parts.join(" ").split(/\s+/).filter(Boolean).length
let parts = [...REQUIRED, ...OPTIONAL, ...CLOSE]
while (wordCount(parts) > MAX_WORDS && OPTIONAL.length) {
  OPTIONAL.pop()
  parts = [...REQUIRED, ...OPTIONAL, ...CLOSE]
}

const script = parts.join(" ").replace(/\s{2,}/g, " ").trim()
const words = wordCount(parts)

console.log(script)
console.error(
  `\n  ${words} words · ~${(words / WORDS_PER_SECOND).toFixed(1)}s at ${WORDS_PER_SECOND} w/s ` +
    `(target ${TARGET_SECONDS}s)\n` +
    `  member: ${biz.name} · ${biz.category ?? "—"} · ` +
    `${biz.owner_user_id ? "claimed" : "unclaimed"} · plan ${biz.plan_override ?? "free"}\n`
)
