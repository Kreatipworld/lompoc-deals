import { unstable_noStore } from "next/cache"
import { NextResponse } from "next/server"
import { getFootballGame, kickoffIso } from "@/lib/football"
import { SCHOOLS } from "@/lib/football-sync"

// One game as a calendar file, so a fan can drop Friday night on their phone from /football.
// Times are Pacific; the offset comes from kickoffIso (PDT in season, PST after early November).

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

function toUtcStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  unstable_noStore()
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Bad id" }, { status: 400 })
  const g = await getFootballGame(id)
  if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const team = SCHOOLS.find((s) => s.school === g.school)
  const teamName = team?.name ?? g.school
  const title = g.homeAway === "away" ? `${teamName} at ${g.opponent}` : `${teamName} vs ${g.opponent}`
  const startIso = kickoffIso(g)
  const url = `https://www.lompoclocals.com/football#${g.school === "lompoc" ? "braves" : "conqs"}`

  let dt: string
  if (startIso) {
    const start = new Date(startIso)
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000)
    dt = `DTSTART:${toUtcStamp(start.toISOString())}\r\nDTEND:${toUtcStamp(end.toISOString())}`
  } else {
    // No kickoff time known: an all-day entry on the game date.
    const day = g.gameDate.replace(/-/g, "")
    dt = `DTSTART;VALUE=DATE:${day}`
  }

  const stamp = toUtcStamp(new Date().toISOString())
  const location = g.venue ? `${g.venue}, Lompoc, CA` : g.homeAway === "away" ? `${g.opponent} (away)` : "Lompoc, CA"
  const description = `${title}${g.kickoff ? ` · kickoff ${g.kickoff}` : ""}. Schedules, scores, and game stories: ${url}`

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lompoc Locals//Lompoc Football//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:football-${g.id}@lompoclocals.com`,
    `DTSTAMP:${stamp}`,
    dt,
    `SUMMARY:${icsEscape(title)}`,
    `LOCATION:${icsEscape(location)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n")

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${slug}-${g.gameDate}.ics"`,
      "cache-control": "public, max-age=600",
    },
  })
}
