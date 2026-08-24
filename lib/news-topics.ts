/**
 * Canonical topics for the news desk. A story carries its topic as a
 * `topic:<slug>` tag, so filtering is plain jsonb containment and the
 * /news chip bar, digest, and admin desk all speak the same names.
 */
export type NewsTopic = {
  slug: string
  en: string
  es: string
  emoji: string
  /** Keywords that map free-form tags/headlines onto this topic. */
  keywords: string[]
}

export const NEWS_TOPICS: NewsTopic[] = [
  { slug: "vandenberg-space", en: "Vandenberg & Space", es: "Vandenberg y el espacio", emoji: "🚀", keywords: ["vandenberg", "rocket", "launch", "spacex", "starlink", "space force", "spaceport", "falcon"] },
  { slug: "city-hall", en: "City Hall", es: "Ayuntamiento", emoji: "🏛️", keywords: ["city of lompoc", "city council", "fire department", "police", "utilities", "utility", "mayor", "ordinance", "public works"] },
  { slug: "business", en: "Business", es: "Negocios", emoji: "🏪", keywords: ["business", "opening", "now open", "restaurant", "shop", "store", "economy", "housing", "development", "construction", "market"] },
  { slug: "schools-sports", en: "Schools & Sports", es: "Escuelas y deportes", emoji: "🎓", keywords: ["school", "lompoc high", "cabrillo", "football", "sports", "students", "education", "lusd", "hancock"] },
  { slug: "community", en: "Community", es: "Comunidad", emoji: "❤️", keywords: ["community", "families", "donation", "volunteer", "nonprofit", "cleanup", "church", "veterans", "history", "museum"] },
  { slug: "food-events", en: "Food & Events", es: "Comida y eventos", emoji: "🎉", keywords: ["festival", "event", "concert", "parade", "wine", "food", "market days", "fair", "celebration"] },
]

export function topicBySlug(slug: string): NewsTopic | undefined {
  return NEWS_TOPICS.find((t) => t.slug === slug)
}

export const TOPIC_TAG_PREFIX = "topic:"

/** Derive the canonical topic from free-form tags and/or a headline. */
export function deriveTopic(tags: string[] | null | undefined, title = ""): NewsTopic {
  const hay = [...(tags ?? []), title].join(" ").toLowerCase()
  // explicit topic tag wins
  for (const t of tags ?? []) {
    if (t.startsWith(TOPIC_TAG_PREFIX)) {
      const found = topicBySlug(t.slice(TOPIC_TAG_PREFIX.length))
      if (found) return found
    }
  }
  let best: NewsTopic = NEWS_TOPICS[4] // community is the honest default
  let bestScore = 0
  for (const t of NEWS_TOPICS) {
    const score = t.keywords.filter((k) => hay.includes(k)).length
    if (score > bestScore) { best = t; bestScore = score }
  }
  return best
}

/** The topic:<slug> tag for a topic. */
export function topicTag(slug: string): string {
  return `${TOPIC_TAG_PREFIX}${slug}`
}
