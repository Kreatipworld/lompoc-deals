"use client"

import { useTranslations } from "next-intl"
import { RefreshCw } from "lucide-react"

/**
 * Auth-area error boundary. The signup wizard is a long-lived client page, so
 * a deploy mid-signup can strand a tab with stale server-action references —
 * the fix is simply reloading. Show that path instead of a dead end.
 */
export default function AuthError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("auth.boundary")

  return (
    <div className="space-y-5 py-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <RefreshCw className="h-6 w-6" />
      </div>
      <div className="space-y-1.5">
        <h1 className="font-display text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{t("body")}</p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.97]"
        >
          {t("reload")}
        </button>
        <button
          type="button"
          onClick={reset}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("retry")}
        </button>
      </div>
    </div>
  )
}
