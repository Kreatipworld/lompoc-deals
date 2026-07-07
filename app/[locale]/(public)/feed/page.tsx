import { Link } from "@/i18n/navigation"
import { Sparkles, ArrowRight } from "lucide-react"
import { getFeedItems, type FeedDisplayItem } from "@/lib/feed-queries"
import { FeedMasonry } from "@/components/feed-masonry"
import { NeighborhoodDemo } from "@/components/neighborhood-demo"
import { getTranslations } from "next-intl/server"

type FeedType = "for_sale" | "info" | "event"

function isFeedType(s: string | undefined): s is FeedType {
  return s === "for_sale" || s === "info" || s === "event"
}

export async function generateMetadata() {
  const t = await getTranslations("feed")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: { type?: string }
}) {
  const t = await getTranslations("feed")
  const typeFilter = isFeedType(searchParams?.type) ? searchParams!.type : undefined
  const items: FeedDisplayItem[] = await getFeedItems()

  const filterLink = (val: FeedType | "all", label: string) => {
    const active = (val === "all" && !typeFilter) || val === typeFilter
    const href = val === "all" ? "/feed" : `/feed?type=${val}`
    return (
      <Link
        key={val}
        href={href}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:bg-accent"
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <main>
      {/* ── HEADER — community photo band ────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-20 overflow-hidden"
          style={{
            backgroundImage: "url('/lompoc-community.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-[hsl(287_81%_14%/0.92)] via-[hsl(287_81%_18%/0.65)] to-[hsl(287_81%_20%/0.25)]"
        />

        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            {t("badge")}
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {t("heading")}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-white/85">
            {t("subheading")}{" "}
            <Link href="/feed/post" className="font-medium text-gold underline underline-offset-4">
              {t("postLink")}
            </Link>
          </p>
        </div>
      </section>

      {/* ── FEED — content first ─────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {filterLink("all", t("filterAll"))}
          {filterLink("for_sale", t("filterForSale"))}
          {filterLink("info", t("filterInfo"))}
          {filterLink("event", t("filterEvents"))}
        </div>

        <FeedMasonry items={items} />
      </div>

      {/* ── HOW IT WORKS — animated storyboard + post CTA ───────────── */}
      <section className="border-t bg-secondary/30 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-success">
              {t("demoEyebrow")}
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t("demoH2")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("demoBody")}</p>
          </div>

          <NeighborhoodDemo
            labels={{
              scenes: [
                { title: t("demoScene1Title"), body: t("demoScene1Body") },
                { title: t("demoScene2Title"), body: t("demoScene2Body") },
                { title: t("demoScene3Title"), body: t("demoScene3Body") },
              ],
              panelLabels: [t("demoPanel1"), t("demoPanel2"), t("demoPanel3")],
              formLabel: t("demoFormLabel"),
              postTyped: t("demoPostTyped"),
              publish: t("demoPublish"),
              published: t("demoPublished"),
              postChip: t("demoPostChip"),
              seenLabel: t("demoSeenLabel"),
              chatMsg1: t("demoChatMsg1"),
              chatMsg2: t("demoChatMsg2"),
              chatMsg3: t("demoChatMsg3"),
              doneChip: t("demoDoneChip"),
            }}
          />

          <div className="mt-10 text-center">
            <Link
              href="/feed/post"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("demoCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
