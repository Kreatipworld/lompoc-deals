"use client"

import { useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import { useTransition } from "react"

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function switchLocale(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <button
        onClick={() => switchLocale("en")}
        disabled={isPending}
        className={`rounded px-1.5 py-0.5 transition hover:text-foreground ${
          locale === "en"
            ? "text-foreground underline underline-offset-2"
            : ""
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <span aria-hidden>|</span>
      <button
        onClick={() => switchLocale("es")}
        disabled={isPending}
        className={`rounded px-1.5 py-0.5 transition hover:text-foreground ${
          locale === "es"
            ? "text-foreground underline underline-offset-2"
            : ""
        }`}
        aria-label="Cambiar a español"
      >
        ES
      </button>
    </div>
  )
}
