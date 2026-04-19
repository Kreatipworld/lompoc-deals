"use client"

import { useState, useCallback } from "react"
import Map, { Marker, Popup, NavigationControl, Source } from "react-map-gl/mapbox"
import { Star, MapPin, Navigation, BedDouble } from "lucide-react"
import { Link } from "@/i18n/navigation"
import type { Hotel } from "@/lib/hotels-data"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const LOMPOC_CENTER = { longitude: -120.4579, latitude: 34.6400 }

const PRICE_COLOR: Record<string, string> = {
  $: "#059669",   // emerald
  $$: "#d97706",  // amber
  $$$: "#7c3aed", // violet
}

const PRICE_LABEL: Record<string, string> = {
  $: "Budget",
  $$: "Mid-range",
  $$$: "Upscale",
}

function HotelPin({ priceRange, selected }: { priceRange: string; selected?: boolean }) {
  const color = PRICE_COLOR[priceRange] ?? "#7c3aed"
  return (
    <div
      className={`relative flex items-center justify-center transition-transform duration-200 ${selected ? "scale-125" : "hover:scale-110"}`}
    >
      {/* Pulse ring when selected */}
      {selected && (
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ backgroundColor: color, width: 44, height: 44, top: -4, left: -4 }}
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
          fill={color}
        />
        <circle cx="18" cy="18" r="10" fill="white" fillOpacity="0.92" />
        {/* Bed icon */}
        <rect x="10" y="16" width="16" height="8" rx="2" fill={color} />
        <rect x="10" y="12" width="7" height="5" rx="1.5" fill={color} />
        <rect x="19" y="12" width="7" height="5" rx="1.5" fill={color} />
      </svg>
    </div>
  )
}

export function HotelsMap({ hotels }: { hotels: Hotel[] }) {
  const [selected, setSelected] = useState<Hotel | null>(null)

  const handleMapClick = useCallback(() => {
    setSelected(null)
  }, [])

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        ...LOMPOC_CENTER,
        zoom: 12.5,
        pitch: 30,
        bearing: -5,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/outdoors-v12"
      onClick={handleMapClick}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />

      {/* 3D terrain DEM source */}
      <Source
        id="mapbox-dem"
        type="raster-dem"
        url="mapbox://mapbox.mapbox-terrain-dem-v1"
        tileSize={512}
        maxzoom={14}
      />

      {hotels.map((hotel) => (
        <Marker
          key={hotel.slug}
          longitude={hotel.lng}
          latitude={hotel.lat}
          anchor="bottom"
        >
          <div
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              setSelected(hotel)
            }}
            title={hotel.name}
          >
            <HotelPin priceRange={hotel.priceRange} selected={selected?.slug === hotel.slug} />
          </div>
        </Marker>
      ))}

      {selected && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          anchor="bottom"
          offset={54}
          onClose={() => setSelected(null)}
          closeButton={true}
          closeOnClick={false}
          maxWidth="260px"
        >
          <div className="lompoc-popup-content" style={{ minWidth: 220 }}>
            {/* Category + price badge */}
            <div className="lompoc-popup-eyebrow flex items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ background: PRICE_COLOR[selected.priceRange] ?? "#7c3aed" }}
              >
                <BedDouble className="h-2.5 w-2.5" />
                {selected.priceRange} · {PRICE_LABEL[selected.priceRange]}
              </span>
            </div>

            {/* Name */}
            <div className="lompoc-popup-name mt-1">{selected.name}</div>

            {/* Tagline */}
            {selected.tagline && (
              <div className="text-[11px] text-gray-500 italic mb-1">{selected.tagline}</div>
            )}

            {/* Avenue / location context */}
            {selected.avenue && (
              <div className="lompoc-popup-meta flex items-start gap-1">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-violet-500" />
                <span>{selected.avenue}</span>
              </div>
            )}
            {selected.neighborhood && (
              <div className="lompoc-popup-meta flex items-start gap-1 text-gray-400">
                <Navigation className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{selected.neighborhood}</span>
              </div>
            )}

            {/* Rating */}
            <div className="lompoc-popup-meta flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span>{selected.rating.toFixed(1)} / 5</span>
            </div>

            {/* Top amenities */}
            {selected.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {selected.amenities.slice(0, 3).map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}

            {/* Footer actions */}
            <div className="lompoc-popup-footer mt-2 flex items-center gap-3">
              <Link href={`/hotels/${selected.slug}`} className="lompoc-popup-link">
                View details →
              </Link>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-gray-400 hover:text-gray-600 underline"
              >
                Directions
              </a>
            </div>
          </div>
        </Popup>
      )}
    </Map>
  )
}
