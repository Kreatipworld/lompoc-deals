/**
 * Seed all 50 blog posts from content/blog/posts-*.json into the database.
 * Run: node --env-file=.env.local db/seed-blog-posts.mjs
 */
import { createRequire } from "module"
import { fileURLToPath } from "url"
import path from "path"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const posts1 = require("../content/blog/posts-1-25.json")
const posts2 = require("../content/blog/posts-26-50.json")
const allPosts = [...posts1, ...posts2]

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set")
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql)

// Convert simple markdown to HTML (covers the patterns in our content)
function markdownToHtml(md) {
  return md
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ""
      // Convert **text** to <strong>text</strong>
      const withBold = trimmed.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      return `<p>${withBold}</p>`
    })
    .filter(Boolean)
    .join("\n")
}

// Spread publish dates over past 6 months so they feel organic
function publishedAt(index, total) {
  const now = new Date()
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const step = (now - sixMonthsAgo) / total
  return new Date(sixMonthsAgo.getTime() + step * index)
}

async function main() {
  console.log(`Seeding ${allPosts.length} blog posts...`)

  let inserted = 0
  let skipped = 0

  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i]
    const row = {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt ?? null,
      content: markdownToHtml(post.body),
      image_url: null,
      category: post.category ?? null,
      tags: post.targetKeywords ?? null,
      status: "published",
      published_at: publishedAt(i, allPosts.length),
      author_name: "Lompoc Deals Team",
      meta_description: post.metaDescription ?? null,
    }

    try {
      await sql`
        INSERT INTO blog_posts (slug, title, excerpt, content, image_url, category, tags, status, published_at, author_name, meta_description)
        VALUES (
          ${row.slug},
          ${row.title},
          ${row.excerpt},
          ${row.content},
          ${row.image_url},
          ${row.category},
          ${JSON.stringify(row.tags)},
          ${row.status},
          ${row.published_at},
          ${row.author_name},
          ${row.meta_description}
        )
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          content = EXCLUDED.content,
          category = EXCLUDED.category,
          tags = EXCLUDED.tags,
          status = EXCLUDED.status,
          published_at = EXCLUDED.published_at,
          author_name = EXCLUDED.author_name,
          meta_description = EXCLUDED.meta_description,
          updated_at = NOW()
      `
      inserted++
      process.stdout.write(`  ✓ ${post.slug}\n`)
    } catch (err) {
      console.error(`  ✗ ${post.slug}: ${err.message}`)
      skipped++
    }
  }

  console.log(`\nDone: ${inserted} inserted/updated, ${skipped} errors`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
