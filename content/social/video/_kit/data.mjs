#!/usr/bin/env node
// Live football facts for the video kit. Prints JSON to stdout.
//   node _kit/data.mjs next-game       → the soonest unplayed game, both schools
//   node _kit/data.mjs latest-result   → the most recently played game
//   node _kit/data.mjs member --slug=<slug>  → one business, shaped for member-spotlight
//   node _kit/data.mjs deal --id=<n>         → one deal plus its business, shaped for deal-promo
// Run from the repo root with --env-file=.env.local.
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)
const what = process.argv[2] || "next-game"

const NAME = { lompoc: "Lompoc", cabrillo: "Cabrillo" }
const VENUE_HOME = { lompoc: "Huyck Stadium", cabrillo: "Huyck Stadium" }

const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" })
const season = new Date().getFullYear()

// Record as of a date, counted from played games only.
async function recordFor(school, before) {
  const r = await sql`
    select count(*) filter (where result = 'W') as w,
           count(*) filter (where result = 'L') as l,
           count(*) filter (where result = 'T') as t
    from football_games
    where school = ${school} and season = ${season} and result is not null and game_date <= ${before}`
  const { w, l, t } = r[0]
  return Number(t) > 0 ? `${w}-${l}-${t}` : `${w}-${l}`
}

// Week number = how many games this school has on the calendar up to this one.
async function weekOf(school, date) {
  const r = await sql`select count(*) as n from football_games
    where school = ${school} and season = ${season} and game_date <= ${date}`
  return `Week ${r[0].n}`
}

// ── one member, shaped for the member-spotlight format ──────────────────────
// Everything a spotlight states has to be something the profile already says,
// so this reads the row and derives nothing it cannot point at.
const DAY = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
const DAY_LABEL = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" }

function clock(hhmm) {
  const [h, m] = hhmm.split(":").map(Number)
  const ampm = h >= 12 ? "pm" : "am"
  const hour = h % 12 === 0 ? 12 : h % 12
  return m ? `${hour}:${String(m).padStart(2, "0")}${ampm}` : `${hour}${ampm}`
}

// "Mon-Fri 8am-5pm · Sat 8am-3pm". Consecutive identical days collapse into a
// range so the line fits a phone screen.
function hoursLine(hours) {
  if (!hours) return ""
  const runs = []
  for (const d of DAY) {
    const v = hours[d]
    const key = v ? `${v.open}-${v.close}` : null
    const last = runs[runs.length - 1]
    if (last && last.key === key) last.days.push(d)
    else runs.push({ key, days: [d] })
  }
  return runs
    .filter((r) => r.key)
    .map((r) => {
      const [o, c] = r.key.split("-")
      const span = r.days.length === 1
        ? DAY_LABEL[r.days[0]]
        : `${DAY_LABEL[r.days[0]]}–${DAY_LABEL[r.days[r.days.length - 1]]}`
      return `${span} ${clock(o)}–${clock(c)}`
    })
    .join(" · ")
}

