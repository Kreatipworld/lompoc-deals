#!/usr/bin/env node
/**
 * Builds a month of social posts from live data and writes a scheduler-ready CSV.
 *
 * Everything here points at something real: events come from the events table, place posts
 * from activities, spotlights from approved businesses with photos. Nothing is invented, so
 * a post can't promise a page that doesn't exist.
 *
 * Selection is ordered by md5(slug), not random(): a rebuild has to reproduce the same calendar,
 * or the cards and the posts already scheduled in Buffer drift apart from the CSV that describes
 * them. The hash still gives an arbitrary, well-mixed order — it just gives the same one twice.
 *
 * Deliberately absent: deal posts. Every "live" deal is owned by a scraper/demo account, so
 * advertising them would promise a discount no owner agreed to. See the checklist at the top
 * of content/social/notes/content-weeks-2-3.md.
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/build-content-calendar.mjs [weeks] [startISO]
 */
import { neon } from "@neondatabase/serverless"
import fs from "node:fs"
import path from "node:path"
import {
  HASHTAGS as TAGS,
  OWN_ABOUT_SOURCES,
  assertNoPriceFraming,
  cta,
  detailSentence,
  hashtagsFor,
  launchOpener,
  opener,
  seriesOpener,
  nameSuffix,
} from "./lib/voice.mjs"

const WEEKS = Number(process.argv[2] || 4)
const START = process.argv[3] ? new Date(process.argv[3]) : new Date()
const OUT_DIR = "content/social"
const SITE = "https://www.lompoclocals.com"

const url = fs
  .readFileSync(".env.local", "utf8")
  .match(/^DATABASE_URL=(.*)$/m)[1]
  .replace(/^["']|["']$/g, "")
const sql = neon(url)

// Local calendar date, not UTC. toISOString() rolls over at 5pm PDT, so an afternoon run used to
// stamp every post a day late — and a post that names "Friday" landed on Saturday.
const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}"`.replace(
    '"',
    ""
  )
const fmtDay = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
const addDays = (d, n) => new Date(d.getTime() + n * 86400000)

/** Local midnight, so slot maths never carries the time of day the script happened to run. */
const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** Monday of the week containing `d`, so slots land on stable weekdays. */
function weekStart(d) {
  const c = dayStart(d)
  const day = (c.getDay() + 6) % 7
  return addDays(c, -day)
}

/** The slot's actual moment, for comparing against real event times. */
function slotMoment(day, time) {
  const [hh, mm] = time.split(":").map(Number)
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm, 0)
}

// The channels actually connected in Buffer. Facebook is deliberately absent — there's no
// Facebook channel on the account, so targeting it would queue posts that can't send.
const CHANNELS = "instagram,tiktok"

