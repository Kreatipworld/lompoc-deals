"use client"

import { useState, useRef, useEffect } from "react"
import { Search, X } from "lucide-react"
import type { POI } from "@/lib/map-pois"
import { CATEGORY_MAP } from "@/lib/map-categories"

interface SearchBoxProps {
  query: string
  results: POI[]
  onChange: (q: string) => void
  onSelect: (poi: POI) => void
}

export function SearchBox({ query, results, onChange, onSelect }: SearchBoxProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <div className="flex items-center gap-2 rounded-xl bg-white/85 px-3 py-2 shadow-lg backdrop-blur-md ring-1 ring-black/5">
        <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
        <input
          type="text"
          placeholder="Search places…"
          value={query}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
        />
        {query && (
          <button
            onClick={() => {
              onChange("")
              setOpen(false)
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5">
          {results.map((poi) => {
            const cat = CATEGORY_MAP[poi.category]
            const Icon = cat.icon
            return (
              <button
                key={poi.id}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                onClick={() => {
                  onSelect(poi)
                  setOpen(false)
                }}
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: cat.color }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-gray-900">
                    {poi.name}
                  </div>
                  <div className="truncate text-xs text-gray-400">{cat.name}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
