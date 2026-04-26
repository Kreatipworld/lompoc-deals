import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { FeedPostForm } from "./feed-post-form"
import { getTranslations } from "next-intl/server"

export async function generateMetadata() {
  const t = await getTranslations("feedPost")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default async function FeedPostPage({
  searchParams,
}: {
  searchParams?: { type?: string }
}) {
  const t = await getTranslations("feedPost")
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
        {t("pageTitle")}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {t("pageSubtitle")}
      </p>
      <FeedPostForm initialType={initialType} />
    </main>
  )
}
