import type { ReactNode } from "react"
import { SafeImage } from "@/components/safe-image"

/**
 * Resolves the best available business image for a card avatar:
 * logo → scraped/uploaded photo → generic icon. The photo fills the same
 * square as the logo (object-cover). `className` carries sizing + rounding.
 */
export function BusinessAvatar({
  logoUrl,
  photoUrl,
  name,
  className,
  icon,
}: {
  logoUrl: string | null
  photoUrl: string | null
  name: string
  className: string
  icon: ReactNode
}) {
  const iconBlock = (
    <div className={`${className} flex items-center justify-center bg-primary/10 text-primary`}>
      {icon}
    </div>
  )
  const photoBlock = photoUrl ? (
    <SafeImage src={photoUrl} alt={name} className={`${className} object-cover`} fallback={iconBlock} />
  ) : (
    iconBlock
  )
  if (logoUrl) {
    return (
      <SafeImage src={logoUrl} alt={name} className={`${className} object-cover`} fallback={photoBlock} />
    )
  }
  return photoBlock
}
