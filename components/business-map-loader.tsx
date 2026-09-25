"use client"

import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"

function MapLoading() {
  const tu = useTranslations("hoursUi")
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
      {tu("loadingMap")}
    </div>
  )
}

const BusinessMap = dynamic(
  () => import("@/components/business-map").then((m) => m.BusinessMap),
  {
    ssr: false,
    loading: () => <MapLoading />,
  }
)

export function BusinessMapLoader({
  lat,
  lng,
  name,
  card,
  closeLabel,
}: {
  lat: number
  lng: number
  name: string
  /** Shown on pin tap (popup on desktop, bottom sheet on phones). */
  card?: React.ReactNode
  closeLabel?: string
}) {
  return <BusinessMap lat={lat} lng={lng} name={name} card={card} closeLabel={closeLabel} />
}
