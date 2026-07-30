import { format } from "date-fns"
import { getCronRunSummary } from "@/lib/cron-log"

export const dynamic = "force-dynamic"

// The scheduled jobs we run (mirrors vercel.json "crons"). Kept here so admins
// can always see what's automated and follow up on the results. Schedules are UTC.
const CRON_REGISTRY: {
  name: string
  label: string
  what: string
  cadence: string
  schedule: string
}[] = [
  {
    name: "re-engage",
    label: "Re-engage quiet members",
    what: "Nudges claimed, free-tier businesses with no active deal (14+ days old). Skips paying members and anyone unsubscribed; 30-day cooldown per owner.",
    cadence: "Weekly · Wed",
    schedule: "0 17 * * 3",
  },
  {
    name: "digest",
    label: "Community digest",
    what: "Sends the weekly community digest email to all confirmed subscribers.",
    cadence: "Weekly · Mon",
    schedule: "0 16 * * 1",
  },
  {
    name: "sync-listings",
    label: "Sync property listings",
    what: "Pulls the latest Zillow property listings into the platform.",
    cadence: "Daily",
    schedule: "0 6 * * *",
  },
  {
    name: "sync-events",
    label: "Sync events",
    what: "Refreshes Vandenberg launches and Explore-Lompoc community events.",
    cadence: "Daily",
    schedule: "0 13 * * *",
  },
  {
    name: "expire-feed-posts",
    label: "Expire feed posts",
    what: "Removes expired feed posts (garage sales, announcements) so the feed stays fresh.",
    cadence: "Daily",
    schedule: "0 8 * * *",
  },
  {
    name: "vitals",
    label: "Web Vitals report",
    what: "Weekly Core Web Vitals performance report.",
    cadence: "Weekly · Mon",
    schedule: "0 15 * * 1",
  },
]

function fmtResult(r: Record<string, unknown> | null): string {
  if (!r) return "—"
  return Object.entries(r)
    .filter(([k]) => k !== "at")
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" · ")
}

export default async function AdminAutomationPage() {
  const summary = await getCronRunSummary()

  return (
    <main className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Automation</h1>
        <p className="text-muted-foreground">
          Every scheduled job on Lompoc Locals — what it does, when it runs, and its latest result.
        </p>
      </header>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Job</th>
              <th className="p-3 font-medium">Schedule</th>
              <th className="p-3 font-medium">Last run</th>
              <th className="p-3 font-medium">Last result</th>
              <th className="p-3 font-medium text-right">Runs&nbsp;(30d)</th>
            </tr>
          </thead>
          <tbody>
            {CRON_REGISTRY.map((c) => {
              const s = summary[c.name]
              return (
                <tr key={c.name} className="border-t align-top">
                  <td className="p-3">
                    <div className="font-medium">{c.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{c.what}</div>
                  </td>
                  <td className="whitespace-nowrap p-3">
                    <div>{c.cadence}</div>
                    <code className="text-xs text-muted-foreground">{c.schedule}</code>
                  </td>
                  <td className="whitespace-nowrap p-3">
                    {s?.lastRunAt ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${s.lastOk ? "bg-green-500" : "bg-red-500"}`}
                        />
                        {format(s.lastRunAt, "MMM d, h:mm a")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">no runs logged yet</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{fmtResult(s?.lastResult ?? null)}</td>
                  <td className="p-3 text-right font-medium tabular-nums">{s?.runs30d ?? 0}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Schedules are in UTC. Jobs log a row each time they run; email jobs (digest, re-engage)
        record how many were sent.
      </p>
    </main>
  )
}