// Weekly slots. Times are local and chosen for a working town: morning and early evening.
const SLOTS = [
  { dow: 1, time: "08:30", kind: "week-ahead", channels: CHANNELS },
  { dow: 2, time: "17:30", kind: "place", channels: CHANNELS },
  { dow: 4, time: "12:00", kind: "spotlight", channels: CHANNELS },
  { dow: 5, time: "16:00", kind: "weekend", channels: CHANNELS },
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
    // Photos are required, not preferred: the place posts are carried by the image, and a
    // "you've driven past it 500 times" card with no picture of the thing makes no sense.
    sql`select title, slug, category, address, seasonality, tips,
               (address ilike '%Lompoc%' and slug not in
                 ('jalama-beach','point-sal','sta-rita-hills-wine-trail')) as in_town
        from activities
        where jsonb_array_length(coalesce(photos_json,'[]'::jsonb)) >= 1
        order by md5(slug)`,
    // about_source matters: Google-sourced about text is Google's prose, and reusing it in a
    // caption would republish third-party copy. Only text authored for this project qualifies.
    sql`select b.name, b.slug, c.name as category, b.address, b.about,
               (b.hours_json is not null) as has_hours,
               jsonb_array_length(coalesce(b.photos_json,'[]'::jsonb)) as photos
        from businesses b left join categories c on c.id=b.category_id
        where b.status='approved' and b.about is not null
          and jsonb_array_length(coalesce(b.photos_json,'[]'::jsonb)) >= 4
          and b.about_source = any(${OWN_ABOUT_SOURCES})
        order by md5(b.slug) limit 60`,
  ])

  const launches = events.filter((e) => /rocket launch/i.test(e.title))
  const rows = []
  const skipped = []
  let placeI = 0
  let bizI = 0

  for (let w = 0; w < WEEKS; w++) {
    const monday = addDays(weekStart(START), w * 7)

    for (const slot of SLOTS) {
      const when = addDays(monday, slot.dow - 1)
      // Compare the slot's real moment against now. Using the bare date meant a run at 7:33pm
      // gave every slot a 19:33 timestamp, and a 19:00 launch fell outside its own weekend by
      // 33 minutes — so the same calendar produced different content depending on run time.
      const whenAt = slotMoment(when, slot.time)
      if (whenAt <= START) continue

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
        series = "The week ahead"
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
          // The 🚀 already says it's a launch; the "Rocket Launch:" prefix just eats line width.
          return `${icon} ${fmtDay(t)} — ${e.title.replace(/^Rocket Launch:\s*/i, "")}`
        })
        if (!lines.length) continue
        const more = Math.max(0, events.length - lines.length)
        text =
          `${seriesOpener("weekAhead")}\n\n${lines.join("\n")}\n\n` +
          `${more ? `Plus ${more} more on the calendar.\n\n` : ""}` +
          `The full week:\nlompoclocals.com/events\n\n${TAGS.general}`
        link = `${SITE}/en/events`
        // Image comes from build-social-cards.mjs --write-csv, which renders this week's events.
      }

      if (slot.kind === "place") {
        // Only in-town places: the hook is that you pass it daily.
        const inTown = activities.filter((x) => x.in_town)
        const a = inTown[placeI++ % inTown.length]
        series = "Worth the stop"
        const tip = (a.tips || "").split(". ")[0]
        text =
          `${seriesOpener("place")}\n\n` +
          `${a.title}${nameSuffix(a.title, a.address)}\n` +
          `${tip ? tip.replace(/\.$/, "") + ".\n" : ""}\n` +
          `Photos, tips and directions:\nlompoclocals.com/activities/${a.slug}\n\n` +
          `${a.category === "food-wine" ? TAGS.wine : TAGS.outdoors}`
        link = `${SITE}/en/activities/${a.slug}`
      }

      if (slot.kind === "spotlight") {
        series = "On the record"
        // Walk the pool until a business yields a usable detail sentence. A business is skipped
        // when its about text carries a standing offer ("buy one, get one free") — quoting that
        // would advertise a discount no owner authorised for this campaign.
        let b = null
        let detail = ""
        for (let tries = 0; tries < businesses.length; tries++) {
          const cand = businesses[bizI++ % businesses.length]
          const d = detailSentence(cand.name, cand.about)
          if (!d) continue
          try {
            assertNoPriceFraming(d, cand.slug)
          } catch {
            skipped.push(`${cand.slug} — about text carries a price claim`)
            continue
          }
          b = cand
          detail = d
          break
        }
        if (!b) continue
        text =
          `${opener({ address: b.address, slug: b.slug })}\n\n` +
          `${b.name}${nameSuffix(b.name, b.address) || " — Lompoc"}\n` +
          `${detail}\n\n` +
          `${cta(b.category, { hasHours: b.has_hours })}:\n` +
          `lompoclocals.com/biz/${b.slug}\n\n` +
          `${hashtagsFor(b.category, b.address)}`
        link = `${SITE}/en/biz/${b.slug}`
      }

      if (slot.kind === "weekend") {
        // Nothing in this slot leads on price. A launch over the valley is worth watching on its
        // own terms, and framing it as something cheap undersells both the launch and the brand.
        // "This weekend" has to mean this weekend. The post goes out Friday afternoon, so only a
        // launch between then and Monday qualifies — otherwise we'd promise a launch weeks out.
        // Friday afternoon through Monday morning, measured from the start of the posting day.
        const weekendStart = dayStart(when)
        const weekendEnd = addDays(weekendStart, 3)
        const nextLaunch = launches.find((l) => {
          const t = new Date(l.starts_at)
          return t >= whenAt && t < weekendEnd
        })
        const a = activities[placeI++ % activities.length]
        series = nextLaunch ? "Upcoming launch" : "Weekend plans"
        text = nextLaunch
          ? `${launchOpener(new Date(nextLaunch.starts_at))}\n\n` +
            `${nextLaunch.title.replace(/^Rocket Launch:\s*/, "")}\n` +
            `${fmtDay(new Date(nextLaunch.starts_at))} · Vandenberg Space Force Base\n\n` +
            `Best vantage points: Harris Grade Rd, Ocean Ave heading west, or your own driveway. Face southwest.\n\n` +
            `Every launch on the calendar:\nlompoclocals.com/events\n\n${TAGS.space}`
          : `${seriesOpener("weekend")}\n\n` +
            `${a.title}${nameSuffix(a.title, a.address)}\n` +
            `${(a.seasonality || "Open year-round").replace(/^./, (c) => c.toUpperCase())}.\n\n` +
            `Photos, tips and directions:\nlompoclocals.com/activities/${a.slug}\n\n${TAGS.outdoors}`
        link = nextLaunch ? `${SITE}/en/events` : `${SITE}/en/activities/${a.slug}`
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
  // Each spot ships in both shapes: the 4:5 master for the Instagram feed, the untouched 9:16
  // for TikTok. Same cut, sized for where it lands.
  const videos = [
    { stem: "lompoc-locals-spot", note: "Brand spot, 27s — the wide-reach one" },
    { stem: "lompoc-locals-experience-20s", note: "20s cut" },
    { stem: "lompoc-locals-experience", note: "Full tour, 25s" },
    { stem: "lompoc-locals-signup", note: "Signup-focused, 19s" },
  ].map((v) => ({
    ...v,
    file: `content/social/video/masters/${v.stem}-4x5.mp4`,
    vertical: `content/social/video/${v.stem}.mp4`,
  }))
  for (let w = 0; w < WEEKS; w++) {
    const when = addDays(addDays(weekStart(START), w * 7), 6) // Sunday
    if (when < START) continue
    const v = videos[w % videos.length]
    rows.push({
      date: fmtDate(when),
      time: "11:00",
      channels: CHANNELS,
      series: "Video",
      text:
        `All of Lompoc, in one place.\n\nEvery local business, every event, every launch over the base — ` +
        `and everywhere worth going.\n\nlompoclocals.com\n\n${TAGS.general}`,
      link: SITE,
      media: v.file,
      media_vertical: v.vertical,
    })
  }

  // Nothing ships that frames the town or the platform on price, or that targets a channel the
  // Buffer account doesn't have. Fail the build rather than discover it in a published post.
  for (const r of rows) {
    // Check our own words, not quoted proper nouns: one real event is called "Free Admission:
    // End-of-Summer Family Day", and renaming somebody's event to satisfy our style rule would
    // trade one kind of inaccuracy for another.
    const ours = r.text
      .split("\n")
      .filter((l) => !/^[\p{Emoji}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(l.trim()))
      .join("\n")
    assertNoPriceFraming(ours, `${r.date} ${r.series}`)
    if (/facebook/i.test(r.channels)) throw new Error(`${r.date} targets facebook — no such channel`)
  }

  rows.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  const header = ["date", "time", "channels", "series", "text", "link", "media", "media_vertical"]
  const csv = [header.join(","), ...rows.map((r) => header.map((h) => csvCell(r[h])).join(","))].join("\n")
  const stamp = fmtDate(START)
  // One canonical name, not one file per run: content/social/ is the deliverable folder and a
  // pile of calendar-<date>.csv files makes it unclear which one is live. History is in git.
  const csvPath = path.join(OUT_DIR, "calendar.csv")
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
    `**Images come from the cards step**, not from this script. After regenerating this calendar, run:`,
    "",
    "```bash",
    `node scripts/build-social-cards.mjs ${csvPath} --write-csv`,
    `node scripts/render-social-cards.mjs content/social/cards/cards-calendar.html content/social/posts`,
    "```",
    "",
    `That renders one card per post — this week's events, this weekend's launch, this business's own ` +
      `photo — and fills in the media column. Every post gets its own image; nothing is shared between weeks.`,
    "",
    "| Date | Time | Series | Channels | Opening line |",
    "|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| ${r.date} | ${r.time} | ${r.series} | ${r.channels} | ${r.text.split("\n")[0].slice(0, 60)}… |`
    ),
  ].join("\n")
  fs.writeFileSync(path.join(OUT_DIR, "calendar.md"), md + "\n")

  const bySeries = rows.reduce((m, r) => ((m[r.series] = (m[r.series] || 0) + 1), m), {})
  console.log(`${rows.length} posts over ${WEEKS} weeks → ${csvPath}`)
  for (const [k, v] of Object.entries(bySeries)) console.log(`  ${String(v).padStart(2)} × ${k}`)
  if (skipped.length) {
    console.log(`\nskipped ${skipped.length} business(es):`)
    for (const m of [...new Set(skipped)]) console.log(`  ! ${m}`)
  }
}

main().then(() => process.exit(0))
