import { db } from "@/db/client"
import { blogPosts } from "@/db/schema"
import { and, desc, eq, gt, sql } from "drizzle-orm"

export const dynamic = "force-dynamic"

const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/**
 * Google News sitemap: local-news stories from the last 48 hours (the spec's
 * window), so freshly published stories get crawled as news, not as blog
 * posts discovered weeks later. Listed in robots.txt alongside sitemap.xml.
 */
export async function GET() {
  const posts = await db
    .select({ slug: blogPosts.slug, title: blogPosts.title, publishedAt: blogPosts.publishedAt, tags: blogPosts.tags })
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.status, "published"),
        eq(blogPosts.category, "local-news"),
        gt(blogPosts.publishedAt, sql`now() - interval '48 hours'`)
      )
    )
    .orderBy(desc(blogPosts.publishedAt))
    .limit(1000)

  const items = posts
    .map((p) => {
      const keywords = (p.tags ?? []).filter((t) => !t.startsWith("topic:")).join(", ")
      return `  <url>
    <loc>${siteUrl}/blog/${p.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Lompoc Locals</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${(p.publishedAt ?? new Date()).toISOString()}</news:publication_date>
      <news:title>${escapeXml(p.title)}</news:title>${keywords ? `\n      <news:keywords>${escapeXml(keywords)}</news:keywords>` : ""}
    </news:news>
  </url>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
  })
}
