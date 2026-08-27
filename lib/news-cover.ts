import { deriveTopic } from "./news-topics"

/**
 * Every news story has a cover. A story with its own photo uses it; a story
 * without one gets the branded card for its topic (public/news-covers/*.jpg,
 * 1200×675 — the mark, the topic, the Lompoc News kicker) so no surface — the
 * /news grid, the hero, the article, og:image, the digest — ever renders blank.
 *
 * The topic covers are static files rendered from a template; swap a file to
 * change the look everywhere at once.
 */
export function newsCoverUrl(
  post: { imageUrl?: string | null; tags?: string[] | null; title?: string | null },
  origin = ""
): string {
  if (post.imageUrl) return post.imageUrl
  const topic = deriveTopic(post.tags ?? null, post.title ?? "")
  return `${origin}/news-covers/${topic.slug}.jpg`
}

/** True when the cover is the topic card rather than the story's own photo. */
export const isTopicCover = (post: { imageUrl?: string | null }) => !post.imageUrl
