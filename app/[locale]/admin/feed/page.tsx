import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { auth } from "@/auth"
import { getPendingFeedPosts } from "@/lib/feed-queries"
import {
  approveFeedPostAction,
  rejectFeedPostAction,
  featureFeedPostAction,
} from "@/lib/admin-feed-actions"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("feedAdmin")
  return {
    title: t("metaTitle"),
  }
}

export default async function AdminFeedPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") {
    redirect("/login")
  }

  const t = await getTranslations("feedAdmin")
  const pending = await getPendingFeedPosts()

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pending.length === 0
            ? t("emptyState")
            : t("queueCount", { count: pending.length })}
        </p>
      </header>

      <ul className="space-y-4">
        {pending.map(({ post, poster }) => {
          const photos = Array.isArray(post.photos) ? (post.photos as string[]) : []
          return (
            <li key={post.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex rounded-full border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                    {post.type === "for_sale" ? t("typeForSale") : t("typeInfo")}
                  </span>
                  <h2 className="mt-1.5 text-lg font-semibold">{post.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {t("byAuthor", {
                      name: poster?.name ?? poster?.email ?? "unknown",
                      date: post.createdAt.toLocaleString(),
                    })}
                  </p>
                </div>
                {post.priceCents !== null && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">
                    {post.priceCents === 0
                      ? "Free"
                      : `$${(post.priceCents / 100).toFixed(2)}`}
                  </span>
                )}
              </div>

              {photos.length > 0 && (
                <div className="mb-3 flex gap-2 overflow-x-auto">
                  {photos.map((url, i) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="h-24 w-24 shrink-0 rounded-lg object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}

              {post.description && (
                <p className="mb-3 whitespace-pre-line text-sm text-foreground">
                  {post.description}
                </p>
              )}

              {post.address && (
                <p className="mb-3 text-xs text-muted-foreground">
                  {t("addressMarker")}{" "}
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(post.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {post.address}
                  </a>
                </p>
              )}

              <div className="flex flex-wrap gap-2 border-t pt-3">
                <form action={approveFeedPostAction}>
                  <input type="hidden" name="feedPostId" value={post.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                  >
                    {t("buttonApprove")}
                  </button>
                </form>

                <form action={featureFeedPostAction}>
                  <input type="hidden" name="feedPostId" value={post.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    {t("buttonFeature")}
                  </button>
                </form>

                <details className="ml-auto">
                  <summary className="cursor-pointer rounded-full border bg-muted px-4 py-1.5 text-xs font-semibold hover:bg-background">
                    {t("buttonReject")}
                  </summary>
                  <form action={rejectFeedPostAction} className="mt-2 space-y-2 rounded-lg border p-3">
                    <input type="hidden" name="feedPostId" value={post.id} />
                    <textarea
                      name="reason"
                      required
                      placeholder={t("textareaPlaceholder")}
                      rows={2}
                      className="block w-full rounded border px-2 py-1 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      {t("buttonConfirmReject")}
                    </button>
                  </form>
                </details>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="mt-8 text-xs text-muted-foreground">
        <Link href="/admin" className="underline">
          {t("backToAdmin")}
        </Link>
      </p>
    </main>
  )
}
