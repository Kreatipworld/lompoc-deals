import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { format } from "date-fns"
import { Inbox, ShoppingBag, MapPinOff, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SafeImage } from "@/components/safe-image"
import { getBlockedSellers, getPendingSaleListings, getRecentSaleListings, type AdminSaleListing } from "@/lib/sales-queries"
import { formatSalePrice, REJECT_REASONS } from "@/lib/sales"
import {
  approveSaleListingAction,
  blockSalesUserAction,
  hideSaleListingAction,
  rejectSaleListingAction,
  unblockSalesUserAction,
  unhideSaleListingAction,
} from "@/lib/sales-admin-actions"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sales.admin")
  return { title: t("metaTitle") }
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  sold: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
  hidden: "bg-red-100 text-red-800",
  rejected: "bg-red-100 text-red-800",
}

/**
 * The approval desk: every pending listing with photos and the poster's
 * account; approve / reject (with a canned reason); hide anything live; block
 * a seller. Every listing on Lompoc Sales passes through here first.
 */
export default async function AdminSalesPage() {
  const t = await getTranslations("sales")
  const [pending, recent, blocked] = await Promise.all([getPendingSaleListings(), getRecentSaleListings(), getBlockedSellers()])

  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 font-display text-3xl font-semibold tracking-tight">
          <ShoppingBag className="h-7 w-7 text-primary" /> {t("admin.heading")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.subheading")}</p>
      </header>

      <section>
        <h2 className="font-display text-xl font-semibold">
          {t("admin.pending")} <span className="text-muted-foreground">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-dashed bg-muted/30 px-6 py-10 text-center">
            <Inbox className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">{t("admin.nonePending")}</p>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {pending.map((l) => (
              <li key={l.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                <ListingSummary l={l} t={t} />
                <div className="mt-4 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-start">
                  <form action={approveSaleListingAction}>
                    <input type="hidden" name="id" value={l.id} />
                    <Button type="submit" size="sm">
                      {t("admin.approve")}
                    </Button>
                  </form>
                  <form action={rejectSaleListingAction} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <input type="hidden" name="id" value={l.id} />
                    <select name="reason" defaultValue="other" aria-label={t("admin.reason")} className="h-9 rounded-lg border border-border bg-background px-2 text-xs">
                      {REJECT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {t(`admin.reasons.${r}`)}
                        </option>
                      ))}
                    </select>
                    <input type="text" name="note" placeholder={t("admin.note")} maxLength={500} className="h-9 min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 text-xs" />
                    <Button type="submit" size="sm" variant="ghost">
                      {t("admin.reject")}
                    </Button>
                  </form>
                  <BlockForm l={l} t={t} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">{t("admin.recent")}</h2>
        {recent.length === 0 ? (
          <p className="mt-3 rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">{t("admin.noneRecent")}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {recent.map((l) => (
              <li key={l.id} className="rounded-2xl border bg-card p-4">
                <ListingSummary l={l} t={t} compact />
                <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                  {l.status === "active" && (
                    <form action={hideSaleListingAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        {t("admin.hide")}
                      </Button>
                    </form>
                  )}
                  {l.status === "hidden" && (
                    <form action={unhideSaleListingAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        {t("admin.unhide")}
                      </Button>
                    </form>
                  )}
                  <BlockForm l={l} t={t} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">{t("admin.blockedSellers")}</h2>
        {blocked.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("admin.noneBlocked")}</p>
        ) : (
          <ul className="mt-3 divide-y rounded-2xl border bg-card">
            {blocked.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  {u.name ?? "—"} · {u.email} · #{u.id}
                  {u.salesBlockedAt && <span className="text-muted-foreground"> · {format(u.salesBlockedAt, "MMM d, yyyy")}</span>}
                </span>
                <form action={unblockSalesUserAction}>
                  <input type="hidden" name="userId" value={u.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    {t("admin.unblock")}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

type T = Awaited<ReturnType<typeof getTranslations<"sales">>>

function BlockForm({ l, t }: { l: AdminSaleListing; t: T }) {
  if (l.poster.salesBlockedAt) return <span className="self-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">{t("admin.blockedBadge")}</span>
  return (
    <form action={blockSalesUserAction} className="sm:ml-auto">
      <input type="hidden" name="userId" value={l.poster.id} />
      <Button type="submit" size="sm" variant="ghost" className="text-destructive">
        {t("admin.block")}
      </Button>
    </form>
  )
}

function ListingSummary({ l, t, compact = false }: { l: AdminSaleListing; t: T; compact?: boolean }) {
  const price = formatSalePrice(l, { free: t("card.free"), obo: t("card.obo") })
  const photos = l.photos ?? []
  return (
    <div className="flex gap-4">
      {photos.length > 0 ? (
        <div className={`flex shrink-0 gap-1 ${compact ? "" : "flex-wrap"}`}>
          {photos.slice(0, compact ? 1 : 4).map((p, i) => (
            <SafeImage key={p + i} src={p} alt="" className={`${compact ? "h-16 w-16" : "h-24 w-24"} rounded-lg object-cover`} optWidth={384} />
          ))}
        </div>
      ) : (
        <div className={`${compact ? "h-16 w-16" : "h-24 w-24"} shrink-0 rounded-lg bg-primary/[0.05]`} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLES[l.status] ?? "bg-muted"}`}>{t(`admin.status.${l.status}`)}</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">{t(`categories.${l.category}.name`)}</span>
          <span className="text-muted-foreground">
            #{l.id} · {t(`kinds.${l.kind}`)} · {format(l.createdAt, "MMM d, h:mma")}
          </span>
          {l.kind === "garage-sale" && l.lat == null && (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <MapPinOff className="h-3 w-3" /> {t("admin.noPin")}
            </span>
          )}
          {l.showPhone && l.contactPhone && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" /> {t("admin.phoneShown")} {l.contactPhone}
            </span>
          )}
        </div>
        <p className="mt-1 font-semibold leading-snug">
          {price && <span className="tabular-nums">{price} · </span>}
          {l.title}
        </p>
        {!compact && <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{l.description}</p>}
        <p className="mt-1 text-xs text-muted-foreground">
          {l.kind === "garage-sale" ? `${l.address ?? "—"} · ${l.startsAt ? format(l.startsAt, "EEE MMM d, h:mma") : ""}${l.endsAt ? ` – ${format(l.endsAt, "h:mma")}` : ""}` : l.area}
          {l.kind === "vehicle" && l.attrs ? ` · ${l.attrs.year ?? ""} ${l.attrs.make ?? ""} ${l.attrs.model ?? ""}${l.attrs.mileage != null ? ` · ${l.attrs.mileage.toLocaleString()} mi` : ""}` : ""}
        </p>
        <p className="mt-2 text-xs">
          <span className="font-semibold">{t("admin.poster")}</span> {l.poster.name ?? "—"} · {l.poster.email} · #{l.poster.id} ·{" "}
          {t("admin.joined", { date: format(l.poster.createdAt, "MMM yyyy") })} · {t("admin.prior", { count: l.poster.priorListings })}
        </p>
        {l.rejectReason && <p className="mt-1 text-xs text-red-800">{l.rejectReason}</p>}
        {l.status === "active" && (
          <a href={`/sales/${l.id}`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline">
            {t("admin.view")} →
          </a>
        )}
      </div>
    </div>
  )
}
