// Lompoc Football sync: varsity schedules + results for both high schools,
// read from MaxPreps' public schedule pages (facts only — dates, opponents,
// kickoff, scores). Upserts into football_games by the MaxPreps game URL.
//
// MaxPreps renders two tables per schedule page: played games
// ("Date/Time | Opponent | Result | …") and upcoming games
// ("Date/Time | Opponent | Tickets | …"). Each row carries a link to
// /ca/football/game/<slug>/<m>-<d>-<yyyy>/, which is the stable key.

import { sql } from "drizzle-orm"
import { db } from "@/db/client"
import { footballGames } from "@/db/schema"

export type School = "lompoc" | "cabrillo"

export const SCHOOLS: { school: School; name: string; short: string; url: string }[] = [
  { school: "lompoc", name: "Lompoc Braves", short: "Braves", url: "https://www.maxpreps.com/ca/lompoc/lompoc-braves/football/schedule/" },
  { school: "cabrillo", name: "Cabrillo Conquistadores", short: "Conqs", url: "https://www.maxpreps.com/ca/lompoc/cabrillo-conquistadores/football/schedule/" },
]

/** Both Lompoc programs play their home games here (Cabrillo has no stadium of its own). */
export const HUYCK = "Huyck Stadium, 515 W College Ave"

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 LompocLocals/1.0"

export type ParsedGame = {
  school: School
  season: number
  gameDate: string // YYYY-MM-DD
  kickoff: string | null
  opponent: string
  homeAway: "home" | "away" | "neutral"
  venue: string | null
  leagueGame: boolean
  result: "W" | "L" | "T" | null
  scoreFor: number | null
  scoreAgainst: number | null
  maxprepsUrl: string
}

function strip(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function isLompocSchool(opponent: string): boolean {
  return /^(lompoc|cabrillo)\b/i.test(opponent)
}

/** Parse every game row on a MaxPreps schedule page. Rows it can't read are reported, not guessed. */
export function parseSchedule(html: string, school: School): { games: ParsedGame[]; skipped: string[] } {
  const games: ParsedGame[] = []
  const skipped: string[] = []
  for (const table of html.match(/<table[\s\S]*?<\/table>/g) ?? []) {
    for (const row of table.match(/<tr[\s\S]*?<\/tr>/g) ?? []) {
      const link = row.match(/href="([^"]*\/ca\/football\/game\/[a-z0-9-]+\/(\d{1,2})-(\d{1,2})-(\d{4})\/[^"]*)"/)
      if (!link) continue
      const cells = Array.from(row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)).map((m) => strip(m[1]))
      if (cells.length < 2) { skipped.push(row.slice(0, 120)); continue }
      const [dateCell, oppCell, thirdCell = ""] = cells
      const time = dateCell.match(/(\d{1,2}:\d{2})\s*([ap]m)/i)
      const kickoff = time ? `${time[1]} ${time[2].toUpperCase()}` : null
      const oppMatch = oppCell.match(/^(@|vs\.?)\s*(.+?)\s*(\*)?$/i)
      if (!oppMatch) { skipped.push(oppCell); continue }
      const away = oppMatch[1] === "@"
      const opponent = oppMatch[2].replace(/\*$/, "").trim()
      const leagueGame = /\*/.test(oppCell)
      // MaxPreps prints the higher score first regardless of side ("L 38-2" = lost 2–38).
      const res = thirdCell.match(/^([WLT])\s+(\d+)\s*-\s*(\d+)/)
      const hi = res ? Math.max(Number(res[2]), Number(res[3])) : null
      const lo = res ? Math.min(Number(res[2]), Number(res[3])) : null
      const month = Number(link[2]), day = Number(link[3]), year = Number(link[4])
      const gameDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      // Both schools' home games are at Huyck; the crosstown game is at Huyck whichever side MaxPreps lists as home.
      const venue = !away || isLompocSchool(opponent) ? HUYCK : `${opponent} (away)`
      const href = link[1].startsWith("http") ? link[1] : `https://www.maxpreps.com${link[1]}`
      games.push({
        school,
        season: month >= 7 ? year : year - 1,
        gameDate,
        kickoff,
        opponent,
        homeAway: away ? "away" : "home",
        venue,
        leagueGame,
        result: res ? (res[1] as "W" | "L" | "T") : null,
        scoreFor: res ? (res[1] === "L" ? lo : hi) : null,
        scoreAgainst: res ? (res[1] === "L" ? hi : lo) : null,
        maxprepsUrl: href.split("?")[0],
      })
    }
  }
  return { games, skipped }
}

export type SyncReport = { school: School; fetched: number; upserted: number; skipped: number; error?: string }

/** Fetch + parse + upsert both schools. Never throws; reports per school. */
export async function syncFootball(): Promise<SyncReport[]> {
  const reports: SyncReport[] = []
  for (const s of SCHOOLS) {
    try {
      const res = await fetch(s.url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20_000), cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { games, skipped } = parseSchedule(await res.text(), s.school)
      let upserted = 0
      for (const g of games) {
        await db
          .insert(footballGames)
          .values({
            school: g.school,
            season: g.season,
            gameDate: g.gameDate,
            kickoff: g.kickoff,
            opponent: g.opponent,
            homeAway: g.homeAway,
            venue: g.venue,
            leagueGame: g.leagueGame,
            result: g.result,
            scoreFor: g.scoreFor,
            scoreAgainst: g.scoreAgainst,
            maxprepsUrl: g.maxprepsUrl,
          })
          .onConflictDoUpdate({
            target: [footballGames.school, footballGames.maxprepsUrl],
            set: {
              gameDate: g.gameDate,
              kickoff: g.kickoff,
              opponent: g.opponent,
              homeAway: g.homeAway,
              venue: g.venue,
              leagueGame: g.leagueGame,
              result: g.result,
              scoreFor: g.scoreFor,
              scoreAgainst: g.scoreAgainst,
              updatedAt: sql`now()`,
            },
          })
        upserted++
      }
      reports.push({ school: s.school, fetched: games.length, upserted, skipped: skipped.length })
    } catch (err) {
      reports.push({ school: s.school, fetched: 0, upserted: 0, skipped: 0, error: err instanceof Error ? err.message : String(err) })
    }
  }
  return reports
}
