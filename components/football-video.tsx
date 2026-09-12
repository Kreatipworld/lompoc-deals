"use client"

import { useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"

/** A 9:16 clip of our own football videos: muted autoplay loop, tap for sound. */
export function FootballVideo({ src, title, labels }: { src: string; title: string; labels: { unmute: string; mute: string } }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  return (
    <figure className="group relative overflow-hidden rounded-[20px] border border-border/80 bg-black">
      <video
        ref={ref}
        src={src}
        className="aspect-[9/16] w-full object-cover"
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="metadata"
      />
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? labels.unmute : labels.mute}
        className="absolute right-3 top-3 rounded-full bg-black/55 p-2 text-white backdrop-blur transition hover:bg-black/75"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-sm font-semibold text-white">
        {title}
      </figcaption>
    </figure>
  )
}
