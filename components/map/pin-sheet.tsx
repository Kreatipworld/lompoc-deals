"use client"

import { X } from "lucide-react"

/**
 * Phone replacement for a floating Mapbox popup: the same card content, pinned
 * to the bottom of the map container so it is always fully visible — never
 * clipped by the container edge, never hidden behind chips or hero text.
 * The parent must be `relative`; the map eases the pin up so it stays in view.
 */
export function PinSheet({ onClose, children, closeLabel = "Close" }: { onClose: () => void; children: React.ReactNode; closeLabel?: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-2" data-map-sheet>
      <div className="pointer-events-auto relative w-full max-w-sm rounded-2xl bg-white p-3 pr-10 text-gray-900 shadow-2xl ring-1 ring-black/5 lompoc-popup-content" style={{ animation: "popupEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
        <button type="button" onClick={onClose} aria-label={closeLabel} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}
