#!/usr/bin/env node
// Live football facts for the video kit. Prints JSON to stdout.
//   node _kit/data.mjs next-game       → the soonest unplayed game, both schools
//   node _kit/data.mjs latest-result   → the most recently played game
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

if (what === "next-game") {
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
