"use client"

import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import type { FeedDisplayItem } from "@/lib/feed-queries"

function MapLoadingFallback() {
  const t = useTranslations("feed")
  return (
    <div className="flex h-[520px] items-center justify-center rounded-2xl border bg-muted text-xs text-muted-foreground">
      {t("mapLoading")}
    </div>
  )
}

const FeedMap = dynamic(
  () => import("@/components/feed-map").then((m) => m.FeedMap),
  {
    ssr: false,
    loading: () => <MapLoadingFallback />,
  }
)

export function GarageSalesMapSection({ items }: { items: FeedDisplayItem[] }) {
  return <FeedMap items={items} />
}
