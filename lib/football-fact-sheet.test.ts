import assert from "node:assert/strict"
import { footballFactSheet, recordWords, FACT_SHEET } from "./primary-sources"
import type { FootballGame, TeamSeason } from "./football"

// The Sep 12 2026 miss: the desk wrote "opens season 0-2" for a team that was 1-3.
// The fact sheet must spell the record out from the games, in numbers and words.
const g = (o: Partial<FootballGame> & Pick<FootballGame, "gameDate" | "opponent" | "homeAway">): FootballGame => ({
  id: 0,
  school: "cabrillo",
  season: 2026,
  kickoff: "7:00 PM",
  venue: o.homeAway === "home" ? "Huyck Stadium, 515 W College Ave" : null,
  leagueGame: false,
  result: null,
  scoreFor: null,
  scoreAgainst: null,
  maxprepsUrl: `https://www.maxpreps.com/x/${o.gameDate}`,
  ...o,
})

const games: FootballGame[] = [
  g({ gameDate: "2026-08-21", opponent: "Burbank", homeAway: "away", result: "L", scoreFor: 0, scoreAgainst: 38 }),
  g({ gameDate: "2026-08-28", opponent: "Hoover", homeAway: "home", result: "W", scoreFor: 36, scoreAgainst: 21 }),
  g({ gameDate: "2026-09-04", opponent: "Lompoc", homeAway: "home", result: "L", scoreFor: 2, scoreAgainst: 38 }),
  g({ gameDate: "2026-09-11", opponent: "Nipomo", homeAway: "away", result: "L", scoreFor: 14, scoreAgainst: 49 }),
  g({ gameDate: "2026-09-17", opponent: "Righetti", homeAway: "home" }),
  g({ gameDate: "2026-10-02", opponent: "Morro Bay", homeAway: "home", leagueGame: true }),
]
const played = games.filter((x) => x.result)
const team: TeamSeason = {
  school: "cabrillo",
  name: "Cabrillo Conquistadores",
  short: "Conqs",
  wins: played.filter((x) => x.result === "W").length,
  losses: played.filter((x) => x.result === "L").length,
  ties: 0,
  next: games[4],
  last: games[3],
  games,
}

const sheet = footballFactSheet(team, "2026-09-12")

assert.ok(sheet.startsWith(FACT_SHEET), "starts with the FACT SHEET marker so the desk writes from it")
assert.ok(sheet.includes("Record: 1-3 (1 win, 3 losses) after 4 games."), `record spelled out; got: ${sheet}`)
assert.ok(!/Record: 0-2/.test(sheet), "the miscount must be gone")
assert.ok(sheet.includes("Aug 28 vs Hoover, won 36-21 (home, Huyck Stadium, 515 W College Ave)."), "the win is listed with score and venue")
assert.ok(sheet.includes("Sep 11 at Nipomo, lost 14-49 (away)."), "the latest loss is listed")
assert.ok(sheet.includes("Next game: Thu, Sep 17 vs Righetti, 7:00 PM, Huyck Stadium, 515 W College Ave (home)."), `next game with kickoff and venue; got: ${sheet}`)
assert.ok(sheet.includes("League play begins Oct 2 vs Morro Bay."), "league opener noted")

// record words are plural-safe
assert.equal(recordWords(1, 1, 0), "1 win, 1 loss")
assert.equal(recordWords(2, 0, 1), "2 wins, 0 losses, 1 tie")

// the record in the sheet always equals the count of played games
const m = sheet.match(/Record: (\d+)-(\d+)(?:-(\d+))? \(/)!
assert.equal(Number(m[1]) + Number(m[2]) + Number(m[3] ?? 0), played.length, "W+L+T equals games played")

console.log("football-fact-sheet.test.ts: ok")
