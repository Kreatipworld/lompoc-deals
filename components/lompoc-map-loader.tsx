"use client"

import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"

function MapLoading() {
  const tu = useTranslations("hoursUi")
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
      {tu("loadingMap")}
    </div>
  )
}
import type { MapBusiness, MapActivity } from "@/lib/queries"

const LompocMap = dynamic(
  () => import("@/components/lompoc-map").then((m) => m.LompocMap),
  {
    ssr: false,
    loading: () => <MapLoading />,
  }
)

export function LompocMapLoader({
  businesses,
  activities = [],
}: {
  businesses: MapBusiness[]
  activities?: MapActivity[]
}) {
  return <LompocMap businesses={businesses} activities={activities} />
}
