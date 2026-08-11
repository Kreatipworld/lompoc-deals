"use client"

import { useEffect, useState } from "react"

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: React.ReactNode
  /** Transient-error retries before giving up (Google image CDNs throttle bursts). */
  retries?: number
  /** Called once the image has failed all retries and been replaced by the fallback. */
  onFail?: () => void
  /**
   * Width bucket for the Next image optimizer (device px). The mobile audit
   * found the homepage shipping 26 MB of raw images — full-resolution photos
   * and even logos straight from Blob. Routing through /_next/image resizes
   * and re-encodes (WebP/AVIF) on Vercel's edge. 828 covers a full-width
   * card on a 2x phone; pass 384 for thumbnails, 1080 for heroes.
   */
  optWidth?: number
}

/** Hosts the Next optimizer is allowed to touch (next.config remotePatterns + our own /public). */
const optimizable = (src: string) =>
  src.startsWith("/") || /https:\/\/[^/]*\.public\.blob\.vercel-storage\.com\//.test(src)

/**
 * Renders an <img> that hides itself on load error.
 * Retries once (by default) before failing — CDN throttling is usually transient —
 * then renders `fallback` (or null) and notifies `onFail` so parents can reflow.
 *
 * Own-host images are served through the Next image optimizer (resized,
 * modern format, cached at the edge); the final retry falls back to the raw
 * URL so an optimizer hiccup can never blank an image that actually exists.
 * Everything defaults to lazy loading — pass loading="eager" for above-fold.
 */
export function SafeImage({ src, alt, className, fallback, retries = 1, onFail, optWidth = 828, loading, decoding, ...props }: SafeImageProps) {
  const [attempt, setAttempt] = useState(0)
  const failed = attempt > retries

  useEffect(() => {
    if (failed) onFail?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed])

  if (!src || failed) {
    return fallback ? <>{fallback}</> : null
  }

  // Last attempt goes straight to the source; earlier attempts use the optimizer.
  const useOptimizer = optimizable(src) && attempt < retries
  const displaySrc = useOptimizer
    ? `/_next/image?url=${encodeURIComponent(src)}&w=${optWidth}&q=70`
    : src

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={attempt}
      src={displaySrc}
      alt={alt}
      className={className}
      loading={loading ?? "lazy"}
      decoding={decoding ?? "async"}
      onError={() => {
        // Small delay before the retry re-mount so a throttled CDN can recover.
        setTimeout(() => setAttempt((a) => a + 1), attempt < retries ? 900 : 0)
      }}
      {...props}
    />
  )
}
