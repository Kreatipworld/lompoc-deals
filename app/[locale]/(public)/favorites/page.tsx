import { redirect } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { getViewer } from "@/lib/viewer"
import { getFavoritedDeals } from "@/lib/queries"
import { DealGrid } from "@/components/deal-card"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "favorites" })
  return { title: t("metaTitle") }
}

export default async function FavoritesPage() {
  const viewer = await getViewer()
  if (!viewer.isAuthed) {
    redirect("/login?from=/favorites")
  }

  if (!viewer.isLocal) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Favorites</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Favorites are only available for personal accounts. You&apos;re signed in
          as a {viewer.isAdmin ? "admin" : "business"} account.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Back to feed
        </Link>
      </div>
    )
  }

  const deals = await getFavoritedDeals(viewer.userId!)

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">My favorites</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {deals.length} saved {deals.length === 1 ? "deal" : "deals"}
        </p>
      </section>

      <section>
        {deals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t saved any deals yet. Click the heart on any deal to
            add it here.
          </p>
        ) : (
          <DealGrid deals={deals} viewer={viewer} fromPath="/favorites" />
        )}
      </section>
    </div>
  )
}
