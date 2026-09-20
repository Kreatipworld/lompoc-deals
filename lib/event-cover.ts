/**
 * Every event needs a cover, and they must not all be the same picture.
 *
 * The explorelompoc feed hands us one generic photo for every listing, so the grid used to
 * render the same flower field 57 times (owner, Sep 20 2026: "very repetitive"). This picks,
 * in order:
 *   1. the event's own photo, when the feed actually gave us one (rocket launches do)
 *   2. the venue's real photo, for venues we carry in the directory and have vetted by hand
 *   3. a designed topic card from public/event-covers, chosen off the title
 *
 * Only hand-vetted venues get rule 2. A loose name match would put the Old Town Kitchen &
 * Bar dining room on "Old Town Trick or Treat", which is a district, not that restaurant.
 */

/** Feed covers that are really "no photo" — every event carries one, so they are not signal. */
const GENERIC = /\/news-covers\//

/** Venue text → business slug. Hand-vetted only; the event genuinely happens in their room. */
export const VENUE_BUSINESS: Record<string, string> = {
  "hangar 7": "hangar-7-social-house",
  "rock 12": "rock-12-distillery",
  "lompoc aquatic center": "lompoc-aquatic-center",
  "veterans memorial building": "lompoc-veterans-memorial",
}

const TOPIC_RULES: [string, RegExp][] = [
  // cars before marine: "Ocean" here is Ocean Avenue, so a car show at Ocean & 7th is not the sea
  ["cars", /car show|cruise night|motorcycle|hot rod|shift change/i],
  // aquarium next: "Sharktoberfest" is an aquarium open house, not a Halloween party
  ["marine", /aquarium|shark|marine|tide ?pool|whale|ocean beach|oceanfront/i],
  ["sports", /golf|tournament|5k|10k| run\b|race|soccer|basketball|baseball|swim meet|surf/i],
  ["art", /\bart\b|gallery|chalk|zine|mural|paint|pottery|craft fair|perspectives|exhibit/i],
  ["music", /music|concert|band|orchestra|pops|jazz|choir|dj\b|karaoke|cenzontles/i],
  ["history", /historical|history|museum|heritage|walking tour|landmark|mission/i],
  ["farm", /farm|lavender|garden|vineyard|winery|wine |tea\b|harvest festival|u-pick|flower/i],
  ["halloween", /ghost|pumpkin|halloween|trick or treat|haunted|spooky|harvest|\bfall\b|oktoberfest/i],
]

/** The topic card slug for an event, from its title and venue. */
export function eventTopic(title?: string | null, location?: string | null): string {
  const hay = `${title ?? ""} ${location ?? ""}`
  for (const [slug, re] of TOPIC_RULES) if (re.test(hay)) return slug
  return "community"
}

/** The venue's business slug, when the venue is one we carry and have vetted. */
export function venueBusinessSlug(location?: string | null): string | null {
  const l = (location ?? "").toLowerCase()
  for (const [needle, slug] of Object.entries(VENUE_BUSINESS)) if (l.includes(needle)) return slug
  return null
}

/**
 * Pick one of a venue's photos, spread by event id so a venue with a weekly night
 * (Hangar 7 has trivia and live music) doesn't show the same room on every card.
 */
export function pickVenuePhoto(photos: string[] | null | undefined, seed: number): string | null {
  if (!photos || photos.length === 0) return null
  return photos[Math.abs(seed) % photos.length]
}

/** Resolve the cover for an event. `venuePhotos` are the matched business's photos, if any. */
export function eventCoverUrl(
  event: { id?: number; imageUrl?: string | null; title?: string | null; location?: string | null },
  venuePhotos?: string[] | null,
  origin = ""
): string {
  if (event.imageUrl && !GENERIC.test(event.imageUrl)) return event.imageUrl
  const venue = pickVenuePhoto(venuePhotos, event.id ?? 0)
  if (venue) return venue
  return `${origin}/event-covers/${eventTopic(event.title, event.location)}.jpg`
}
