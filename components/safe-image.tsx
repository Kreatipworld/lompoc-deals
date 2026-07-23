"use client"

import { useEffect, useState } from "react"

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: React.ReactNode
  /** Transient-error retries before giving up (Google image CDNs throttle bursts). */
  retries?: number
  /** Called once the image has failed all retries and been replaced by the fallback. */
  onFail?: () => void
}

/**
 * Renders an <img> that hides itself on load error.
 * Retries once (by default) before failing — CDN throttling is usually transient —
 * then renders `fallback` (or null) and notifies `onFail` so parents can reflow.
 */
export function SafeImage({ src, alt, className, fallback, retries = 1, onFail, ...props }: SafeImageProps) {
  const [attempt, setAttempt] = useState(0)
  const failed = attempt > retries

  useEffect(() => {
    if (failed) onFail?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed])

  if (!src || failed) {
    return fallback ? <>{fallback}</> : null
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={attempt}
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        // Small delay before the retry re-mount so a throttled CDN can recover.
        setTimeout(() => setAttempt((a) => a + 1), attempt < retries ? 900 : 0)
      }}
      {...props}
    />
  )
}
