"use client"

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Green teardrop pin for activities (distinct from purple business pins)
function activityPin(): L.DivIcon {
  return L.divIcon({
    html: `
      <div class="lompoc-pin">
        <svg viewBox="0 0 32 44" width="36" height="48" xmlns="http://www.w3.org/2000/svg">
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
          <circle cx="16" cy="16" r="7" fill="white"/>
          <circle cx="16" cy="16" r="3" fill="hsl(142 72% 38%)"/>
        </svg>
      </div>
    `,
    className: "lompoc-pin-wrapper",
    iconSize: [36, 48],
    iconAnchor: [18, 46],
    popupAnchor: [0, -42],
  })
}

export default function ActivityMapPin({
  lat,
  lng,
  title,
}: {
  lat: number
  lng: number
  title: string
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={activityPin()}>
        <Popup>{title}</Popup>
      </Marker>
    </MapContainer>
  )
}
