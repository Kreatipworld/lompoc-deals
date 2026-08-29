import type { MetadataRoute } from "next"
import { db } from "@/db/client"
import { eq } from "drizzle-orm"
import { blogPosts } from "@/db/schema"
import { HOTELS } from "@/lib/hotels-data"
import { siteUrl, esUrl } from "@/lib/seo"

// Regenerate hourly: events cancel, businesses close, stories publish — a build-time
// sitemap would advertise dead URLs until the next deploy.
export const revalidate = 3600

/**
 * hreflang pair for a bilingual page: the English URL plus its /es twin. Every
 * public page renders in both locales (next-intl, localePrefix "as-needed"), so
 * Spanish gets crawled and clustered instead of being invisible to Google.
 * Blog/news stories are English-only and deliberately carry no alternates.
 */
function bilingual(path: string) {
  return { languages: { en: `${siteUrl}${path}`, es: esUrl(path) } }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [bizs, cats, posts, acts, upcomingEvents] = await Promise.all([
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
      .select({ slug: blogPosts.slug, publishedAt: blogPosts.publishedAt, updatedAt: blogPosts.updatedAt, category: blogPosts.category })
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
    // Upcoming/current only — expired events would accumulate as dead URLs.
    db.query.events
      .findMany({
        where: (e, { and, eq, gt }) => and(eq(e.status, "approved"), gt(e.startsAt, new Date(Date.now() - 24 * 60 * 60 * 1000))),
        columns: { id: true, createdAt: true, title: true, startsAt: true },
        orderBy: (e, { asc }) => [asc(e.startsAt)],
      })
      // Recurring series (a daily gallery show, weekly live music) collapse to their next
      // occurrence — 40 near-identical URLs for one show read as duplicate content.
      .then((rows) => {
        const seen = new Set<string>()
        return rows.filter((r) => (seen.has(r.title) ? false : (seen.add(r.title), true)))
      })
      .catch((err) => {
        console.error("sitemap events query failed:", err)
        return [] as { id: number; createdAt: Date; title: string; startsAt: Date }[]
      }),
  ])

  const staticPages = [
    "",
    "/businesses",
    "/deals",
    "/partners",
    "/map",
    "/subscribe",
    "/blog",
    "/news",
    "/feed",
    "/garage-sales",
    "/this-week",
    "/events",
    "/hotels",
    "/activities",
    "/locals",
    "/contact",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency:
      path === "/feed" || path === "/garage-sales" || path === "" || path === "/deals" || path === "/news" || path === "/events" ? ("daily" as const)
      : path === "/contact" || path === "/privacy" || path === "/terms" ? ("monthly" as const)
      : ("weekly" as const),
    priority:
      path === "" ? 1
      : path === "/news" || path === "/events" ? 0.9
      : path === "/feed" || path === "/garage-sales" || path === "/blog" || path === "/deals" ? 0.8
      : path === "/contact" ? 0.4
      : path === "/privacy" || path === "/terms" ? 0.3
      : 0.7,
    alternates: bilingual(path),
  }))

  const bizPages = bizs.map((b) => ({
    url: `${siteUrl}/biz/${b.slug}`,
    lastModified: b.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
    alternates: bilingual(`/biz/${b.slug}`),
  }))

  const catPages = cats.map((c) => ({
    url: `${siteUrl}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.5,
    alternates: bilingual(`/category/${c.slug}`),
  }))

  const blogPages = posts.map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: p.updatedAt ?? p.publishedAt ?? new Date(),
    changeFrequency: (("category" in p && p.category === "local-news") ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: "category" in p && p.category === "local-news" ? 0.8 : 0.7,
  }))

  const hotelPages = HOTELS.map((h) => ({
    url: `${siteUrl}/hotels/${h.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
    alternates: bilingual(`/hotels/${h.slug}`),
  }))

  const activityPages = acts.map((a) => ({
    url: `${siteUrl}/activities/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
    alternates: bilingual(`/activities/${a.slug}`),
  }))

  const eventPages = upcomingEvents.map((e) => ({
    url: `${siteUrl}/events/${e.id}`,
    lastModified: e.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
    alternates: bilingual(`/events/${e.id}`),
  }))

  return [...staticPages, ...bizPages, ...catPages, ...blogPages, ...hotelPages, ...activityPages, ...eventPages]
}
