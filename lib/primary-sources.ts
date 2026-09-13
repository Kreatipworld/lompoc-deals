/**
 * Primary sources for the news desk: official announcements and public records
 * we read directly, so a story is ours from the first fact and the credit line
 * names the institution, not another newsroom. Every parser returns [] on any
 * failure (with the reason) so one changed layout never stops the harvest.
 *
 * Checked Sep 9 2026 — readable from a server: Space Launch Delta 30 on DVIDS,
 * Lompoc Unified's news feed, MaxPreps schedules. Blocked or unreachable (skip,
 * no workarounds): cityoflompoc.com (403), the city's CivicClerk API (404),
 * County of Santa Barbara press releases (JS-only headless CMS), Chamber
 * (lompoc.com is a JS app), Lompoc Public Library (city site).
 */
import { parseRssItems } from "@/lib/rss"
import { getFootballSeason, type TeamSeason } from "@/lib/football"

export type PrimaryLead = {
  title: string
  url: string
  publishedAt: Date | null
  summary: string | null
  source: string
  kind: "primary"
}
export type PrimaryReport = { source: string; found: number; leads: PrimaryLead[]; error?: string }

/** A summary starting with this is a complete fact sheet: the desk writes from it instead of fetching the page. */
export const FACT_SHEET = "FACT SHEET"

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 LompocLocalsNewsDesk/1.0"

async function getText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(15_000), cache: "no-store" })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

function strip(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#8217;|&rsquo;|&#39;/g, "'").replace(/&#8220;|&#8221;|&ldquo;|&rdquo;|&quot;/g, '"').replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Space Launch Delta 30's newsroom, syndicated on DVIDS (U.S. government work, public domain). */
async function spaceLaunchDelta30(): Promise<PrimaryLead[]> {
  const items = parseRssItems(await getText("https://www.dvidshub.net/rss/unit/810"))
  return items
    .filter((i) => /dvidshub\.net\/news\//.test(i.link))
    .map((i) => ({
      title: i.title,
      url: i.link,
      publishedAt: i.pubDate && !isNaN(i.pubDate.getTime()) ? i.pubDate : null,
      summary: `Vandenberg Space Force Base — ${i.description ?? "official release from Space Launch Delta 30"}`,
      source: "Space Launch Delta 30",
      kind: "primary" as const,
    }))
}

/** Lompoc Unified's news feed (ParentSquare SmartSites markup). */
async function lompocUnified(): Promise<PrimaryLead[]> {
  const html = await getText("https://www.lusd.org/48884")
  const rows = html.match(/<a class="ss-row ss-post-page-row"[\s\S]*?<\/a>/g) ?? []
  const leads: PrimaryLead[] = []
  for (const row of rows) {
    const href = row.match(/href="([^"]+)"/)?.[1]
    const title = row.match(/<h2 class="ss-post-title">([\s\S]*?)<\/h2>/)?.[1]
    const date = row.match(/<div class="ss-post-date">([\s\S]*?)<\/div>/)?.[1]
    if (!href || !title) continue
    const d = date ? new Date(strip(date)) : null
    leads.push({
      title: strip(title).slice(0, 490),
      url: new URL(href, "https://www.lusd.org").toString(),
      publishedAt: d && !isNaN(d.getTime()) ? d : null,
      summary: "Posted by Lompoc Unified School District.",
      source: "Lompoc Unified School District",
      kind: "primary",
    })
  }
  return leads
}

const TEAMS = [
  { school: "Lompoc", team: "Lompoc Braves", url: "https://www.maxpreps.com/ca/lompoc/lompoc-braves/football/schedule/" },
  { school: "Cabrillo", team: "Cabrillo Conquistadores", url: "https://www.maxpreps.com/ca/lompoc/cabrillo-conquistadores/football/schedule/" },
]

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function fmtDate(iso: string, withDay = false): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return `${withDay ? DAYS[dt.getUTCDay()] + ", " : ""}${MONTHS[m - 1]} ${d}`
}

/** Plural-safe "1 win, 3 losses, 1 tie". */
export function recordWords(wins: number, losses: number, ties: number): string {
  const parts = [`${wins} ${wins === 1 ? "win" : "wins"}`, `${losses} ${losses === 1 ? "loss" : "losses"}`]
  if (ties) parts.push(`${ties} ${ties === 1 ? "tie" : "ties"}`)
  return parts.join(", ")
}

/**
 * The football fact sheet, built from our synced `football_games` rows (the
 * same data the /football hub shows). Pure so it can be tested: the record is
 * spelled out in numbers AND words so the desk cannot invent one.
 */
