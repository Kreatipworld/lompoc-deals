"use client"

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import Link from "next/link"
import type { MapBusiness } from "@/lib/queries"

// Fix for default marker icons in bundlers — Leaflet's default icon URLs
// don't resolve correctly under webpack. Point them at the CDN.
const DefaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const LOMPOC_CENTER: [number, number] = [34.6391, -120.4579]

export function LompocMap({ businesses }: { businesses: MapBusiness[] }) {
  return (
    <MapContainer
      center={LOMPOC_CENTER}
      zoom={13}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {businesses.map((b) => (
        <Marker key={b.id} position={[b.lat, b.lng]}>
          <Popup>
            <div className="space-y-1">
              <div className="font-semibold">{b.name}</div>
              <div className="text-xs text-muted-foreground">
                {b.activeDealCount}{" "}
                {b.activeDealCount === 1 ? "active deal" : "active deals"}
              </div>
              <Link
                href={`/biz/${b.slug}`}
                className="text-xs text-blue-600 underline"
              >
                View profile →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
