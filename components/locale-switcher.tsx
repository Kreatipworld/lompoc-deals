"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"

type Variant = "default" | "mobile"

export function LocaleSwitcher({ variant = "default" }: { variant?: Variant }) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchTo(target: "en" | "es") {
    if (target === locale) return
    router.replace(pathname, { locale: target })
  }

  if (variant === "mobile") {
    return (
      <div className="flex items-center justify-between border-b py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {locale === "es" ? "Idioma" : "Language"}
        </span>
        <div className="flex items-center gap-1">
          <PillButton active={locale === "en"} onClick={() => switchTo("en")} label="English" />
          <PillButton active={locale === "es"} onClick={() => switchTo("es")} label="Español" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 rounded-full border bg-muted p-0.5">
      <PillButton active={locale === "en"} onClick={() => switchTo("en")} label="EN" />
      <PillButton active={locale === "es"} onClick={() => switchTo("es")} label="ES" />
    </div>
  )
}

function PillButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background"
      }`}
    >
      {label}
    </button>
  )
}
