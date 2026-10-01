import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Search, ArrowUp, ArrowDown, Minus, KeyRound, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SafeImage } from "@/components/safe-image"
import {
  hasGscData,
  kpiWindow,
  latestGscDate,
  memberBusinessOptions,
  opportunities,
  pagePath,
  pctChange,
  topPages,
  topQueries,
  trackedKeywordRows,
  type Kpis,
  type TrackedKeywordRow,
} from "@/lib/keyword-positions"
import { addTrackedKeywordAction, removeTrackedKeywordAction } from "@/lib/keyword-actions"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.seo")
  return { title: t("metaTitle") }
}

type T = Awaited<ReturnType<typeof getTranslations<"admin.seo">>>

const fmt = (n: number) => n.toLocaleString("en-US")
const pos = (p: number | null) => (p == null ? null : p.toFixed(1))

/**
 * Google positions: Search Console numbers for the town and for each member.
 * Order: KPIs → tracked keywords (with add/remove) → opportunities (5–15) →
 * top queries + pages. Empty state names the two env vars when nothing has
 * been pulled yet. docs/superpowers/specs/2026-09-30-keyword-positions-design.md
 */
export default async function AdminSeoPage() {
  const t = await getTranslations("admin.seo")
  const present = await hasGscData()
  const [kpis, tracked, opps, queries, pages, members, latest] = await Promise.all([
    present ? kpiWindow(28) : null,
    trackedKeywordRows(),
    present ? opportunities() : [],
    present ? topQueries(28) : [],
    present ? topPages(28) : [],
    memberBusinessOptions(),
    present ? latestGscDate() : null,
  ])

  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 font-display text-3xl font-semibold tracking-tight">
          <Search className="h-7 w-7 text-primary" /> {t("heading")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subheading")}</p>
        {latest && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("latestData", { date: latest })} · {t("lag")}
          </p>
        )}
      </header>

      {!present && (
        <section className="rounded-3xl border border-dashed bg-muted/30 px-6 py-8" data-seo-empty>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <KeyRound className="h-5 w-5 text-primary" /> {t("emptyTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("emptyBody")}</p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">GSC_SERVICE_ACCOUNT_JSON</code> — {t("emptyEnv1")}
            </li>
            <li>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">GSC_SITE_URL</code> — {t("emptyEnv2")}
            </li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">{t("emptyStep")}</p>
        </section>
      )}

      {kpis && (
        <section>
          <h2 className="font-display text-xl font-semibold">{t("kpisHeading")}</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiTile label={t("kpiClicks")} value={fmt(kpis.current.clicks)} change={pctChange(kpis.current.clicks, kpis.previous.clicks)} t={t} />
            <KpiTile label={t("kpiImpressions")} value={fmt(kpis.current.impressions)} change={pctChange(kpis.current.impressions, kpis.previous.impressions)} t={t} />
            <KpiTile label={t("kpiPosition")} value={pos(kpis.current.position) ?? "—"} change={positionChange(kpis.current, kpis.previous)} lowerIsBetter t={t} />
            <KpiTile label={t("kpiQueries")} value={fmt(kpis.current.queries)} change={pctChange(kpis.current.queries, kpis.previous.queries)} t={t} />
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-xl font-semibold">
          {t("trackedHeading")} <span className="text-muted-foreground">({tracked.length})</span>
        </h2>
        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">{t("trackedSub")}</p>

        <form action={addTrackedKeywordAction} className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <label className="text-xs font-medium">
            {t("addKeyword")}
            <input type="text" name="keyword" required maxLength={120} placeholder={t("addKeywordPlaceholder")} className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-normal" />
          </label>
          <label className="text-xs font-medium">
            {t("addBusiness")}
            <select name="businessId" defaultValue="" className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-sm font-normal">
              <option value="">{t("addNoBusiness")}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            {t("addTargetPath")}
            <input type="text" name="targetPath" maxLength={300} placeholder={t("addTargetPlaceholder")} className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-normal" />
          </label>
          <Button type="submit" size="sm" className="h-9">
            {t("addSubmit")}
          </Button>
        </form>

        {tracked.length === 0 ? (
          <p className="mt-3 rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">{t("noTracked")}</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">{t("colKeyword")}</th>
                  <th className="px-3 py-2">{t("colBusiness")}</th>
                  <th className="px-3 py-2">{t("colBestPage")}</th>
                  <th className="px-3 py-2 text-right">{t("colPosition")}</th>
                  <th className="px-3 py-2 text-right">{t("colDelta")}</th>
                  <th className="px-3 py-2 text-right">{t("colImpressions")}</th>
                  <th className="px-3 py-2 text-right">{t("colClicks")}</th>
                  <th className="px-3 py-2">{t("colTrend")}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {tracked.map((row) => (
                  <KeywordRow key={row.id} row={row} t={t} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {present && (
        <section>
          <h2 className="font-display text-xl font-semibold">
            {t("oppHeading")} <span className="text-muted-foreground">({opps.length})</span>
          </h2>
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">{t("oppSub")}</p>
          {opps.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("noOpp")}</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-2xl border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">{t("colQuery")}</th>
                    <th className="px-3 py-2">{t("colBestPage")}</th>
                    <th className="px-3 py-2 text-right">{t("colPos")}</th>
                    <th className="px-3 py-2 text-right">{t("colImpressions")}</th>
                    <th className="px-3 py-2 text-right">{t("colClicks")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {opps.map((o) => (
                    <tr key={o.query}>
                      <td className="px-3 py-2 font-medium">{o.query}</td>
                      <td className="px-3 py-2">
                        <PageLink url={o.bestPage} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{o.position.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(o.impressions)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(o.clicks)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {present && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <h2 className="font-display text-xl font-semibold">{t("topQueriesHeading")}</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">{t("colQuery")}</th>
                    <th className="px-3 py-2 text-right">{t("colClicks")}</th>
                    <th className="px-3 py-2 text-right">{t("colImpressions")}</th>
                    <th className="px-3 py-2 text-right">{t("colPos")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {queries.map((q) => (
                    <tr key={q.query}>
                      <td className="px-3 py-2">{q.query}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(q.clicks)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(q.impressions)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{q.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold">{t("topPagesHeading")}</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">{t("colPage")}</th>
                    <th className="px-3 py-2 text-right">{t("colClicks")}</th>
                    <th className="px-3 py-2 text-right">{t("colImpressions")}</th>
                    <th className="px-3 py-2 text-right">{t("colPos")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pages.map((p) => (
                    <tr key={p.page}>
                      <td className="max-w-[260px] truncate px-3 py-2">
                        <PageLink url={p.page} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(p.clicks)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(p.impressions)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

/** Position Δ as a signed % where a LOWER position is the improvement. */
function positionChange(cur: Kpis, prev: Kpis): number | null {
  if (cur.position == null || prev.position == null) return null
  return pctChange(cur.position, prev.position)
}

function KpiTile({ label, value, change, lowerIsBetter = false, t }: { label: string; value: string; change: number | null; lowerIsBetter?: boolean; t: T }) {
  const good = change == null ? null : lowerIsBetter ? change < 0 : change > 0
  const flat = change != null && Math.abs(change) < 0.05
  return (
    <div className="flex flex-col gap-1 rounded-2xl border bg-card p-4 shadow-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-display text-3xl font-bold tracking-tight tabular-nums">{value}</span>
      <span className={`text-xs tabular-nums ${change == null || flat ? "text-muted-foreground" : good ? "text-green-700" : "text-red-700"}`}>
        {change == null ? t("noPrev") : `${change > 0 ? "+" : ""}${change.toFixed(0)}%`}
      </span>
    </div>
  )
}

function DeltaCell({ delta }: { delta: number | null }) {
  if (delta == null) return <span className="text-muted-foreground">—</span>
  if (Math.abs(delta) < 0.05)
    return (
      <span className="inline-flex items-center gap-0.5 text-muted-foreground">
        <Minus className="h-3 w-3" /> 0.0
      </span>
    )
  // Position number fell = moved up the page = green.
  const up = delta < 0
  return (
    <span className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${up ? "text-green-700" : "text-red-700"}`}>
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta).toFixed(1)}
    </span>
  )
}

/** 28 bars, oldest first; taller = better (closer to position 1). Gaps = not shown that day. */
function PositionSparkline({ points }: { points: (number | null)[] }) {
  const shown = points.filter((p): p is number => p != null)
  if (shown.length === 0) return <span className="text-xs text-muted-foreground">—</span>
  const worst = Math.max(10, ...shown)
  return (
    <div className="flex h-7 items-end gap-[1px]" aria-hidden>
      {points.map((p, i) => (
        <div
          key={i}
          className={`w-[3px] flex-shrink-0 rounded-sm ${p == null ? "bg-muted" : "bg-primary"}`}
          style={{ height: p == null ? "2px" : `${Math.max(3, (1 - (p - 1) / worst) * 28)}px`, opacity: p == null ? 0.5 : 0.55 + 0.45 * (1 - (p - 1) / worst) }}
          title={p == null ? undefined : p.toFixed(1)}
        />
      ))}
    </div>
  )
}

function PageLink({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline" title={url}>
      {pagePath(url)}
    </a>
  )
}

function KeywordRow({ row, t }: { row: TrackedKeywordRow; t: T }) {
  return (
    <tr data-tracked-keyword={row.id}>
      <td className="px-3 py-2 font-medium">
        {row.keyword}
        {row.targetPath && (
          <a href={row.targetPath} target="_blank" rel="noreferrer" className="block text-[11px] font-normal text-muted-foreground underline-offset-4 hover:underline">
            {row.targetPath}
          </a>
        )}
      </td>
      <td className="px-3 py-2">
        {row.business ? (
          <a href={`/biz/${row.business.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:underline">
            {row.business.logoUrl ? (
              <SafeImage src={row.business.logoUrl} alt="" className="h-6 w-6 rounded-full object-cover" optWidth={64} />
            ) : (
              <span className="h-6 w-6 rounded-full bg-primary/[0.08]" />
            )}
            <span className="max-w-[160px] truncate">{row.business.name}</span>
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">{t("townWide")}</span>
        )}
      </td>
      <td className="max-w-[220px] truncate px-3 py-2">{row.bestPage ? <PageLink url={row.bestPage} /> : <span className="text-xs text-muted-foreground">{t("notShown")}</span>}</td>
      <td className="px-3 py-2 text-right tabular-nums">{pos(row.position7d) ?? <span className="text-muted-foreground">{t("noData")}</span>}</td>
      <td className="px-3 py-2 text-right">
        <DeltaCell delta={row.delta7d} />
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{fmt(row.impressions28d)}</td>
      <td className="px-3 py-2 text-right tabular-nums">{fmt(row.clicks28d)}</td>
      <td className="px-3 py-2">
        <PositionSparkline points={row.daily} />
      </td>
      <td className="px-3 py-2 text-right">
        <form action={removeTrackedKeywordAction}>
          <input type="hidden" name="id" value={row.id} />
          <Button type="submit" size="sm" variant="ghost" className="h-7 px-2 text-destructive" aria-label={t("remove")} title={t("remove")}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </form>
      </td>
    </tr>
  )
}
