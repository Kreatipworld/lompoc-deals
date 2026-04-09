"use client"

import dynamic from "next/dynamic"
import type { MapBusiness, MapActivity } from "@/lib/queries"

const LompocMap = dynamic(
  () => import("@/components/lompoc-map").then((m) => m.LompocMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
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
