"use client"

import { useEffect } from "react"
import { ShieldAlert, LogOut, RefreshCw } from "lucide-react"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Admin error]", error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-7 w-7" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">
        Admin page error
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong loading the admin dashboard. This is usually caused
        by a stale login session.
      </p>

      <div className="mt-8 w-full rounded-2xl border bg-muted/30 p-5 text-left text-sm">
        <p className="font-semibold">Recovery steps</p>
        <ol className="mt-3 space-y-2 text-muted-foreground">
          <li className="flex gap-2">
            <span className="shrink-0 font-bold text-foreground">1.</span>
            Sign out completely (the button below).
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold text-foreground">2.</span>
            Clear your browser cookies for this site, or open an incognito window.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold text-foreground">3.</span>
            Sign back in with your admin account.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold text-foreground">4.</span>
            If you still can&apos;t log in, run{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
              npm run seed:admin
            </code>{" "}
            to re-grant admin role to your account.
          </li>
        </ol>
      </div>

      {error.digest && (
        <p className="mt-4 text-xs text-muted-foreground">
          Error ID: <code className="font-mono">{error.digest}</code>
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
        <form method="POST" action="/api/auth/signout">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
