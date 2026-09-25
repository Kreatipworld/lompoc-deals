"use client"

import { useState } from "react"
import { Camera } from "lucide-react"
import { SafeImage } from "@/components/safe-image"
import { PhotoLightbox } from "@/components/photo-lightbox"

/** Cover + thumbnails; any tap opens the shared lightbox (swipe, arrows, Esc). */
export function SaleGallery({ photos, title, noPhotoLabel }: { photos: string[]; title: string; noPhotoLabel: string }) {
  const [open, setOpen] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-[20px] border border-border/80 bg-primary/[0.04] text-muted-foreground sm:aspect-[16/9]">
        <Camera className="h-8 w-8" strokeWidth={1.25} aria-hidden />
        <span className="text-xs">{noPhotoLabel}</span>
      </div>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(0)} className="block w-full overflow-hidden rounded-[20px] border border-border/80 bg-primary/[0.04]" aria-label={title}>
        <div className="aspect-[4/3] w-full sm:aspect-[16/10] md:max-h-[520px]">
          <SafeImage src={photos[0]} alt={title} className="h-full w-full object-contain" optWidth={1080} loading="eager" />
        </div>
      </button>
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            <button key={url + i} type="button" onClick={() => setOpen(i)} className={`aspect-square w-20 shrink-0 overflow-hidden rounded-xl border ${i === 0 ? "border-primary" : "border-border/80"}`} aria-label={`${title} ${i + 1}`}>
              <SafeImage src={url} alt="" className="h-full w-full object-cover" optWidth={384} />
            </button>
          ))}
        </div>
      )}
      {open !== null && <PhotoLightbox photos={photos} startIndex={open} businessName={title} onClose={() => setOpen(null)} />}
    </>
  )
}
