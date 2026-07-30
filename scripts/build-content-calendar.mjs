#!/usr/bin/env node
/**
 * Builds a month of social posts from live data and writes a scheduler-ready CSV.
 *
 * Everything here points at something real: events come from the events table, place posts
 * from activities, spotlights from approved businesses with photos. Nothing is invented, so
 * a post can't promise a page that doesn't exist.
 *
 * Deliberately absent: deal posts. Every "live" deal is owned by a scraper/demo account, so
 * advertising them would promise a discount no owner agreed to. See the checklist at the top
 * of docs/social-kit/content-weeks-2-3.md.
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/build-content-calendar.mjs [weeks] [startISO]
 */
import { neon } from "@neondatabase/serverless"
import fs from "node:fs"
import path from "node:path"

const WEEKS = Number(process.argv[2] || 4)
const START = process.argv[3] ? new Date(process.argv[3]) : new Date()
const OUT_DIR = "docs/social-kit"
const SITE = "https://www.lompoclocals.com"

const url = fs
  .readFileSync(".env.local", "utf8")
  .match(/^DATABASE_URL=(.*)$/m)[1]
  .replace(/^["']|["']$/g, "")
const sql = neon(url)

const HASHTAGS = {
  general: "#Lompoc #LompocCA #ShopLocalLompoc #CentralCoast #805",
  food: "#Lompoc #LompocCA #LompocEats #TacosLompoc #ShopLocalLompoc #805",
  outdoors: "#Lompoc #LompocCA #ThingsToDoLompoc #CentralCoast #805 #Outdoors",
  space: "#VandenbergSFB #RocketLaunch #Lompoc #LompocCA #CentralCoast #805",
  wine: "#LompocWine #WineGhetto #SantaRitaHills #Lompoc #LompocCA #805",
  business: "#ShopLocalLompoc #LompocBusiness #SmallBusinessLompoc #Lompoc #805",
}

const fmtDate = (d) => d.toISOString().slice(0, 10)
const fmtDay = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
const addDays = (d, n) => new Date(d.getTime() + n * 86400000)

/** Monday of the week containing `d`, so slots land on stable weekdays. */
function weekStart(d) {
  const c = new Date(d)
  const day = (c.getDay() + 6) % 7
  return addDays(c, -day)
}

// Weekly slots. Times are local and chosen for a working town: morning and early evening.
const SLOTS = [
  { dow: 1, time: "08:30", kind: "week-ahead", channels: "facebook,instagram" },
  { dow: 2, time: "17:30", kind: "place", channels: "facebook,instagram" },
  { dow: 4, time: "12:00", kind: "spotlight", channels: "facebook,instagram" },
  { dow: 5, time: "16:00", kind: "free-weekend", channels: "facebook,instagram,tiktok" },
]

function csvCell(v) {
  const s = String(v ?? "")
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

async function main() {
  const horizon = addDays(START, WEEKS * 7 + 7)

  const [events, activities, businesses] = await Promise.all([
    sql`select title, category, starts_at, location, source
        from events
        where status='approved' and starts_at between now() and ${horizon.toISOString()}
        order by starts_at asc`,
    sql`select title, slug, category, address, seasonality, tips,
               (address ilike '%Lompoc%' and slug not in
                 ('jalama-beach','point-sal','sta-rita-hills-wine-trail')) as in_town
        from activities order by random()`,
    sql`select b.name, b.slug, c.name as category, b.address, b.instagram_url,
               jsonb_array_length(coalesce(b.photos_json,'[]'::jsonb)) as photos
        from businesses b left join categories c on c.id=b.category_id
        where b.status='approved' and b.about is not null
          and jsonb_array_length(coalesce(b.photos_json,'[]'::jsonb)) >= 4
        order by random() limit 40`,
  ])

  const launches = events.filter((e) => /rocket launch/i.test(e.title))
  const rows = []
  let placeI = 0
  let bizI = 0

  for (let w = 0; w < WEEKS; w++) {
    const monday = addDays(weekStart(START), w * 7)

    for (const slot of SLOTS) {
      const when = addDays(monday, slot.dow - 1)
      if (when < START) continue

      // Events inside this posting week, for the Monday round-up.
      const weekEvents = events.filter((e) => {
        const t = new Date(e.starts_at)
        return t >= monday && t < addDays(monday, 7)
      })

      let text = ""
      let link = ""
      let media = ""
      let series = ""

      if (slot.kind === "week-ahead") {
        series = "This Week in Lompoc"
        const seen = new Set()
        const unique = weekEvents.filter((e) => {
          const k = e.title.toLowerCase().trim()
          if (seen.has(k)) return false
          seen.add(k)
          return true
        })
        const lines = unique.slice(0, 5).map((e) => {
          const t = new Date(e.starts_at)
          const icon = /rocket/i.test(e.title) ? "🚀" : /market/i.test(e.title) ? "🛍️"
            : /music/i.test(e.title) ? "🎶" : /art/i.test(e.title) ? "🎨" : "📌"
          return `${icon} ${fmtDay(t)} — ${e.title}`
        })
        if (!lines.length) continue
        text =
          `This week in Lompoc 📅\n\n${lines.join("\n")}\n\n` +
          `Plus ${Math.max(0, events.length - lines.length)} more on the calendar — all of it in one place, ` +
          `no account needed.\n\n👉 ${SITE}/en/events\n\n${HASHTAGS.general}`
        link = `${SITE}/en/events`
        media = "docs/social-kit/images/week2/week-events.png"
      }

      if (slot.kind === "place") {
        // Only in-town places: the hook is that you pass it daily.
        const inTown = activities.filter((x) => x.in_town)
        const a = inTown[placeI++ % inTown.length]
        series = "You've driven past it 500 times"
        const tip = (a.tips || "").split(". ")[0]
        text =
          `You've driven past it 500 times. Have you ever actually stopped? 👀\n\n` +
          `${a.title}${a.address ? ` — ${a.address.split(",")[0]}` : ""}\n\n` +
          `${tip ? tip.replace(/\.$/, "") + ".\n\n" : ""}` +
          `Full details, photos and directions 👉 ${SITE}/en/activities/${a.slug}\n\n` +
          `${HASHTAGS[a.category === "food-wine" ? "wine" : a.category === "unique" ? "space" : "outdoors"] || HASHTAGS.general}`
        link = `${SITE}/en/activities/${a.slug}`
      }

      if (slot.kind === "spotlight") {
        const b = businesses[bizI++ % businesses.length]
        series = "Local spotlight"
        text =
          `📍 ${b.name}${b.address ? ` — ${b.address.split(",")[0]}` : ""}\n\n` +
          `${b.category ? b.category + " in Lompoc. " : ""}` +
          `Photos, hours and directions are all on their page.\n\n` +
          `👉 ${SITE}/en/biz/${b.slug}\n` +
          `${b.instagram_url ? `Tag them: ${b.instagram_url}\n` : ""}` +
          `\nBeen? Tell everyone what to order 👇\n\n${HASHTAGS.business}`
        link = `${SITE}/en/biz/${b.slug}`
      }

      if (slot.kind === "free-weekend") {
        series = "Free in Lompoc"
        const nextLaunch = launches.find((l) => new Date(l.starts_at) >= when)
        const a = activities[placeI++ % activities.length]
        text = nextLaunch
          ? `🚀 There's a launch this weekend.\n\n${nextLaunch.title.replace(/^Rocket Launch:\s*/, "")} — ` +
            `${fmtDay(new Date(nextLaunch.starts_at))}, from Vandenberg.\n\n` +
            `Best free views: Harris Grade Rd, Ocean Ave heading west, or your own driveway. Look southwest.\n\n` +
            `Every launch on the calendar 👉 ${SITE}/en/events\n\n${HASHTAGS.space}`
          : `This weekend, for $0. 💜\n\n${a.title} — ${(a.seasonality || "open year-round").toLowerCase()}.\n\n` +
            `👉 ${SITE}/en/activities/${a.slug}\n\n${HASHTAGS.outdoors}`
        link = nextLaunch ? `${SITE}/en/events` : `${SITE}/en/activities/${a.slug}`
        media = nextLaunch ? "docs/social-kit/images/week2/launch.png" : ""
      }

      rows.push({
        date: fmtDate(when),
        time: slot.time,
        channels: slot.channels,
        series,
        text,
        link,
        media,
      })
    }
  }

  // Video assets get their own slots — one a week, rotating.
  const videos = [
    { file: "docs/social-kit/video/lompoc-locals-spot.mp4", note: "Brand spot, 27s — the wide-reach one" },
    { file: "docs/social-kit/video/lompoc-locals-experience-20s.mp4", note: "20s cut — best for TikTok" },
    { file: "docs/social-kit/video/lompoc-locals-experience.mp4", note: "Full tour, 25s" },
    { file: "docs/social-kit/video/lompoc-locals-signup.mp4", note: "Signup-focused, 19s" },
  ]
  for (let w = 0; w < WEEKS; w++) {
    const when = addDays(addDays(weekStart(START), w * 7), 6) // Sunday
    if (when < START) continue
    const v = videos[w % videos.length]
    rows.push({
      date: fmtDate(when),
      time: "11:00",
      channels: "facebook,instagram,tiktok",
      series: "Video",
      text:
        `All of Lompoc, in one place 💜\n\nEvery local business, every event, every launch over the base — ` +
        `and everywhere worth going.\n\n👉 ${SITE}\n\n${HASHTAGS.general}`,
      link: SITE,
      media: v.file,
    })
  }

  rows.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  const header = ["date", "time", "channels", "series", "text", "link", "media"]
  const csv = [header.join(","), ...rows.map((r) => header.map((h) => csvCell(r[h])).join(","))].join("\n")
  const stamp = fmtDate(START)
  const csvPath = path.join(OUT_DIR, `calendar-${stamp}.csv`)
  fs.writeFileSync(csvPath, csv + "\n")

  const md = [
    `# Social calendar — ${WEEKS} weeks from ${stamp}`,
    "",
    `Generated from live data: ${events.length} upcoming events, ${activities.length} places, ` +
      `${businesses.length} photo-complete businesses.`,
    "",
    `**Load \`${path.basename(csvPath)}\` into Buffer** (or any scheduler that takes CSV). Columns are ` +
      `date, time, channels, series, text, link, media. Media paths are repo-relative — upload those ` +
      `files when the scheduler asks.`,
    "",
    `**No deal posts.** Every live deal belongs to a scraper or demo account, so promoting one would ` +
      `advertise a discount no owner agreed to. Confirm with the owner first, then add those by hand.`,
    "",
    "| Date | Time | Series | Channels | Opening line |",
    "|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| ${r.date} | ${r.time} | ${r.series} | ${r.channels} | ${r.text.split("\n")[0].slice(0, 60)}… |`
    ),
  ].join("\n")
  fs.writeFileSync(path.join(OUT_DIR, `calendar-${stamp}.md`), md + "\n")

  const bySeries = rows.reduce((m, r) => ((m[r.series] = (m[r.series] || 0) + 1), m), {})
  console.log(`${rows.length} posts over ${WEEKS} weeks → ${csvPath}`)
  for (const [k, v] of Object.entries(bySeries)) console.log(`  ${String(v).padStart(2)} × ${k}`)
}

main().then(() => process.exit(0))
