import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { MapPin, Phone, Globe, Inbox } from "lucide-react"
import {
  getPendingBusinesses,
  approveBusinessAction,
  rejectBusinessAction,
} from "@/lib/admin-actions"
import { Button } from "@/components/ui/button"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.businesses")
  return { title: t("metaTitle") }
}

export default async function AdminBusinessesPage() {
  const t = await getTranslations("admin.businesses")
  const pending = await getPendingBusinesses()

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pending.map((b) => (
            <article
              key={b.id}
              className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium uppercase text-amber-700">
                  {t("pendingBadge")}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold leading-snug">
                {b.name}
              </h3>
              {b.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {b.description}
                </p>
              )}
              <ul className="space-y-1 text-xs text-muted-foreground">
                {b.address && (
                  <li className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-primary/60" />
                    {b.address}
                  </li>
                )}
                {b.phone && (
                  <li className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-primary/60" />
                    {b.phone}
                  </li>
                )}
                {b.website && (
                  <li className="flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-primary/60" />
                    {b.website.replace(/^https?:\/\//, "")}
                  </li>
                )}
              </ul>
              <div className="mt-auto flex items-center gap-2 border-t pt-3">
                <form action={approveBusinessAction}>
                  <input type="hidden" name="businessId" value={b.id} />
                  <Button type="submit" size="sm">
                    {t("approve")}
                  </Button>
                </form>
                <form action={rejectBusinessAction}>
                  <input type="hidden" name="businessId" value={b.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    {t("reject")}
                  </Button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
