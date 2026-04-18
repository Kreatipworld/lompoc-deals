"use client"

import { X, Star, Navigation, ExternalLink } from "lucide-react"
import type { POI } from "@/lib/map-pois"
import type { Category } from "@/lib/map-categories"
import { formatDistance } from "@/lib/map-utils"

interface MapPopupProps {
  poi: POI
  category: Category
  distanceMiles?: number
  onClose: () => void
}

export function MapPopup({ poi, category, distanceMiles, onClose }: MapPopupProps) {
  const Icon = category.icon
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`

  return (
    <div
      className="relative w-72 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      style={{
        animation: "popupEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      {/* Category color bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: category.color }} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
        aria-label="Close popup"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="p-4">
        {/* Category badge */}
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: category.color }}
          >
            <Icon className="h-3 w-3" />
            {category.name}
          </div>
          {poi.rating && (
            <div className="ml-auto flex items-center gap-1 pr-8">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-gray-700">{poi.rating}</span>
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="mt-2.5 text-base font-bold leading-tight text-gray-900">
          {poi.name}
        </h3>

        {/* Highlight */}
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{poi.highlight}</p>

        {/* Meta row */}
        <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
          {poi.price && (
            <span className="font-semibold text-gray-700">{poi.price}</span>
          )}
          {poi.type && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {poi.type}
            </span>
          )}
          {distanceMiles !== undefined && (
            <span className="ml-auto text-xs text-gray-400">
              {formatDistance(distanceMiles)} from center
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Navigation className="h-3.5 w-3.5" />
            Directions
          </a>
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: category.color }}
            onClick={() => {
              // Scroll to sidebar item if it exists
              document.getElementById(`poi-${poi.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}
