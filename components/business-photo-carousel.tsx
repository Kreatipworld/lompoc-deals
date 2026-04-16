"use client"

import { useState, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface BusinessPhotoCarouselProps {
  photos: string[]
  businessName: string
}

export function BusinessPhotoCarousel({
  photos,
  businessName,
}: BusinessPhotoCarouselProps) {
  const [current, setCurrent] = useState(0)

  const prev = useCallback(() => {
    setCurrent((i) => (i === 0 ? photos.length - 1 : i - 1))
  }, [photos.length])

  const next = useCallback(() => {
    setCurrent((i) => (i === photos.length - 1 ? 0 : i + 1))
  }, [photos.length])

  if (photos.length === 0) return null

  if (photos.length === 1) {
    return (
      <div className="relative h-44 w-full overflow-hidden sm:h-60 card-enter">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[0]}
          alt=""
          className="h-full w-full object-cover [transition:transform_400ms_cubic-bezier(0.23,1,0.32,1)] hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
      </div>
    )
  }

  return (
    <div className="relative h-44 w-full overflow-hidden sm:h-60 card-enter group">
      {/* Slides */}
      {photos.map((url, i) => (
        <div
          key={url}
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={i === 0 ? `${businessName} photo` : ""}
            className="h-full w-full object-cover"
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />

      {/* Prev/next buttons */}
      <button
        onClick={prev}
        aria-label="Previous photo"
        className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background/90"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={next}
        aria-label="Next photo"
        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background/90"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to photo ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === current
                ? "w-4 bg-white"
                : "w-1.5 bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
