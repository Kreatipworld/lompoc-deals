"use client"

import { useState } from "react"
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox"
import { usePhone } from "@/lib/use-phone"
import { PinSheet } from "@/components/map/pin-sheet"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

/**
 * A single-pin map (business profile, home, garage sale). When `card` is given,
 * tapping the pin shows it — a Popup on desktop, a bottom sheet on phones — so
 * every map with a pin shows the full card on tap (standing rule, Sep 15 2026).
 */
export function BusinessMap({
  lat,
  lng,
  name,
  card,
  closeLabel,
}: {
  lat: number
  lng: number
  name: string
  card?: React.ReactNode
  closeLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const isPhone = usePhone()
  return (
    <div className="relative h-full w-full">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: lng, latitude: lat, zoom: 15 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        scrollZoom={false}
        attributionControl={false}
        onClick={() => setOpen(false)}
      >
        <NavigationControl position="top-right" />
        <Marker longitude={lng} latitude={lat} anchor="bottom">
          <div
            className={card ? "cursor-pointer" : undefined}
            role={card ? "button" : undefined}
            tabIndex={card ? 0 : undefined}
            aria-label={name}
            onClick={(e) => {
              e.stopPropagation()
              if (card) setOpen((o) => !o)
            }}
            onKeyDown={(e) => {
              if (card && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault()
                setOpen((o) => !o)
              }
            }}
          >
            <svg
              viewBox="0 0 32 44"
              width="36"
              height="48"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}
              aria-hidden
            >
              <path
                d="M16 0 C7 0 0 7 0 16 C0 27 16 44 16 44 C16 44 32 27 32 16 C32 7 25 0 16 0 Z"
                fill="hsl(258 65% 55%)"
              />
              <circle cx="16" cy="16" r="7" fill="white" />
              <circle cx="16" cy="16" r="3" fill="hsl(258 65% 55%)" />
            </svg>
          </div>
        </Marker>
        {card && open && !isPhone && (
          <Popup longitude={lng} latitude={lat} anchor="bottom" offset={48} onClose={() => setOpen(false)} closeButton closeOnClick={false} maxWidth="280px">
            {card}
          </Popup>
        )}
      </Map>
      {card && open && isPhone && (
        <PinSheet onClose={() => setOpen(false)} closeLabel={closeLabel}>
          {card}
        </PinSheet>
      )}
    </div>
  )
}
