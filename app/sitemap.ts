import type { MetadataRoute } from "next"
import { db } from "@/db/client"
import { eq } from "drizzle-orm"
import { blogPosts } from "@/db/schema"
import { HOTELS } from "@/lib/hotels-data"

const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [bizs, cats, posts, acts] = await Promise.all([
    db.query.businesses
      .findMany({
        where: (b, { eq }) => eq(b.status, "approved"),
        columns: { slug: true, createdAt: true },
      })
      .catch((err) => {
        console.error("sitemap businesses query failed:", err)
        return [] as { slug: string; createdAt: Date }[]
      }),
    db.query.categories
      .findMany({
        columns: { slug: true },
      })
      .catch((err) => {
        console.error("sitemap categories query failed:", err)
        return [] as { slug: string }[]
      }),
    db
      .select({ slug: blogPosts.slug, publishedAt: blogPosts.publishedAt, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .catch((err) => {
        console.error("sitemap blog posts query failed:", err)
        return [] as { slug: string; publishedAt: Date | null; updatedAt: Date | null }[]
      }),
    db.query.activities
      .findMany({ columns: { slug: true, updatedAt: true } })
      .catch((err) => {
        console.error("sitemap activities query failed:", err)
        return [] as { slug: string; updatedAt: Date }[]
      }),
  ])

  const staticPages = [
    "",
    "/businesses",
    "/for-businesses",
    "/map",
    "/subscribe",
    "/blog",
    "/feed",
    "/garage-sales",
    "/this-week",
    "/events",
    "/hotels",
    "/activities",
    "/locals",
    "/contact",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency:
      path === "/feed" || path === "/garage-sales" || path === "" ? ("daily" as const)
      : path === "/contact" ? ("monthly" as const)
      : ("weekly" as const),
    priority:
      path === "" ? 1
      : path === "/feed" || path === "/garage-sales" || path === "/blog" ? 0.8
      : path === "/contact" ? 0.4
      : 0.7,
  }))

  const bizPages = bizs.map((b) => ({
    url: `${siteUrl}/biz/${b.slug}`,
    lastModified: b.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
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

  const hotelPages = HOTELS.map((h) => ({
    url: `${siteUrl}/hotels/${h.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  const activityPages = acts.map((a) => ({
    url: `${siteUrl}/activities/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticPages, ...bizPages, ...catPages, ...blogPages, ...hotelPages, ...activityPages]
}
