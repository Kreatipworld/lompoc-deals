import { Clock } from "lucide-react"
import {
  DAY_KEYS,
  DAY_LABELS,
  formatHoursLine,
  isOpenNow,
  parseHours,
} from "@/lib/hours"
import { getTranslations } from "next-intl/server"

export async function BusinessHours({ hoursJson }: { hoursJson: unknown }) {
  const hours = parseHours(hoursJson)
  const open = isOpenNow(hours)
  const t = await getTranslations("businesses.profile")

  // If every day is null, show nothing — we don't fake hours
  const anyDay = DAY_KEYS.some((k) => hours[k] !== null)
  if (!anyDay) return null

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
        {DAY_KEYS.map((k) => (
          <li
            key={k}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-muted-foreground">{DAY_LABELS[k]}</span>
            <span
              className={
                hours[k] ? "text-foreground" : "text-muted-foreground/60"
              }
            >
              {formatHoursLine(hours[k])}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
