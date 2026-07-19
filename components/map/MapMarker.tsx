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
      {/* Main marker — Official Partners get a brand-purple ring, larger size,
          and a gold star so they stand out from the crowd. */}
      <div
        className={`relative flex items-center justify-center rounded-full shadow-lg transition-transform duration-200 ${
          isSelected ? "scale-110" : "group-hover:scale-125"
        }`}
        style={{
          backgroundColor: category.color,
          width: poi.partner ? 50 : isSelected ? 44 : 40,
          height: poi.partner ? 50 : isSelected ? 44 : 40,
          border: poi.partner ? "3px solid #650C75" : "2px solid #ffffff",
          boxShadow: poi.partner
            ? "0 0 0 2px #ffffff, 0 6px 16px -4px rgba(101,12,117,0.55)"
            : undefined,
          outline: isSelected && !poi.partner ? `3px solid ${category.color}` : undefined,
          outlineOffset: isSelected ? "2px" : undefined,
        }}
      >
        <Icon className="text-white" style={{ width: poi.partner ? 22 : 18, height: poi.partner ? 22 : 18 }} />
        {poi.partner && (
          <span
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] leading-none shadow"
            style={{ backgroundColor: "#EFC618", color: "#3a2600" }}
            aria-hidden
          >
            ★
          </span>
        )}
      </div>
      {/* Label — always visible for Partners so they're easy to spot; hover for others */}
      <div
        className={`pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold shadow-md transition-opacity duration-150 ${
          poi.partner ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={
          poi.partner
            ? { backgroundColor: "#650C75", color: "#ffffff" }
            : { backgroundColor: "#ffffff", color: category.color }
        }
      >
        {poi.name}
      </div>
    </div>
  )
})