export function footballFactSheet(team: TeamSeason, syncedOn: string): string {
  const played = team.games.filter((g) => g.result)
  const record = `${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ""}`
  const gameLines = played.map((g) => {
    const verb = g.result === "W" ? "won" : g.result === "L" ? "lost" : "tied"
    const where = g.homeAway === "away" ? "away" : g.venue ? `home, ${g.venue}` : "home"
    const score = g.scoreFor != null && g.scoreAgainst != null ? ` ${g.scoreFor}-${g.scoreAgainst}` : ""
    return `${fmtDate(g.gameDate)} ${g.homeAway === "away" ? "at" : "vs"} ${g.opponent}, ${verb}${score} (${where}).`
  })
  const next = team.next
  const nextLine = next
    ? ` Next game: ${fmtDate(next.gameDate, true)} ${next.homeAway === "away" ? "at" : "vs"} ${next.opponent}${next.kickoff ? `, ${next.kickoff}` : ""}${next.venue ? `, ${next.venue}` : ""} (${next.homeAway}).`
    : " No further games on the schedule."
  const firstLeague = team.games.find((g) => g.leagueGame && !g.result)
  const leagueLine = firstLeague ? ` League play begins ${fmtDate(firstLeague.gameDate)} ${firstLeague.homeAway === "away" ? "at" : "vs"} ${firstLeague.opponent}.` : ""
  return (
    `${FACT_SHEET} — ${team.name} varsity football (Lompoc, CA), ${team.games[0]?.season ?? ""} season, per MaxPreps schedule and results as synced ${syncedOn}. ` +
    `Record: ${record} (${recordWords(team.wins, team.losses, team.ties)}) after ${played.length} ${played.length === 1 ? "game" : "games"}. ` +
    `Games played: ${gameLines.join(" ") || "none yet."}${nextLine}${leagueLine}`
  )
}

/**
 * Varsity football, one fact sheet per school per new result, built from the
 * `football_games` table (synced from MaxPreps by /api/cron/sync-football).
 * The lead URL carries the latest result date so a week without a game adds
 * nothing. Falls back to reading MaxPreps' result sentences off the page only
 * when the table has no rows for the season.
 */
async function varsityFootball(): Promise<PrimaryLead[]> {
  let teams: TeamSeason[] = []
  try {
    teams = await getFootballSeason()
  } catch (err) {
    console.error("[primary-sources] football_games unavailable, falling back to page parse:", err instanceof Error ? err.message : err)
  }
  const leads: PrimaryLead[] = []
  const syncedOn = new Date().toISOString().slice(0, 10)
  for (const t of TEAMS) {
    const team = teams.find((x) => x.name === t.team)
    if (!team || !team.games.length) {
      leads.push(...(await varsityFootballFromPage(t)))
      continue
    }
    if (!team.last) continue
    const through = team.last.gameDate.slice(0, 10)
    const [y, m, d] = through.split("-").map(Number)
    leads.push({
      title: `${t.team} football: results through ${m}/${d}`,
      url: `${t.url}?through=${through}`,
      publishedAt: new Date(y, m - 1, d, 22),
      summary: footballFactSheet(team, syncedOn),
      source: "MaxPreps",
      kind: "primary",
    })
  }
  return leads
}

/** Legacy fallback: MaxPreps' own result sentences on the schedule page. */
async function varsityFootballFromPage(t: (typeof TEAMS)[number]): Promise<PrimaryLead[]> {
  const year = new Date().getFullYear()
  const leads: PrimaryLead[] = []
  {
    const html = await getText(t.url)
    const sentences = Array.from(new Set(html.match(new RegExp(`On \\d{1,2}/\\d{1,2}, the ${t.school} varsity football team [^"<]{10,240}?\\.`, "g")) ?? []))
    if (!sentences.length) return leads
    const last = sentences[sentences.length - 1].match(/On (\d{1,2})\/(\d{1,2})/)!
    const lastDate = new Date(year, Number(last[1]) - 1, Number(last[2]), 22)
    const wins = sentences.filter((s) => / won /.test(s)).length
    const losses = sentences.filter((s) => / lost /.test(s)).length
    const games = Array.from(html.matchAll(/maxpreps\.com\/ca\/football\/game\/([a-z0-9-]+)\/(\d{1,2})-(\d{1,2})-(\d{4})\//g))
    const next = games.map((m) => ({ slug: m[1], date: new Date(Number(m[4]), Number(m[2]) - 1, Number(m[3])) })).find((g) => g.date > lastDate)
    const nextLine = next
      ? ` Next on the schedule: ${next.date.getMonth() + 1}/${next.date.getDate()}, ${next.slug.replace(/-/g, " ").replace(/ vs /, " vs. ")} (listing as published by MaxPreps; venue not stated).`
      : ""
    leads.push({
      title: `${t.team} football: results through ${last[1]}/${last[2]}`,
      url: `${t.url}?through=${year}-${last[1].padStart(2, "0")}-${last[2].padStart(2, "0")}`,
      publishedAt: lastDate,
      summary: `${FACT_SHEET} — ${t.team} varsity football (Lompoc, CA), per the MaxPreps schedule. Record so far: ${wins}-${losses}. ${sentences.join(" ")}${nextLine}`,
      source: "MaxPreps",
      kind: "primary",
    })
  }
  return leads
}

const PARSERS: { source: string; run: () => Promise<PrimaryLead[]> }[] = [
  { source: "Space Launch Delta 30", run: spaceLaunchDelta30 },
  { source: "Lompoc Unified School District", run: lompocUnified },
  { source: "MaxPreps", run: varsityFootball },
]

/** Run every parser; never throws. Leads are deduped by URL across sources. */
export async function harvestPrimarySources(): Promise<PrimaryReport[]> {
  const seen = new Set<string>()
  const reports: PrimaryReport[] = []
  for (const p of PARSERS) {
    try {
      const all = await p.run()
      const leads = all.filter((l) => /^https?:\/\//.test(l.url) && !seen.has(l.url) && seen.add(l.url))
      reports.push({ source: p.source, found: all.length, leads })
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      console.error(`[primary-sources] ${p.source}: ${error}`)
      reports.push({ source: p.source, found: 0, leads: [], error })
    }
  }
  return reports
}
