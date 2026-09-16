import { format } from "date-fns"
import { Bug } from "lucide-react"
import { listBugReports, setBugStatusAction } from "@/lib/bug-report-actions"

export const dynamic = "force-dynamic"

const STATUS_STYLES: Record<string, string> = {
  new: "bg-amber-100 text-amber-800",
  fixed: "bg-green-100 text-green-800",
  ignored: "bg-muted text-muted-foreground",
}

/**
 * Every "Report a bug" a neighbor filed, newest first, with the route and the
 * captured error so it can be reproduced. Mark it fixed when it ships — the
 * count on the overview tile is the open backlog.
 */
export default async function AdminBugsPage() {
  const reports = await listBugReports()
  const open = reports.filter((r) => r.status === "new").length

  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
          <Bug className="h-7 w-7 text-primary" /> Bug reports
        </h1>
        <p className="text-muted-foreground">
          What people told us went wrong, with the page and the error attached. {open} open · {reports.length} total.
        </p>
      </header>

      {reports.length === 0 ? (
        <p className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">No reports yet. That is the goal.</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="rounded-2xl border bg-card p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLES[r.status] ?? "bg-muted"}`}>{r.status}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 font-medium">{r.source}</span>
                <span className="text-muted-foreground">#{r.id} · {format(new Date(r.createdAt), "MMM d, yyyy h:mma")}</span>
                {r.locale && <span className="text-muted-foreground">· {r.locale}</span>}
              </div>
              <p className="text-sm font-medium">{r.description}</p>
              <dl className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-[auto_1fr] sm:gap-x-4">
                <dt className="font-semibold">Page</dt>
                <dd>
                  {r.route ? (
                    <a href={r.route} className="text-primary underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
                      {r.route}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
                <dt className="font-semibold">Error</dt>
                <dd className="break-all font-mono">{r.errorMessage ?? "none captured"}{r.digest ? ` · digest ${r.digest}` : ""}</dd>
                <dt className="font-semibold">Reply to</dt>
                <dd>{r.email ?? "not given"}{r.userId ? ` · user #${r.userId}` : ""}</dd>
                <dt className="font-semibold">Device</dt>
                <dd className="break-all">{r.userAgent ?? "—"}</dd>
                {r.adminNote && (
                  <>
                    <dt className="font-semibold">Note</dt>
                    <dd>{r.adminNote}</dd>
                  </>
                )}
              </dl>
              <form action={setBugStatusAction} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={r.id} />
                <input
                  type="text"
                  name="note"
                  defaultValue={r.adminNote ?? ""}
                  placeholder="What fixed it (optional)"
                  className="h-9 min-w-[220px] flex-1 rounded-lg border border-border bg-background px-3 text-xs"
                />
                {(["fixed", "ignored", "new"] as const)
                  .filter((s) => s !== r.status)
                  .map((s) => (
                    <button
                      key={s}
                      type="submit"
                      name="status"
                      value={s}
                      className="h-9 rounded-full border border-border px-4 text-xs font-semibold transition hover:bg-accent"
                    >
                      Mark {s}
                    </button>
                  ))}
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
