/**
 * Blog post improvement script — KRE-265
 * 1. Updates best-taquerias-lompoc with real business links + richer content
 * 2. Adds featured images to all published posts
 * 3. Fixes heading structure (bold-in-paragraph → <h3> tags)
 */
import "dotenv/config"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// ── Utilities ────────────────────────────────────────────────────────────────

/** Convert "**Heading**\nBody text" patterns to proper <h3>Body text */
function fixHeadings(html: string): string {
  // Pattern: <p><strong>Heading text</strong>\nFollowing text...</p>
  // or <p><strong>Heading text</strong>\r\nFollowing text...</p>
  // → <h3>Heading text</h3><p>Following text...</p>
  return html
    .replace(
      /<p><strong>([^<]+)<\/strong>\s*\n([^]*?)<\/p>/g,
      (_match, heading, body) => {
        const trimmedBody = body.trim()
        if (!trimmedBody) return `<h3>${heading}</h3>`
        return `<h3>${heading}</h3><p>${trimmedBody}</p>`
      }
    )
    // Also handle <strong> at start of paragraph followed by just newline (no body)
    .replace(/<p><strong>([^<]+)<\/strong><\/p>/g, "<h3>$1</h3>")
}

// ── Image map — picsum.photos/seed/{seed}/1200/630 gives stable, beautiful images ──

const IMAGE_MAP: Record<string, string> = {
  "top-10-things-to-do-in-lompoc":
    "https://picsum.photos/seed/lompoc-outdoors/1200/630",
  "perfect-day-in-lompoc":
    "https://picsum.photos/seed/california-morning/1200/630",
  "family-friendly-activities-lompoc":
    "https://picsum.photos/seed/family-adventure/1200/630",
  "hidden-gems-lompoc":
    "https://picsum.photos/seed/hidden-trail-california/1200/630",
  "art-in-lompoc-murals-galleries":
    "https://picsum.photos/seed/street-art-colorful/1200/630",
  "free-things-to-do-lompoc":
    "https://picsum.photos/seed/flower-fields-spring/1200/630",
  "lompoc-locals-best-kept-secrets":
    "https://picsum.photos/seed/small-town-secrets/1200/630",
  "lompoc-after-dark":
    "https://picsum.photos/seed/evening-wine-bar/1200/630",
  "best-restaurants-lompoc":
    "https://picsum.photos/seed/restaurant-dining-table/1200/630",
  "best-breakfast-lompoc":
    "https://picsum.photos/seed/breakfast-morning-cafe/1200/630",
  "best-taquerias-lompoc":
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80",
  "coffee-shops-lompoc":
    "https://picsum.photos/seed/coffee-shop-latte/1200/630",
  "farm-to-table-dining-lompoc":
    "https://picsum.photos/seed/farm-fresh-harvest/1200/630",
  "happy-hour-deals-lompoc":
    "https://picsum.photos/seed/happy-hour-cocktails/1200/630",
  "best-pizza-lompoc":
    "https://picsum.photos/seed/wood-fire-pizza/1200/630",
  "lompoc-wine-ghetto-guide":
    "https://picsum.photos/seed/wine-tasting-room/1200/630",
  "best-wineries-near-lompoc":
    "https://picsum.photos/seed/vineyard-rolling-hills/1200/630",
  "pinot-noir-santa-rita-hills":
    "https://picsum.photos/seed/pinot-noir-glass/1200/630",
  "wine-tasting-tips-lompoc":
    "https://picsum.photos/seed/wine-flight-tips/1200/630",
  "lompoc-wine-events-calendar":
    "https://picsum.photos/seed/wine-event-outdoor/1200/630",
}

// ── Improved taquerias post content ──────────────────────────────────────────

