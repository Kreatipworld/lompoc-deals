/**
 * Blog posts that were folded into another page. The rows stay in the DB (never
 * delete content), but the URL 308s to the page that now owns the topic, and the
 * post is left out of blog listings and the sitemap so we stop advertising it.
 *
 * Oct 16 2026: /blog/jalama-beach-complete-guide (#37) and /activities/jalama-beach (#40)
 * split Google's Jalama Beach signal. The activity page is the canonical one; its
 * "Plan your visit" facts (lib/activity-guides.ts) carry what the post added.
 *
 * Keep in sync with the matching entries in next.config.mjs `redirects()` (the
 * routing layer does the actual 308; the blog route redirects too as a fallback).
 */
export const BLOG_REDIRECTS: Record<string, string> = {
  "jalama-beach-complete-guide": "/activities/jalama-beach",
}

export const REDIRECTED_BLOG_SLUGS = Object.keys(BLOG_REDIRECTS)
