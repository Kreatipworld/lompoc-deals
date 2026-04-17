import { NextResponse } from "next/server"
import { getPublishedBlogPosts } from "@/lib/queries"

const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  const posts = await getPublishedBlogPosts(50)

  const items = posts
    .map((post) => {
      const link = `${siteUrl}/blog/${post.slug}`
      const pubDate = post.publishedAt?.toUTCString() ?? new Date().toUTCString()
      const description = post.excerpt ? escapeXml(post.excerpt) : ""
      const category = post.category ? `<category>${escapeXml(post.category)}</category>` : ""
      const image = post.imageUrl
        ? `<enclosure url="${escapeXml(post.imageUrl)}" type="image/jpeg" length="0" />`
        : ""

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      ${category}
      <description>${description}</description>
      ${image}
    </item>`
    })
    .join("\n")

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Lompoc Deals Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Local stories, business spotlights, and community tips for Lompoc, CA.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/blog/rss" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new NextResponse(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
