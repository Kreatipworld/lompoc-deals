import { redirect } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { auth } from "@/auth"
import { getMyFeedPosts } from "@/lib/feed-queries"
import { markSoldAction, extendExpirationAction } from "@/lib/feed-actions"

export const metadata = {
  title: "My Lompoc Feed posts",
}

const STATUS_LABEL = {
  pending: { text: "Pending review", color: "bg-amber-100 text-amber-900 border-amber-200" },
  approved: { text: "Live", color: "bg-green-100 text-green-900 border-green-200" },
  rejected: { text: "Rejected", color: "bg-red-100 text-red-900 border-red-200" },
  expired: { text: "Expired", color: "bg-muted text-muted-foreground border-border" },
  sold: { text: "Sold", color: "bg-blue-100 text-blue-900 border-blue-200" },
} as const

async function markSoldFormAction(formData: FormData) {
  "use server"
  await markSoldAction(formData)
}

async function extendExpirationFormAction(formData: FormData) {
  "use server"
  await extendExpirationAction(formData)
}

export default async function MyFeedPage({
  searchParams,
}: {
  searchParams?: { submitted?: string }
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login?next=/feed/my")
  }
  const userId = parseInt(session.user.id, 10)
  const posts = await getMyFeedPosts(userId)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">My posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your submissions to the Lompoc Feed.
          </p>
        </div>
        <Link
          href="/feed/post"
          className="inline-flex h-10 items-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          + New post
        </Link>
      </header>

      {searchParams?.submitted && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Submitted! An admin will review and approve within 24h.
        </div>
      )}

      {posts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          You haven&apos;t posted anything yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => {
            const status = STATUS_LABEL[post.status]
            return (
              <li key={post.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status.color}`}>
                      {status.text}
                    </span>
                    <h2 className="mt-1.5 truncate text-base font-semibold">{post.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {post.type === "for_sale" ? "For sale" : "Info"} · submitted {post.createdAt.toLocaleDateString()}
                    </p>
                    {post.status === "approved" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Live until {post.expiresAt.toLocaleDateString()}
                      </p>
                    )}
                    {post.status === "rejected" && post.rejectionReason && (
                      <p className="mt-1 text-xs italic text-destructive">
                        Reason: {post.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    {post.status === "approved" && post.type === "for_sale" && (
                      <form action={markSoldFormAction}>
                        <input type="hidden" name="postId" value={post.id} />
                        <button
                          type="submit"
                          className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted"
                        >
                          Mark sold
                        </button>
                      </form>
                    )}
                    {post.status === "approved" && (
                      <form action={extendExpirationFormAction}>
                        <input type="hidden" name="postId" value={post.id} />
                        <button
                          type="submit"
                          className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted"
                        >
                          Still valid
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
