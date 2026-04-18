"use client"

import { useState, useRef } from "react"
import { Play, X, ChevronRight } from "lucide-react"
import type { MapRef } from "react-map-gl/mapbox"

const TOUR_STOPS = [
  {
    center: [-120.4579, 34.6391] as [number, number],
    zoom: 13,
    pitch: 0,
    bearing: 0,
    label: "Welcome to Lompoc",
    sublabel: "California's hidden gem valley",
  },
  {
    center: [-120.4498, 34.642] as [number, number],
    zoom: 16,
    pitch: 60,
    bearing: 30,
    label: "The Wine Ghetto",
    sublabel: "17+ tasting rooms, one world-class block",
  },
  {
    center: [-120.419, 34.6689] as [number, number],
    zoom: 15,
    pitch: 50,
    bearing: -20,
    label: "La Purisima Mission",
    sublabel: "Most fully restored mission in California",
  },
  {
    center: [-120.44, 34.65] as [number, number],
    zoom: 14,
    pitch: 45,
    bearing: 10,
    label: "Lompoc Flower Fields",
    sublabel: "Sweet pea & larkspur in bloom",
  },
  {
    center: [-120.5004, 34.5108] as [number, number],
    zoom: 14,
    pitch: 55,
    bearing: -30,
    label: "Jalama Beach",
    sublabel: "Hidden gem surf & camping paradise",
  },
  {
    center: [-120.4579, 34.6391] as [number, number],
    zoom: 12.5,
    pitch: 45,
    bearing: -15,
    label: "Explore Lompoc",
    sublabel: "Your adventure starts here",
  },
]

interface TourButtonProps {
  mapRef: React.RefObject<MapRef | null>
}

export function TourButton({ mapRef }: TourButtonProps) {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function goToStep(index: number) {
    const map = mapRef.current?.getMap()
    if (!map) return
    const stop = TOUR_STOPS[index]
    map.flyTo({
      center: stop.center,
      zoom: stop.zoom,
      pitch: stop.pitch,
      bearing: stop.bearing,
      duration: 3000,
      essential: true,
    })
    setStep(index)
    if (index < TOUR_STOPS.length - 1) {
      timerRef.current = setTimeout(() => goToStep(index + 1), 5000)
    } else {
      timerRef.current = setTimeout(() => {
        setActive(false)
        setStep(0)
      }, 4000)
    }
  }

  function startTour() {
    setActive(true)
    setStep(0)
    goToStep(0)
  }

  function stopTour() {
    clearTimer()
    setActive(false)
    setStep(0)
  }

  if (!active) {
    return (
      <button
        onClick={startTour}
        className="flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-purple-800 hover:shadow-purple-900/40 active:scale-95"
      >
        <Play className="h-4 w-4 fill-white" />
        Take a Tour
      </button>
    )
  }

  const current = TOUR_STOPS[step]
  const progress = ((step + 1) / TOUR_STOPS.length) * 100

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-900/90 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
      <div className="min-w-0">
        <div className="text-sm font-bold">{current.label}</div>
        <div className="text-xs text-gray-400">{current.sublabel}</div>
        {/* Progress bar */}
        <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-purple-400 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-[10px] text-gray-500">
          {step + 1} / {TOUR_STOPS.length}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {step < TOUR_STOPS.length - 1 && (
          <button
            onClick={() => {
              clearTimer()
              goToStep(step + 1)
            }}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs font-medium hover:bg-white/20"
          >
            Skip <ChevronRight className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={stopTour}
          className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs font-medium hover:bg-white/20"
        >
          <X className="h-3 w-3" /> Exit
        </button>
      </div>
    </div>
  )
}
