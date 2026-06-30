"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Store, Images } from "lucide-react"
import { SafeImage } from "@/components/safe-image"
import { PhotoLightbox } from "@/components/photo-lightbox"
import { planGallery } from "@/lib/gallery"

function LogoBlock({ logoUrl, businessName }: { logoUrl: string | null; businessName: string }) {
  const fallback = (
    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-background bg-primary/10 shadow-md">
      <Store className="h-9 w-9 text-primary/60" />
    </div>
  )
  if (!logoUrl) return fallback
  return (
    <SafeImage
      src={logoUrl}
      alt={`${businessName} logo`}
      className="h-20 w-20 rounded-2xl border-2 border-background bg-background object-cover shadow-md"
      fallback={fallback}
    />
  )
}

export function BusinessPhotoGallery({
  photos,
  businessName,
  logoUrl,
}: {
  photos: string[]
  businessName: string
  logoUrl: string | null
}) {
  const t = useTranslations("businesses.profile")
  const [openAt, setOpenAt] = useState<number | null>(null)
  const { lead, thumbs, overflow } = planGallery(photos)

  // Empty state — branded banner with the logo (looks deliberate, not broken)
  if (!lead) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex h-40 w-full items-center justify-center rounded-3xl bg-gradient-to-br from-accent via-background to-primary/10 sm:h-52">
          <LogoBlock logoUrl={logoUrl} businessName={businessName} />
        </div>
      </div>
    )
  }

  const thumbCols =
    thumbs.length >= 3 ? "grid-cols-2 grid-rows-2" : thumbs.length === 2 ? "grid-cols-1 grid-rows-2" : "grid-cols-1 grid-rows-1"

  function Tile({ src, index, children }: { src: string; index: number; children?: React.ReactNode }) {
    return (
      <button
        type="button"
        onClick={() => setOpenAt(index)}
        aria-label={t("photoOpenAria", { n: index + 1 })}
        className="group relative h-full w-full overflow-hidden rounded-2xl bg-muted"
      >
        <SafeImage
          src={src}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          fallback={<div className="h-full w-full bg-gradient-to-br from-primary/15 to-accent" />}
        />
        {children}
      </button>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      {thumbs.length === 0 ? (
        // single photo
        <div className="h-64 sm:h-80">
          <Tile src={lead} index={0} />
        </div>
      ) : (
        <div className="flex h-64 gap-2 sm:h-80">
          <div className="min-w-0 flex-[1.6]">
            <Tile src={lead} index={0} />
          </div>
          <div className={`grid min-w-0 flex-1 gap-2 ${thumbCols}`}>
            {thumbs.map((src, i) => {
              const isLast = i === thumbs.length - 1
              return (
                <Tile key={`${src}-${i}`} src={src} index={i + 1}>
                  {isLast && overflow > 0 && (
                    <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                      <span className="flex items-center gap-1 text-lg font-bold">
                        <Images className="h-4 w-4" />+{overflow}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wide">{t("photosViewAll")}</span>
                    </span>
                  )}
                </Tile>
              )
            })}
          </div>
        </div>
      )}

      {openAt !== null && (
        <PhotoLightbox photos={photos} startIndex={openAt} businessName={businessName} onClose={() => setOpenAt(null)} />
      )}
    </div>
  )
}
