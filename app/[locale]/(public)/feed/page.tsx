import { Link } from "@/i18n/navigation"
import { Sparkles } from "lucide-react"
import { getFeedItems, type FeedDisplayItem } from "@/lib/feed-queries"
import { FeedExplorer } from "@/components/feed-explorer"
import { getTranslations } from "next-intl/server"
import { pageAlternates } from "@/lib/seo"

// The feed is live data (events sync daily, deals expire). Without this the
// page is frozen at build time — one failed stream at build = empty tab until
// the next deploy.
export const revalidate = 300

export async function generateMetadata() {
  const t = await getTranslations("feed")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: pageAlternates("/feed"),
  }
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: { type?: string; hood?: string }
}) {
  const t = await getTranslations("feed")
  const items: FeedDisplayItem[] = await getFeedItems({ limit: 120 })

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
        <FeedExplorer
          items={items}
          initialType={searchParams?.type ?? ""}
          initialHood={searchParams?.hood ?? ""}
        />
      </div>

    </main>
  )
}
