"use client"

import { useCallback, useState } from "react"
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import type { FeedDisplayItem } from "@/lib/feed-queries"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const LOMPOC_CENTER = { longitude: -120.4579, latitude: 34.6391 }

// brand palette per card family (binding per Task 6 brief)
const PIN_COLORS: Record<string, string> = {
  deal: "#650C75",
  garage_sale: "#EFC618",
  event: "#EFC618",
  for_sale: "#0B992F",
  info: "#0B992F",
  new_business: "#0B992F",
  blog: "#0B992F",
}

function Pin({ color, selected }: { color: string; selected: boolean }) {
  return (
    <svg
      viewBox="0 0 36 50"
      width={selected ? 40 : 30}
      height={selected ? 56 : 42}
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `drop-shadow(0 3px 6px rgba(0,0,0,${selected ? "0.45" : "0.30"}))` }}
    >
      <path
        d="M18 0 C8 0 0 8 0 18 C0 31 18 50 18 50 C18 50 36 31 36 18 C36 8 28 0 18 0 Z"
        fill={color}
      />
      <circle cx="18" cy="18" r="8" fill="white" fillOpacity="0.9" />
    </svg>
  )
}

export function FeedMap({ items }: { items: FeedDisplayItem[] }) {
  const t = useTranslations("feed")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const located = items.filter((i) => i.lat !== null && i.lng !== null)
  const hiddenCount = items.length - located.length
  const selected = located.find((i) => i.id === selectedId) ?? null

  const handleMapClick = useCallback(() => {
    setSelectedId(null)
  }, [])

  if (!MAPBOX_TOKEN) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Map view is currently unavailable.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="h-[520px] overflow-hidden rounded-2xl border">
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{ ...LOMPOC_CENTER, zoom: 12.5 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onClick={handleMapClick}
          attributionControl={false}
        >
          <NavigationControl position="top-right" />
          {located.map((item) => (
            <Marker
              key={item.id}
              longitude={item.lng!}
              latitude={item.lat!}
              anchor="bottom"
            >
              <div
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedId(item.id)
                }}
              >
                <Pin color={PIN_COLORS[item.type] ?? "#0B992F"} selected={item.id === selectedId} />
              </div>
            </Marker>
          ))}
          {selected && (
            <Popup
              longitude={selected.lng!}
              latitude={selected.lat!}
              anchor="bottom"
              offset={44}
              onClose={() => setSelectedId(null)}
              closeButton
              closeOnClick={false}
              maxWidth="280px"
            >
              <Link href={selected.href} className="block p-1">
                <p className="text-sm font-semibold leading-snug">{selected.title}</p>
                {selected.badgeText && (
                  <p className="mt-0.5 text-xs font-bold text-primary">{selected.badgeText}</p>
                )}
                {selected.address && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{selected.address}</p>
                )}
              </Link>
            </Popup>
          )}
        </Map>
      </div>
      {hiddenCount > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {t("mapNoLocation", { count: hiddenCount })}
        </p>
      )}
    </div>
  )
}
