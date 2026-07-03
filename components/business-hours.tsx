import { Clock } from "lucide-react"
import {
  DAY_KEYS,
  DAY_LABELS,
  formatHoursLine,
  isOpenNow,
  isRaw,
  parseHours,
} from "@/lib/hours"
import { getTranslations } from "next-intl/server"

interface Props {
  hoursJson: unknown
  phone?: string | null
}

export async function BusinessHours({ hoursJson, phone }: Props) {
  const hours = parseHours(hoursJson)
  const open = isOpenNow(hours)
  const t = await getTranslations("businesses.profile")

  const anyDay = DAY_KEYS.some((k) => hours[k] !== null)
  if (!anyDay)
    return (
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {t("hours")}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {phone ? t("hoursUnknownCall") : t("hoursUnknown")}
        </p>
        {phone && (
          <a
            href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
            className="mt-1 inline-block text-sm font-semibold text-primary hover:underline"
          >
            {phone}
          </a>
        )}
      </div>
    )

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {t("hours")}
        </h3>
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            open
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-muted-foreground/20 bg-muted text-muted-foreground"
          }`}
        >
          {open ? t("openNow") : t("closedNow")}
        </span>
      </div>
      <ul className="space-y-1 text-sm">
        {DAY_KEYS.map((k) => {
          const d = hours[k]
          return (
            <li key={k} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{DAY_LABELS[k]}</span>
              <span
                className={
                  d
                    ? isRaw(d)
                      ? "text-right text-[13px] italic text-foreground"
                      : "text-foreground"
                    : "text-muted-foreground/60"
                }
              >
                {formatHoursLine(d)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
