"use client"

import { useState, useCallback } from "react"
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox"
import { Link } from "@/i18n/navigation"
import { MapPin, Clock } from "lucide-react"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const LOMPOC_CENTER = { longitude: -120.4579, latitude: 34.6391 }

export interface GarageSaleLite {
  id: number
  address: string
  lat: number | null
  lng: number | null
  description: string
  startDate: string
  endDate: string
  startTime: string | null
  endTime: string | null
  itemCategories: string[] | null
}

function GaragePin({ selected }: { selected?: boolean }) {
  return (
    <div
      className={`relative flex items-center justify-center transition-transform duration-200 ${selected ? "scale-125" : "hover:scale-110"}`}
    >
      {selected && (
        <div
          className="absolute rounded-full animate-ping opacity-30 bg-orange-500"
          style={{ width: 44, height: 44, top: -4, left: -4 }}
        />
      )}
      <svg
        viewBox="0 0 36 50"
        width="36"
        height="50"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: `drop-shadow(0 3px 6px rgba(0,0,0,${selected ? "0.45" : "0.30"}))` }}
      >
        <path
          d="M18 0 C8 0 0 8 0 18 C0 31 18 50 18 50 C18 50 36 31 36 18 C36 8 28 0 18 0 Z"
          fill="#f97316"
        />
        <circle cx="18" cy="18" r="10" fill="white" fillOpacity="0.92" />
        {/* Tag icon */}
        <path d="M13 13 L23 13 L23 20 L18 25 L13 20 Z" fill="#f97316" />
        <circle cx="21" cy="15" r="1.5" fill="white" />
      </svg>
    </div>
  )
}

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString("en-US", { ...opts, weekday: "short" })
  }
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`
}

export function GarageSalesMap({ sales }: { sales: GarageSaleLite[] }) {
  const [selected, setSelected] = useState<GarageSaleLite | null>(null)

  const handleMapClick = useCallback(() => {
    setSelected(null)
  }, [])

  const mappable = sales.filter((s) => s.lat != null && s.lng != null)

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        ...LOMPOC_CENTER,
        zoom: 13,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      onClick={handleMapClick}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />

      {mappable.map((sale) => (
        <Marker
          key={sale.id}
          longitude={sale.lng!}
          latitude={sale.lat!}
          anchor="bottom"
        >
          <div
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              setSelected(sale)
            }}
          >
            <GaragePin selected={selected?.id === sale.id} />
          </div>
        </Marker>
      ))}

      {selected && selected.lat != null && selected.lng != null && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          anchor="bottom"
          offset={52}
          onClose={() => setSelected(null)}
          closeButton={true}
          closeOnClick={false}
        >
          <div style={{ minWidth: 190, maxWidth: 240 }} className="text-sm">
            <div className="flex items-start gap-1 mb-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-orange-500" />
              <span className="font-semibold leading-tight line-clamp-2">{selected.address}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{formatDateRange(selected.startDate, selected.endDate)}</span>
              {selected.startTime && (
                <span>· {selected.startTime}{selected.endTime ? `–${selected.endTime}` : ""}</span>
              )}
            </div>
            {selected.itemCategories && selected.itemCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selected.itemCategories.slice(0, 3).map((cat) => (
                  <span key={cat} className="rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[11px] capitalize text-orange-700">
                    {cat}
                  </span>
                ))}
              </div>
            )}
            <Link
              href={`/garage-sales/${selected.id}`}
              className="text-xs font-medium text-orange-600 hover:underline"
            >
              View details →
            </Link>
          </div>
        </Popup>
      )}
    </Map>
  )
}

export function GarageSalesMapLoader({ sales }: { sales: GarageSaleLite[] }) {
  return <GarageSalesMap sales={sales} />
}
