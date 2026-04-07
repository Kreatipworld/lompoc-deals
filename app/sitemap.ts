import type { MetadataRoute } from "next"
import { db } from "@/db/client"

const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [bizs, cats] = await Promise.all([
    db.query.businesses.findMany({
      where: (b, { eq }) => eq(b.status, "approved"),
      columns: { slug: true, createdAt: true },
    }),
    db.query.categories.findMany({
      columns: { slug: true },
    }),
  ])

  const staticPages = ["", "/businesses", "/map", "/subscribe", "/search"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.7,
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

  return [...staticPages, ...bizPages, ...catPages]
}
