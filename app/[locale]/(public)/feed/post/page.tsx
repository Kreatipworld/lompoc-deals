import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { FeedPostForm } from "./feed-post-form"

export const metadata = {
  title: "Post to the Lompoc Feed",
  description: "Share something for sale or a neighborhood announcement.",
}

export default async function FeedPostPage({
  searchParams,
}: {
  searchParams?: { type?: string }
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login?next=/feed/post")
  }
  const initialType =
    searchParams?.type === "info" || searchParams?.type === "for_sale"
      ? searchParams.type
      : "for_sale"

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Post to the Lompoc Feed
      </h1>
      <p className="mt-2 text-muted-foreground">
        An admin will review your post within 24h before it goes live.
      </p>
      <FeedPostForm initialType={initialType} />
    </main>
  )
}
