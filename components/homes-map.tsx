"use client"

import { useState, useCallback, useMemo } from "react"
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox"
import { Link } from "@/i18n/navigation"
import { useLocale } from "next-intl"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const LOMPOC_CENTER = { longitude: -120.4579, latitude: 34.6391 }

export type HomePin = {
  id: number
  title: string
  priceCents: number
  type: "for-sale" | "for-rent"
  lat: number
  lng: number
  imageUrl: string | null
}

function price(cents: number, type: HomePin["type"], intl: string) {
  const s = `$${(cents / 100).toLocaleString(intl, { maximumFractionDigits: 0 })}`
  return type === "for-rent" ? `${s}/mo` : s
}

function Pin({ type, selected }: { type: HomePin["type"]; selected: boolean }) {
  const color = type === "for-sale" ? "#650c75" : "#0b992f"
  return (
    <svg
      viewBox="0 0 36 50"
      width={selected ? 42 : 34}
      height={selected ? 58 : 47}
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.35))", transition: "width .15s, height .15s" }}
    >
      <path d="M18 0 C8 0 0 8 0 18 C0 31 18 50 18 50 C18 50 36 31 36 18 C36 8 28 0 18 0 Z" fill={color} />
      <circle cx="18" cy="18" r="10" fill="white" fillOpacity="0.94" />
      {/* house */}
      <path d="M11 19 L18 12 L25 19 V25 H20 V21 H16 V25 H11 Z" fill={color} />
    </svg>
  )
}

export function HomesMap({ homes, labels }: { homes: HomePin[]; labels: { forSale: string; forRent: string } }) {
  const [selected, setSelected] = useState<HomePin | null>(null)
  const locale = useLocale()
  const intl = locale === "es" ? "es-US" : "en-US"
  const center = useMemo(() => {
    if (!homes.length) return LOMPOC_CENTER
    return {
      longitude: homes.reduce((a, h) => a + h.lng, 0) / homes.length,
      latitude: homes.reduce((a, h) => a + h.lat, 0) / homes.length,
    }
  }, [homes])
  const onMapClick = useCallback(() => setSelected(null), [])

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{ ...center, zoom: homes.length > 1 ? 12.6 : 13.4 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      onClick={onMapClick}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />
      {homes.map((h) => (
        <Marker key={h.id} longitude={h.lng} latitude={h.lat} anchor="bottom">
          <div
            className="cursor-pointer"
            title={h.title}
            onClick={(e) => {
              e.stopPropagation()
              setSelected(h)
            }}
          >
            <Pin type={h.type} selected={selected?.id === h.id} />
          </div>
        </Marker>
      ))}
      {selected && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          anchor="bottom"
          offset={50}
          onClose={() => setSelected(null)}
          closeButton
          closeOnClick={false}
          maxWidth="260px"
        >
          <Link href={`/listings/${selected.id}`} className="block">
            {selected.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.imageUrl} alt="" className="mb-2 aspect-[4/3] w-full rounded-lg object-cover" />
            )}
            <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              {selected.type === "for-sale" ? labels.forSale : labels.forRent}
            </div>
            <div className="font-display text-base font-bold leading-tight">{price(selected.priceCents, selected.type, intl)}</div>
            <div className="text-xs text-muted-foreground">{selected.title}</div>
          </Link>
        </Popup>
      )}
    </Map>
  )
}
