"use client"

import { MapPin, Star } from "lucide-react"
import type { POI } from "@/lib/map-pois"
import { CATEGORIES, CATEGORY_MAP } from "@/lib/map-categories"
import type { CategoryId } from "@/lib/map-categories"
import { formatDistance } from "@/lib/map-utils"

interface SidebarProps {
  pois: POI[]
  selectedPoi: POI | null
  hoveredPoi: POI | null
  userLocation: { lat: number; lng: number } | null
  distanceMap: Map<string, number>
  onSelect: (poi: POI) => void
}

export function Sidebar({
  pois,
  selectedPoi,
  hoveredPoi,
  userLocation,
  distanceMap,
  onSelect,
}: SidebarProps) {
  // Group by category maintaining order
  const grouped = CATEGORIES.reduce<Record<CategoryId, POI[]>>((acc, cat) => {
    const items = pois.filter((p) => p.category === cat.id)
    if (items.length > 0) acc[cat.id] = items
    return acc
  }, {} as Record<CategoryId, POI[]>)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-white px-4 py-3">
        <p className="text-sm font-semibold text-gray-900">
          {pois.length} places
        </p>
        <p className="text-xs text-gray-400">
          {userLocation ? "Sorted by proximity" : "Click a marker to explore"}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(grouped).map(([catId, items]) => {
          const cat = CATEGORY_MAP[catId as CategoryId]
          const Icon = cat.icon
          return (
            <div key={catId}>
              {/* Category header */}
              <div
                className="sticky top-0 z-10 flex items-center gap-2 border-b bg-white/95 px-4 py-2 backdrop-blur-sm"
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ backgroundColor: cat.color }}
                >
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  {cat.name}
                </span>
                <span className="ml-auto text-xs text-gray-400">{items.length}</span>
              </div>

              {/* Items */}
              {items.map((poi) => {
                const isSelected = selectedPoi?.id === poi.id
                const isHovered = hoveredPoi?.id === poi.id
                const dist = distanceMap.get(poi.id)
                return (
                  <button
                    key={poi.id}
                    id={`poi-${poi.id}`}
                    onClick={() => onSelect(poi)}
                    className={`w-full border-b px-4 py-3 text-left transition-colors duration-150 last:border-0 ${
                      isSelected || isHovered
                        ? "bg-purple-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-150 ${
                          isSelected || isHovered ? "scale-110 shadow-md" : ""
                        }`}
                        style={{
                          backgroundColor: isSelected || isHovered ? cat.color : `${cat.color}20`,
                        }}
                      >
                        <Icon
                          className="h-4 w-4"
                          style={{ color: isSelected || isHovered ? "white" : cat.color }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-gray-900">
                            {poi.name}
                          </span>
                          {isSelected && (
                            <span
                              className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                              style={{ backgroundColor: cat.color }}
                            >
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-gray-400">
                          {poi.highlight}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {poi.rating && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-500">
                              <Star className="h-3 w-3 fill-current" />
                              {poi.rating}
                            </span>
                          )}
                          {poi.price && (
                            <span className="text-xs font-medium text-gray-500">
                              {poi.price}
                            </span>
                          )}
                          {dist !== undefined && (
                            <span className="ml-auto text-xs text-gray-400">
                              {formatDistance(dist)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })}

        {pois.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <MapPin className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">No places match your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
