import type { MetadataRoute } from "next"
import { db } from "@/db/client"
import { eq } from "drizzle-orm"
import { blogPosts } from "@/db/schema"

const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [bizs, cats, posts] = await Promise.all([
    db.query.businesses.findMany({
      where: (b, { eq }) => eq(b.status, "approved"),
      columns: { slug: true, createdAt: true },
    }),
    db.query.categories.findMany({
      columns: { slug: true },
    }),
    db
      .select({ slug: blogPosts.slug, publishedAt: blogPosts.publishedAt, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published")),
  ])

  const staticPages = ["", "/businesses", "/for-businesses", "/map", "/subscribe", "/search", "/blog"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : path === "/blog" ? 0.8 : 0.7,
  }))

  const bizPages = bizs.map((b) => ({
    url: `${siteUrl}/biz/${b.slug}`,
    lastModified: b.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  const catPages = cats.map((c) => ({
    url: `${siteUrl}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.5,
  }))

  const blogPages = posts.map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: p.updatedAt ?? p.publishedAt ?? new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [...staticPages, ...bizPages, ...catPages, ...blogPages]
}
