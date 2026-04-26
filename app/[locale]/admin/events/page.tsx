import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { format } from "date-fns"
import { CalendarDays, MapPin, Inbox } from "lucide-react"
import {
  getPendingEvents,
  approveEventAction,
  rejectEventAction,
} from "@/lib/admin-actions"
import { Button } from "@/components/ui/button"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.events")
  return { title: t("metaTitle") }
}

export default async function AdminEventsPage() {
  const t = await getTranslations("admin.events")
  const pending = await getPendingEvents()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("heading")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subheading")}
        </p>
      </header>

      {pending.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-12 text-center">
          <Inbox className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t("empty")}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {pending.map((e) => {
            const catKey = e.category as string
            const catLabel =
              t.has(`categories.${catKey}`)
                ? t(`categories.${catKey}` as Parameters<typeof t>[0])
                : e.category
            return (
              <li
                key={e.id}
                className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {catLabel}
                    </span>
                  </div>
                  <h3 className="font-semibold leading-snug">{e.title}</h3>
                  {e.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {e.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(e.startsAt), "MMM d, yyyy h:mm a")}
                      {e.endsAt && ` – ${format(new Date(e.endsAt), "h:mm a")}`}
                    </span>
                    {e.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {e.location}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/60">
                    {t("submitted")} {format(new Date(e.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={approveEventAction}>
                    <input type="hidden" name="eventId" value={e.id} />
                    <Button type="submit" size="sm">
                      {t("approve")}
                    </Button>
                  </form>
                  <form action={rejectEventAction}>
                    <input type="hidden" name="eventId" value={e.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      {t("reject")}
                    </Button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
