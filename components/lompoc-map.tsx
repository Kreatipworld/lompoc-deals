"use client"

import { useState, useCallback, useRef } from "react"
import Map, { Marker, Popup, NavigationControl, type MapRef } from "react-map-gl/mapbox"
import { Link } from "@/i18n/navigation"
import type { MapBusiness, MapActivity } from "@/lib/queries"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const LOMPOC_CENTER = { longitude: -120.4579, latitude: 34.6391 }

function BusinessPin({ hasDeals }: { hasDeals: boolean }) {
  return (
    <svg
      viewBox="0 0 32 44"
      width="36"
      height="48"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}
    >
      <path
        d="M16 0 C7 0 0 7 0 16 C0 27 16 44 16 44 C16 44 32 27 32 16 C32 7 25 0 16 0 Z"
        fill="hsl(258 65% 55%)"
      />
      <circle cx="16" cy="16" r="7" fill="white" />
      {hasDeals && <circle cx="16" cy="16" r="3" fill="hsl(258 65% 55%)" />}
    </svg>
  )
}

function ActivityPin() {
  return (
    <svg
      viewBox="0 0 32 44"
      width="30"
      height="40"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}
    >
      <path
        d="M16 0 C7 0 0 7 0 16 C0 27 16 44 16 44 C16 44 32 27 32 16 C32 7 25 0 16 0 Z"
        fill="hsl(142 72% 38%)"
      />
      <circle cx="16" cy="16" r="6" fill="white" />
      <circle cx="16" cy="16" r="3" fill="hsl(142 72% 38%)" />
    </svg>
  )
}

async function trackPinClick(businessId: number) {
  try {
    await fetch("/api/track/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "map_pin_clicked",
        targetType: "business",
        targetId: businessId,
        props: { from: "map" },
      }),
    })
  } catch {
    // best-effort
  }
}

export function LompocMap({
  businesses,
  activities = [],
}: {
  businesses: MapBusiness[]
  activities?: MapActivity[]
}) {
  const [selectedBusiness, setSelectedBusiness] = useState<MapBusiness | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<MapActivity | null>(null)

  const handleMapClick = useCallback(() => {
    setSelectedBusiness(null)
    setSelectedActivity(null)
  }, [])

  // Owner (Sep 15 2026): "in all the maps, when we click the pin we can see the information."
  // Ease the pin toward the middle so the popup never clips at the container edge (phones).
  const mapRef = useRef<MapRef | null>(null)
  const focus = (lng: number, lat: number) => mapRef.current?.easeTo({ center: [lng, lat], offset: [0, 120], duration: 450 })

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      ref={mapRef}
      initialViewState={{
        ...LOMPOC_CENTER,
        zoom: 14,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      onClick={handleMapClick}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />

      {businesses.map((b) => (
        <Marker
          key={b.id}
          longitude={b.lng}
          latitude={b.lat}
          anchor="bottom"
        >
          <div
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              void trackPinClick(b.id)
              setSelectedActivity(null)
              setSelectedBusiness(b)
              focus(b.lng, b.lat)
            }}
          >
            <BusinessPin hasDeals={b.activeDealCount > 0} />
          </div>
        </Marker>
      ))}

      {activities.map((a) => (
        <Marker
          key={`activity-${a.id}`}
          longitude={a.lng}
          latitude={a.lat}
          anchor="bottom"
        >
          <div
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedBusiness(null)
              setSelectedActivity(a)
              focus(a.lng, a.lat)
            }}
          >
            <ActivityPin />
          </div>
        </Marker>
      ))}

      {selectedBusiness && (
        <Popup
          longitude={selectedBusiness.lng}
          latitude={selectedBusiness.lat}
          anchor="bottom"
          offset={52}
          onClose={() => setSelectedBusiness(null)}
          closeButton={true}
          closeOnClick={false}
        >
          <div className="lompoc-popup-content" style={{ minWidth: 180 }}>
            {selectedBusiness.categoryName && (
              <div className="lompoc-popup-eyebrow">{selectedBusiness.categoryName}</div>
            )}
            <div className="lompoc-popup-name">{selectedBusiness.name}</div>
            {selectedBusiness.address && (
              <div className="lompoc-popup-meta">{selectedBusiness.address}</div>
            )}
            <div className="lompoc-popup-footer">
              <span className="lompoc-popup-deals">
                {selectedBusiness.activeDealCount}{" "}
                {selectedBusiness.activeDealCount === 1 ? "active deal" : "active deals"}
              </span>
              <Link href={`/biz/${selectedBusiness.slug}`} className="lompoc-popup-link">
                View profile →
              </Link>
            </div>
          </div>
        </Popup>
      )}

      {selectedActivity && (
        <Popup
          longitude={selectedActivity.lng}
          latitude={selectedActivity.lat}
          anchor="bottom"
          offset={44}
          onClose={() => setSelectedActivity(null)}
          closeButton={true}
          closeOnClick={false}
        >
          <div className="lompoc-popup-content" style={{ minWidth: 160 }}>
            <div className="lompoc-popup-eyebrow">Things to Do</div>
            <div className="lompoc-popup-name">{selectedActivity.title}</div>
            <div className="lompoc-popup-footer">
              <Link href={`/activities/${selectedActivity.slug}`} className="lompoc-popup-link">
                Learn more →
              </Link>
            </div>
          </div>
        </Popup>
      )}
    </Map>
  )
}