const TAQUERIAS_CONTENT = `
<p>Lompoc's Mexican food culture is the town's culinary backbone. Rooted in decades of agricultural heritage that brought families from Jalisco and Michoacán to the Santa Ynez Valley, the taqueria scene here has developed a distinct regional character — unpolished, deeply authentic, and largely untouched by the price inflation that has diluted Mexican food in Santa Barbara proper.</p>

<p>Whether you're a lifelong local or visiting for the Wine Ghetto, these are the spots worth knowing.</p>

<h3>Taqueria La Mision</h3>
<p>A loyal local institution on Burton Mesa Blvd with a following built on carne asada and al pastor made the right way. Hand-pressed tortillas, fresh salsas, and a menu that rewards repeat visits. <a href="/biz/taqueria-la-mision">See their listing on Lompoc Deals →</a></p>

<h3>Tacos Santa Fe</h3>
<p>Beloved for its carne asada, carnitas, and weekend birria with homemade salsas and horchata made from scratch. This is the spot locals bring visitors when they want to show off what Lompoc actually eats. <a href="/biz/tacos-santa-fe">See their listing on Lompoc Deals →</a></p>

<h3>Floriano's Mexican Food</h3>
<p>A family-owned taqueria and butcher shop serving authentic Mexican — tacos, burritos, menudo, and tri-tip — from a team that's been part of this community for years. The combination of carnicería and taqueria under one roof is exactly what the neighborhood wants. <a href="/biz/florianos-mexican-food">See their listing on Lompoc Deals →</a></p>

<h3>Mr. Taco</h3>
<p>A popular family taqueria on Constellation Road known for street tacos, burritos, quesadillas, and fresh aguas frescas. The kind of place that's always busy for a reason — the food is consistent, the prices are fair, and the tortillas are made in-house. <a href="/biz/mr-taco-lompoc">See their listing on Lompoc Deals →</a></p>

<h3>Taqueria Don Tacho</h3>
<p>A local favorite for straightforward, honest Mexican food. No frills, no shortcuts — just well-made tacos and burritos at the kind of prices that make sense in a working-class town. <a href="/biz/taqueria-don-tacho">See their listing on Lompoc Deals →</a></p>

<h3>Tacos y Mariscos El Culichi</h3>
<p>Specializes in the Sinaloan-style seafood tacos and mariscos that have become one of Lompoc's most underrated food traditions. The ceviche tostadas and shrimp tacos here are the real deal. <a href="/biz/tacos-y-mariscos-el-culichi">See their listing on Lompoc Deals →</a></p>

<h3>Tacos y Mariscos La Michoacana</h3>
<p>Another strong entry in Lompoc's mariscos scene, serving seafood and taco combinations with the flavor of the Pacific coast. Great for the fish taco enthusiast and anyone who wants variety beyond the standard beef-and-chicken menu. <a href="/biz/tacos-y-mariscos-la-michoacana">See their listing on Lompoc Deals →</a></p>

<h3>Burritos Lalo</h3>
<p>Focused on doing burritos right — generously filled, tightly wrapped, and made with proteins that have been cooked with actual attention. A dependable option when you want something filling without a wait. <a href="/biz/burritos-lalo">See their listing on Lompoc Deals →</a></p>

<h3>Tacos El Tizon</h3>
<p>Known for tizón-style grilled meats — the name refers to the ember heat used in traditional preparation. The smoky, charred character of the proteins here sets it apart from the average street taco lineup. <a href="/biz/tacos-el-tizon-1">See their listing on Lompoc Deals →</a></p>

<h3>What to Order</h3>
<p>The signature items in Lompoc's Mexican food landscape: <strong>carne asada</strong> (grilled beef, fresh-cut and seasoned, not pre-packaged), <strong>al pastor</strong> (spit-roasted pork with pineapple — best from the spots that use an actual trompo), <strong>birria</strong> (slow-braised beef, served as tacos with consomé on weekends — places that offer it daily are cutting corners), and <strong>tamales</strong> (seasonal and special, often sold from homes and church lots during the holidays).</p>

<h3>The Weekend Birria Rule</h3>
<p>The best birria spots only make it Saturday and Sunday because proper birria requires an overnight braise. If you see it on a weekday menu, it's from a refrigerated batch. Come on the weekend and arrive before noon — it sells out.</p>

<h3>The Lonchera Circuit</h3>
<p>Food trucks and loncheras operate throughout Lompoc, particularly near construction sites and industrial areas on weekday mornings. The roster changes — follow local Instagram accounts to track the best ones. Some of the most honest food on this list doesn't have a brick-and-mortar address.</p>

<h3>A Note on Finding the Best Spots</h3>
<p>The best taquerias in Lompoc operate with minimal marketing. The signals that matter: a handwritten specials board, tortillas pressed on-site (you'll hear the press), lines of large families on Saturday morning, and a menu that changes based on what was delivered that day. Check <a href="/category/food-drink">Lompoc Deals food listings</a> for current deals and announcements from local businesses.</p>
`.trim()

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Fetching published blog posts…")
  const posts = await sql`
    SELECT id, slug, content, image_url
    FROM blog_posts
    WHERE status = 'published'
    ORDER BY id
  `
  console.log(`Found ${posts.length} published posts`)

  let updated = 0

  for (const post of posts) {
    const slug = post.slug as string
    const newImage = IMAGE_MAP[slug] ?? null
    const isTaquerias = slug === "best-taquerias-lompoc"

    let newContent: string
    if (isTaquerias) {
      newContent = TAQUERIAS_CONTENT
    } else {
      // Fix heading structure on all other posts
      newContent = fixHeadings(post.content as string)
    }

    const imageChanged = newImage && newImage !== post.image_url
    const contentChanged = newContent !== post.content

    if (!imageChanged && !contentChanged) {
      console.log(`  ↷  ${slug} — no changes needed`)
      continue
    }

    await sql`
      UPDATE blog_posts
      SET
        content   = ${newContent},
        image_url = ${newImage ?? (post.image_url as string | null)},
        updated_at = NOW()
      WHERE id = ${post.id as number}
    `

    const changes = [imageChanged && "image", contentChanged && "content"]
      .filter(Boolean)
      .join(", ")
    console.log(`  ✓  ${slug} — updated ${changes}`)
    updated++
  }

  console.log(`\nDone. ${updated} posts updated.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
