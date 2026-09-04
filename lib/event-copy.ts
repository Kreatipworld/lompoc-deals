import { generateObject } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import type { events } from "@/db/schema"

/**
 * Synced calendar events carry nothing from their source but facts. Descriptions
 * are written here in Lompoc Locals' own words, and covers are our own real
 * Lompoc topic photos (public/news-covers) — never a third party's prose or
 * image, never a request to someone else's server.
 */

type EventCategory = typeof events.category._.data

const SITE = (() => {
  try { return new URL(process.env.AUTH_URL ?? "https://www.lompoclocals.com").origin } catch { return "https://www.lompoclocals.com" }
})()

export function eventCoverUrl(category: EventCategory | null | undefined): string {
  const slug =
    category === "sports" ? "schools-sports"
    : category === "community" || category === "arts" ? "community"
    : "food-events" // market, food, festival
  return `${SITE}/news-covers/${slug}.jpg`
}

/** Our own cover, or the row's own uploaded image; never a hotlink to another site's server. */
export function isOwnCover(url: string | null | undefined): boolean {
  if (!url) return false
  try { return new URL(url).origin === SITE || url.startsWith("/") } catch { return url.startsWith("/") }
}

const BlurbSchema = z.object({
  description: z.string().min(20).max(320),
})

export type EventFacts = {
  title: string
  location: string
  startsAt: Date
  endsAt?: Date | null
  category: EventCategory
  /** Reference text from the listing. Used for FACTS ONLY (who, what, cost, age); never quoted. */
  sourceText?: string | null
}

const SYSTEM = `You write one- or two-sentence event blurbs for Lompoc Locals, a community site for Lompoc, California.
Voice: a neighbor telling you what's on — warm, plain, specific. Present tense. No hype words, no emojis, no hashtags.
Use ONLY facts present in the input (organizer, what happens, cost, ages, food, music). Do not invent details.
Write entirely in your own words: never reuse a sentence or distinctive phrase from the reference text.
Never name a website, a calendar, a source, or the word "explore". No URLs. 140–280 characters.`

export async function writeEventBlurb(facts: EventFacts): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return null
  const anthropic = createAnthropic({ apiKey: key })
  const when = facts.startsAt.toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })
  const prompt = [
    `Title: ${facts.title}`,
    `When: ${when}`,
    `Where: ${facts.location}`,
    `Category: ${facts.category}`,
    facts.sourceText ? `Reference text (facts only, do not copy wording):\n${facts.sourceText.slice(0, 1500)}` : "",
    "",
    "Write the blurb.",
  ].join("\n")
  try {
    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5-20251001"),
      schema: BlurbSchema,
      system: SYSTEM,
      prompt,
      temperature: 0.4,
    })
    const text = object.description.replace(/\s+/g, " ").trim()
    if (/explor|\.com|http/i.test(text)) return null
    return text
  } catch {
    return null
  }
}