// Our descriptions are written "<what it is> — <services> for <who>", so the
// service list is the clause after the dash. If a profile is not written that
// way this returns [] and the format falls back to the description itself.
function servicesFrom(description) {
  const tail = (description || "").split(/[—–-]\s/)[1]
  if (!tail) return []
  return tail
    .split(/\s+for\s+/)[0]
    .split(/,|\sand\s/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter((s) => s && s.split(/\s+/).length <= 3)
}

function shapeMember(b) {
  const photos = Array.isArray(b.photos_json) ? b.photos_json : []
  return {
    name: b.name,
    slug: b.slug,
    address: b.address,
    street: (b.address || "").split(",")[0].trim(),
    phone: b.phone,
    website: b.website,
    about: b.about,
    description: b.description,
    logo: b.logo_url,
    // The cover first: it is the photo the owner already chose to lead with.
    photos: [b.cover_url, ...photos].filter((u, i, a) => u && a.indexOf(u) === i),
    hours: b.hours_json,
    hoursLine: hoursLine(b.hours_json),
    services: servicesFrom(b.description),
    site: `lompoclocals.com/biz/${b.slug}`,
  }
}

if (what === "member") {
  const slug = (process.argv.find((a) => a.startsWith("--slug=")) || "").split("=")[1]
  if (!slug) { console.error("member needs --slug=<slug>"); process.exit(1) }
  const rows = await sql`
    select name, slug, description, about, address, phone, website, logo_url, cover_url,
           photos_json, hours_json
    from businesses where slug = ${slug} and status = 'approved' limit 1`
  if (!rows.length) { console.log(JSON.stringify({ error: `no approved business ${slug}` })); process.exit(2) }
  console.log(JSON.stringify(shapeMember(rows[0]), null, 2))
} else if (what === "deal") {
  // One coupon or special, with the business that posted it. The video states
  // the deal row verbatim — title, what is included, terms — and derives only
  // the calendar: which weekday it ends and how many days are left, counted in
  // Pacific time so a deal expiring at 00:00 UTC ends on the evening before.
  const id = Number((process.argv.find((a) => a.startsWith("--id=")) || "").split("=")[1])
  if (!id) { console.error("deal needs --id=<n>"); process.exit(1) }
  const rows = await sql`
    select d.id, d.type, d.title, d.description, d.discount_text, d.terms, d.starts_at, d.expires_at,
           d.view_count, d.paused,
           b.name, b.slug, b.description as b_description, b.about, b.address, b.phone, b.website,
           b.logo_url, b.cover_url, b.photos_json, b.hours_json, b.status
    from deals d join businesses b on b.id = d.business_id
    where d.id = ${id} limit 1`
  if (!rows.length) { console.log(JSON.stringify({ error: `no deal ${id}` })); process.exit(2) }
  const r = rows[0]
  if (r.status !== "approved" || r.paused) {
    console.log(JSON.stringify({ error: `deal ${id} is ${r.paused ? "paused" : "on an unapproved business"}` })); process.exit(2)
  }
  const ptDate = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" })
  const weekday = (ymd) => new Date(ymd + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" })
  // An expiry stamped at midnight UTC is the end of the previous Pacific day.
  const endsOn = r.expires_at ? ptDate(new Date(new Date(r.expires_at).getTime() - 60_000)) : null
  const daysLeft = endsOn
    ? Math.round((new Date(endsOn + "T12:00:00") - new Date(today + "T12:00:00")) / 86_400_000) + 1
    : null
  const member = shapeMember({ ...r, description: r.b_description })
  console.log(JSON.stringify({
    ...member,
    deal: {
      id: r.id, type: r.type, title: r.title, description: r.description,
      discount: r.discount_text, terms: r.terms, views: r.view_count,
      startsOn: r.starts_at ? ptDate(r.starts_at) : null,
      endsOn, endsWeekday: endsOn ? weekday(endsOn) : null, daysLeft, today,
    },
  }, null, 2))
} else if (what === "next-game") {
  const rows = await sql`
    select school, game_date, kickoff, opponent, home_away, venue
    from football_games
    where season = ${season} and result is null and game_date >= ${today}
    order by game_date asc, school asc limit 1`
  if (!rows.length) { console.log(JSON.stringify({ error: "no upcoming game", today, season })); process.exit(2) }
  const g = rows[0]
  const gd = g.game_date instanceof Date ? g.game_date.toLocaleDateString("en-CA") : String(g.game_date)
  // "Tonight" only when the game is actually today; otherwise name the day.
  const when = gd === today ? "TONIGHT" :
    new Date(gd + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()
  console.log(JSON.stringify({
    school: NAME[g.school], opponent: g.opponent,
    kickoff: g.kickoff || "7:00 PM",
    venue: g.venue || VENUE_HOME[g.school],
    home: g.home_away === "home",
    record: await recordFor(g.school, gd),
    week: await weekOf(g.school, gd),
    when, gameDate: gd,
  }, null, 2))
} else if (what === "latest-result") {
  const rows = await sql`
    select school, game_date, opponent, home_away, venue, result, score_for, score_against
    from football_games
    where season = ${season} and result is not null
    order by game_date desc, school asc limit 1`
  if (!rows.length) { console.log(JSON.stringify({ error: "no played game", season })); process.exit(2) }
  const g = rows[0]
  const gd = g.game_date instanceof Date ? g.game_date.toLocaleDateString("en-CA") : String(g.game_date)
  console.log(JSON.stringify({
    school: NAME[g.school], opponent: g.opponent,
    us: g.score_for, them: g.score_against,
    venue: g.venue || VENUE_HOME[g.school],
    home: g.home_away === "home",
    record: await recordFor(g.school, gd),
    week: await weekOf(g.school, gd),
    gameDate: gd,
  }, null, 2))
} else if (what === "season") {
  // Every played game for both schools, plus each school's record and next game.
  const rows = await sql`
    select school, to_char(game_date, 'YYYY-MM-DD') as game_date, opponent, home_away, venue,
           kickoff, result, score_for, score_against
    from football_games where season = ${season} order by game_date asc`
  const out = {}
  for (const k of ["lompoc", "cabrillo"]) {
    const all = rows.filter((r) => r.school === k)
    const played = all.filter((r) => r.result)
    const next = all.find((r) => !r.result && r.game_date >= today)
    out[NAME[k]] = {
      record: await recordFor(k, today),
      pointsFor: played.reduce((a, g) => a + (g.score_for || 0), 0),
      pointsAgainst: played.reduce((a, g) => a + (g.score_against || 0), 0),
      games: played.map((g) => ({
        date: g.game_date, opponent: g.opponent,
        result: g.result, us: g.score_for, them: g.score_against,
        home: g.home_away === "home",
      })),
      next: next ? {
        date: next.game_date, opponent: next.opponent,
        kickoff: next.kickoff || "7:00 PM", venue: next.venue || VENUE_HOME[k],
        home: next.home_away === "home",
      } : null,
    }
  }
  console.log(JSON.stringify({ season, today, teams: out }, null, 2))
} else {
  console.error(`unknown query ${what}`); process.exit(1)
}
