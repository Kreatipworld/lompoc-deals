import { Link } from "@/i18n/navigation"
import { getFeedItems, type FeedDisplayItem } from "@/lib/feed-queries"
import { FeedExplorer } from "@/components/feed-explorer"
import { PageHeader } from "@/components/page-header"
import { PAGE_CONTAINER } from "@/lib/layout-constants"
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
      <PageHeader title={t("heading")} meta={t("itemCount", { count: items.length })}>
        <Link
          href="/feed/post"
          className="inline-flex h-11 flex-shrink-0 items-center gap-1.5 rounded-full bg-gold px-5 text-sm font-semibold text-gold-foreground shadow-sm transition-transform hover:-translate-y-0.5"
        >
          {t("postLink")}
        </Link>
      </PageHeader>

      {/* ── FEED — content first ─────────────────────────────────────── */}
      <div className={`${PAGE_CONTAINER} py-8`}>
        <FeedExplorer items={items} initialType={searchParams?.type ?? ""} />
      </div>

    </main>
  )
}
