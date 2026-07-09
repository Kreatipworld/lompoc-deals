/**
 * db/fix-blog-domain-mentions.ts
 * One-shot: replaces old-domain mentions in published blog_posts content.
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx db/fix-blog-domain-mentions.ts --dry-run
 *   node --env-file=.env.local node_modules/.bin/tsx db/fix-blog-domain-mentions.ts
 */
import { eq, like } from "drizzle-orm"
import { db } from "./client"
import { blogPosts } from "./schema"

const DRY_RUN = process.argv.includes("--dry-run")

const REPLACEMENTS: [string, string][] = [
  ["Lompoc Deals (lompoc-deals.vercel.app)", "Lompoc Locals (www.lompoclocals.com)"],
  ["lompoc-deals.vercel.app", "www.lompoclocals.com"],
  ["the Lompoc Deals hotels directory", "the Lompoc Locals hotels directory"],
  ["Lompoc Deals Hotels Page", "Lompoc Locals Hotels Page"],
  ["Lompoc Deals -- The Platform Built for Lompoc", "Lompoc Locals -- The Platform Built for Lompoc"],
  ["claim Lompoc Deals next", "claim Lompoc Locals next"],
]

async function main() {
  const rows = await db
    .select({ id: blogPosts.id, slug: blogPosts.slug, content: blogPosts.content })
    .from(blogPosts)
    .where(like(blogPosts.content, "%lompoc-deals.vercel.app%"))

  console.log(`Found ${rows.length} posts mentioning the old domain`)
  for (const row of rows) {
    let next = row.content
    for (const [from, to] of REPLACEMENTS) next = next.split(from).join(to)
    console.log(`- ${row.slug}: ${row.content.length} -> ${next.length} chars`)
    if (!DRY_RUN) {
      await db.update(blogPosts).set({ content: next }).where(eq(blogPosts.id, row.id))
    }
  }
  console.log(DRY_RUN ? "DRY RUN — no writes" : "Done")
}

main().then(() => process.exit(0))
