"use client"

import dynamic from "next/dynamic"

const BusinessMap = dynamic(
  () => import("@/components/business-map").then((m) => m.BusinessMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
        Loading map…
      </div>
    ),
  }
)

export function BusinessMapLoader({
  lat,
  lng,
  name,
}: {
  lat: number
  lng: number
  name: string
}) {
  return <BusinessMap lat={lat} lng={lng} name={name} />
}
