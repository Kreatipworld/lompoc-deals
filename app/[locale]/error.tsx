"use client"

import { useEffect } from "react"
import { ReportBug } from "@/components/report-bug"

/**
 * Route error boundary. Calm and short: one card, one Reload button (a fresh
 * document beats React's reset() — the cases we hit were hydration crashes,
 * which reset() cannot recover from). Every render reports a `client_error`
 * event so the admin dashboard sees what broke and where, without a third-party
 * error service.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
    const route = typeof window !== "undefined" ? window.location.pathname + window.location.search : ""
    const message = String(error?.message ?? error).slice(0, 300)
    try {
      fetch("/api/track/event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "client_error", props: { route, message, digest: error?.digest ?? null } }),
        keepalive: true,
      }).catch(() => {})
    } catch {
      // never let error reporting throw inside the boundary
    }
  }, [error])

  const reload = () => {
    if (typeof window !== "undefined") window.location.reload()
    else reset()
  }

  return (
    // data-error-boundary is the health check's marker: the text below also
    // lives in messages/en.json, so only this attribute proves the boundary rendered.
    <div data-error-boundary="root" className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="w-full rounded-[20px] border border-border/80 bg-card px-6 py-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Something went wrong.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Reload the page and it should be back.</p>
        <button
          type="button"
          onClick={reload}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Reload
        </button>
        <a href="/" className="mt-4 block text-sm text-muted-foreground underline-offset-4 hover:underline">
          Back to Lompoc Locals
        </a>
        {/* Owner: "if things go wrong, show a button that says Report a bug — that makes
            our platform smarter." The route + message travel with the report. */}
        <div className="mt-6 border-t border-border/60 pt-5">
          <ReportBug source="error" errorMessage={String(error?.message ?? error).slice(0, 2000)} digest={error?.digest ?? null} />
        </div>
      </div>
    </div>
  )
}
