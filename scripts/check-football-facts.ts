// check-football-facts.ts
// Guards the news desk's football fact sheets against the miscount that
// produced "Cabrillo opens season 0-2" (Sep 12 2026) when the team was 1-3:
// for both schools, the "Record: W-L" figure in the fact sheet must equal the
// W/L/T counts in football_games. Exit 1 on any mismatch.
//
// Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/check-football-facts.ts

import { sql } from "drizzle-orm"
import { db } from "@/db/client"
import { footballGames } from "@/db/schema"
import { currentSeason, getFootballSeason } from "@/lib/football"
import { footballFactSheet } from "@/lib/primary-sources"

async function main() {
const season = currentSeason()
const teams = await getFootballSeason(season)
let bad = 0
for (const team of teams) {
  const [row] = await db
    .select({
      w: sql<number>`count(*) filter (where ${footballGames.result} = 'W')`.mapWith(Number),
      l: sql<number>`count(*) filter (where ${footballGames.result} = 'L')`.mapWith(Number),
      t: sql<number>`count(*) filter (where ${footballGames.result} = 'T')`.mapWith(Number),
    })
    .from(footballGames)
    .where(sql`${footballGames.school} = ${team.school} and ${footballGames.season} = ${season}`)
  const sheet = footballFactSheet(team, new Date().toISOString().slice(0, 10))
  const m = sheet.match(/Record: (\d+)-(\d+)(?:-(\d+))? \(/)
  const got = m ? `${m[1]}-${m[2]}${m[3] ? `-${m[3]}` : ""}` : "(none)"
  const want = `${row.w}-${row.l}${row.t ? `-${row.t}` : ""}`
  const ok = got === want
  if (!ok) bad++
  console.log(`${ok ? "✓" : "✗"} ${team.name}: fact sheet says ${got}, football_games says ${want}`)
}
if (bad) {
  console.error(`${bad} school(s) mismatch — fix lib/primary-sources.ts before the next news-desk run`)
  process.exit(1)
}
console.log("football fact sheets match football_games")
}
main().catch((e) => { console.error(e); process.exit(1) })
