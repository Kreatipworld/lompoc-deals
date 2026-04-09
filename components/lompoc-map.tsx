"use client"

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Link } from "@/i18n/navigation"
import type { MapBusiness, MapActivity } from "@/lib/queries"

// Custom coral teardrop pin (SVG inside a divIcon).
// Replaces Leaflet's default blue pin entirely.
function coralPin(activeDealCount: number): L.DivIcon {
  const hasDeals = activeDealCount > 0
  return L.divIcon({
    html: `
      <div class="lompoc-pin">
        <svg viewBox="0 0 32 44" width="36" height="48" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
            </filter>
          </defs>
          <path
            d="M16 0 C7 0 0 7 0 16 C0 27 16 44 16 44 C16 44 32 27 32 16 C32 7 25 0 16 0 Z"
            fill="hsl(258 65% 55%)"
            filter="url(#pin-shadow)"
          />
          <circle cx="16" cy="16" r="7" fill="white"/>
          ${
            hasDeals
              ? `<circle cx="16" cy="16" r="3" fill="hsl(258 65% 55%)"/>`
              : ""
          }
        </svg>
      </div>
    `,
    className: "lompoc-pin-wrapper",
    iconSize: [36, 48],
    iconAnchor: [18, 46],
    popupAnchor: [0, -42],
  })
}

// Green teardrop pin for activities — distinct from purple business pins
function activityPin(): L.DivIcon {
  return L.divIcon({
    html: `
      <div class="lompoc-pin">
        <svg viewBox="0 0 32 44" width="30" height="40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="pin-shadow-act" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
            </filter>
          </defs>
          <path
            d="M16 0 C7 0 0 7 0 16 C0 27 16 44 16 44 C16 44 32 27 32 16 C32 7 25 0 16 0 Z"
            fill="hsl(142 72% 38%)"
            filter="url(#pin-shadow-act)"
          />
          <circle cx="16" cy="16" r="6" fill="white"/>
          <circle cx="16" cy="16" r="3" fill="hsl(142 72% 38%)"/>
        </svg>
      </div>
    `,
    className: "lompoc-pin-wrapper",
    iconSize: [30, 40],
    iconAnchor: [15, 38],
    popupAnchor: [0, -35],
  })
}

const LOMPOC_CENTER: [number, number] = [34.6391, -120.4579]

export function LompocMap({
  businesses,
  activities = [],
}: {
  businesses: MapBusiness[]
  activities?: MapActivity[]
}) {
  return (
    <MapContainer
      center={LOMPOC_CENTER}
      zoom={14}
      scrollWheelZoom={true}
      className="h-full w-full"
      attributionControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {businesses.map((b) => (
        <Marker
          key={b.id}
          position={[b.lat, b.lng]}
          icon={coralPin(b.activeDealCount)}
        >
          <Popup className="lompoc-popup">
            <div className="lompoc-popup-content">
              {b.categoryName && (
                <div className="lompoc-popup-eyebrow">{b.categoryName}</div>
              )}
              <div className="lompoc-popup-name">{b.name}</div>
              {b.address && (
                <div className="lompoc-popup-meta">{b.address}</div>
              )}
              <div className="lompoc-popup-footer">
                <span className="lompoc-popup-deals">
                  {b.activeDealCount}{" "}
                  {b.activeDealCount === 1 ? "active deal" : "active deals"}
                </span>
                <Link href={`/biz/${b.slug}`} className="lompoc-popup-link">
                  View profile →
                </Link>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      {activities.map((a) => (
        <Marker
          key={`activity-${a.id}`}
          position={[a.lat, a.lng]}
          icon={activityPin()}
        >
          <Popup className="lompoc-popup">
            <div className="lompoc-popup-content">
              <div className="lompoc-popup-eyebrow">Things to Do</div>
              <div className="lompoc-popup-name">{a.title}</div>
              <div className="lompoc-popup-footer">
                <Link href={`/activities/${a.slug}`} className="lompoc-popup-link">
                  Learn more →
                </Link>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
