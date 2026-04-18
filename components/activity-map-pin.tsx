"use client"

import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox"
import { useState } from "react"
import "mapbox-gl/dist/mapbox-gl.css"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export default function ActivityMapPin({
  lat,
  lng,
  title,
}: {
  lat: number
  lng: number
  title: string
}) {
  const [showPopup, setShowPopup] = useState(false)

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{ longitude: lng, latitude: lat, zoom: 14 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      scrollZoom={false}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />
      <Marker longitude={lng} latitude={lat} anchor="bottom">
        <div
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); setShowPopup(true) }}
        >
          <svg
            viewBox="0 0 32 44"
            width="36"
            height="48"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}
          >
            <path
              d="M16 0 C7 0 0 7 0 16 C0 27 16 44 16 44 C16 44 32 27 32 16 C32 7 25 0 16 0 Z"
              fill="hsl(142 72% 38%)"
            />
            <circle cx="16" cy="16" r="7" fill="white" />
            <circle cx="16" cy="16" r="3" fill="hsl(142 72% 38%)" />
          </svg>
        </div>
      </Marker>
      {showPopup && (
        <Popup
          longitude={lng}
          latitude={lat}
          anchor="bottom"
          offset={52}
          onClose={() => setShowPopup(false)}
          closeOnClick={false}
        >
          <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
        </Popup>
      )}
    </Map>
  )
}
