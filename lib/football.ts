// Read side of the Lompoc Football hub: schedules, records, next games,
// latest results, and the football stories from the news desk.

import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { footballGames, blogPosts } from "@/db/schema"
import { SCHOOLS, type School } from "@/lib/football-sync"
import { localizeFields, type Locale } from "@/lib/localize"
import type { BlogPostCard } from "@/lib/queries"

export type FootballGame = {
  id: number
  school: School
  season: number
  gameDate: string
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

export type TeamSeason = {
  school: School
  name: string
  short: string
  wins: number
  losses: number
  ties: number
  next: FootballGame | null
  last: FootballGame | null
  games: FootballGame[]
}

/** Today's date in Lompoc as YYYY-MM-DD. */
export function todayPacific(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}

export function currentSeason(): number {
  const d = new Date()
  const y = Number(new Intl.DateTimeFormat("en", { timeZone: "America/Los_Angeles", year: "numeric" }).format(d))
  const m = Number(new Intl.DateTimeFormat("en", { timeZone: "America/Los_Angeles", month: "numeric" }).format(d))
  return m >= 7 ? y : y - 1
}

/** Aug 15 – Dec 15 Pacific, the window the homepage strip is shown. */
export function isFootballSeason(): boolean {
  const md = todayPacific().slice(5) // MM-DD
  return md >= "08-15" && md <= "12-15"
}

export async function getFootballSeason(season = currentSeason()): Promise<TeamSeason[]> {
  const rows = (await db
    .select()
    .from(footballGames)
    .where(eq(footballGames.season, season))
    .orderBy(footballGames.gameDate)) as FootballGame[]
  const today = todayPacific()
  return SCHOOLS.map((s) => {
    const games = rows.filter((g) => g.school === s.school)
    const played = games.filter((g) => g.result)
    // A game counts as "next" from its day through kickoff night; results usually land the morning after.
    const next = games.find((g) => !g.result && g.gameDate >= today) ?? null
    const last = played.length ? played[played.length - 1] : null
    return {
      school: s.school,
      name: s.name,
      short: s.short,
      wins: played.filter((g) => g.result === "W").length,
      losses: played.filter((g) => g.result === "L").length,
      ties: played.filter((g) => g.result === "T").length,
      next,
      last,
      games,
    }
  })
}

/** The two next games (one per school) for the homepage strip; empty off-season or when nothing is scheduled. */
export async function getNextFootballGames(): Promise<{ team: TeamSeason; game: FootballGame }[]> {
  if (!isFootballSeason()) return []
  try {
    const teams = await getFootballSeason()
    return teams.filter((t) => t.next).map((t) => ({ team: t, game: t.next! }))
  } catch {
    return []
  }
}

/** Latest results across both schools, newest first. */
export function latestResults(teams: TeamSeason[], limit = 4): (FootballGame & { teamName: string; teamShort: string })[] {
  return teams
    .flatMap((t) => t.games.filter((g) => g.result).map((g) => ({ ...g, teamName: t.name, teamShort: t.short })))
    .sort((a, b) => (a.gameDate < b.gameDate ? 1 : a.gameDate > b.gameDate ? -1 : 0))
    .slice(0, limit)
}

/** Published news-desk stories about either program, newest first. */
export async function getFootballNews(limit = 6, locale?: Locale | string): Promise<BlogPostCard[]> {
  const kw = (col: typeof blogPosts.title) =>
    or(ilike(col, "%braves%"), ilike(col, "%cabrillo%"), ilike(col, "%football%"), ilike(col, "%conquistador%"), ilike(col, "%huyck%")) // allow-ilike — fixed team keywords, never user input
  const rows = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      titleEs: blogPosts.titleEs,
      excerpt: blogPosts.excerpt,
      excerptEs: blogPosts.excerptEs,
      imageUrl: blogPosts.imageUrl,
      category: blogPosts.category,
      tags: blogPosts.tags,
      authorName: blogPosts.authorName,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.status, "published"), or(kw(blogPosts.title), ilike(blogPosts.slug, "%football%")))) // allow-ilike — fixed team keywords, never user input
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit)
  return rows.map((r) => {
    const loc = localizeFields((locale === "es" ? "es" : "en") as Locale, r as Record<string, unknown>, ["title", "excerpt"])
    return {
      id: r.id,
      slug: r.slug,
      title: loc.title as string,
      titleEn: r.title,
      excerpt: (loc.excerpt as string | null) ?? null,
      imageUrl: r.imageUrl,
      category: r.category,
      tags: (r.tags as string[] | null) ?? null,
      authorName: r.authorName,
      publishedAt: r.publishedAt,
    }
  })
}

/** Season-to-date results for the Monday report: games played and won this season. */
export async function footballSeasonStats(): Promise<{ played: number; wins: number }> {
  const [row] = await db
    .select({
      played: sql<number>`count(*) filter (where ${footballGames.result} is not null)`,
      wins: sql<number>`count(*) filter (where ${footballGames.result} = 'W')`,
    })
    .from(footballGames)
    .where(and(eq(footballGames.season, currentSeason()), gte(footballGames.gameDate, `${currentSeason()}-07-01`)))
  return { played: Number(row?.played ?? 0), wins: Number(row?.wins ?? 0) }
}
