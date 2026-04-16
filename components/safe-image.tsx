"use client"

import { useState } from "react"

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: React.ReactNode
}

/**
 * Renders an <img> that hides itself on load error.
 * If `src` is missing or the image fails to load, renders `fallback` (or null).
 */
export function SafeImage({ src, alt, className, fallback, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return fallback ? <>{fallback}</> : null
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  )
}
