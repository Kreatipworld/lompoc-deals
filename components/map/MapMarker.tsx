"use client"

import { memo } from "react"
import type { Category } from "@/lib/map-categories"
import type { POI } from "@/lib/map-pois"

interface MapMarkerProps {
  poi: POI
  category: Category
  isSelected: boolean
  isFiltered: boolean // faded out
  index: number
  onClick: (poi: POI) => void
  onHover: (poi: POI | null) => void
}

export const MapMarker = memo(function MapMarker({
  poi,
  category,
  isSelected,
  isFiltered,
  index,
  onClick,
  onHover,
}: MapMarkerProps) {
  const Icon = category.icon

  return (
    <div
      className="relative cursor-pointer group"
      style={{
        // Staggered entrance — handled by parent via CSS animation delay
        animationDelay: `${index * 50}ms`,
        opacity: isFiltered ? 0 : 1,
        transform: isFiltered ? "scale(0.5)" : "scale(1)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
      onClick={() => onClick(poi)}
      onMouseEnter={() => onHover(poi)}
      onMouseLeave={() => onHover(null)}
      tabIndex={0}
      role="button"
      aria-label={`${poi.name} - ${category.name}`}
      onKeyDown={(e) => e.key === "Enter" && onClick(poi)}
    >
      {/* Pulse ring */}
      {(isSelected) && (
        <div
          className="absolute inset-0 -m-1 rounded-full animate-ping"
          style={{ backgroundColor: category.color, opacity: 0.3 }}
        />
      )}
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-200"
        style={{
          boxShadow: `0 0 20px 8px ${category.color}`,
        }}
      />
      {/* Main marker */}
      <div
        className={`relative flex items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform duration-200 ${
          isSelected
            ? "scale-110"
            : "group-hover:scale-125"
        }`}
        style={{
          backgroundColor: category.color,
          width: isSelected ? 44 : 40,
          height: isSelected ? 44 : 40,
          outline: isSelected ? `3px solid ${category.color}` : undefined,
          outlineOffset: isSelected ? "2px" : undefined,
        }}
      >
        <Icon className="text-white" style={{ width: 18, height: 18 }} />
      </div>
      {/* Hover label */}
      <div
        className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-2 py-1 text-xs font-semibold shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ color: category.color }}
      >
        {poi.name}
      </div>
    </div>
  )
})
