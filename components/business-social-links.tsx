import Link from "next/link"
import { Star } from "lucide-react"

export type SocialLinks = {
  instagramUrl?: string | null
  facebookUrl?: string | null
  tiktokUrl?: string | null
  youtubeUrl?: string | null
  yelpUrl?: string | null
  googleBusinessUrl?: string | null
}

// Inline SVG icons — the lucide-react version installed in this project
// is missing social brand icons, so we hand-roll the simple shapes.
function InstagramIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}
function FacebookIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}
function TikTokIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}
function YoutubeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  )
}

const PLATFORMS: {
  key: keyof SocialLinks
  label: string
  Icon: () => React.JSX.Element
}[] = [
  { key: "instagramUrl", label: "Instagram", Icon: InstagramIcon },
  { key: "facebookUrl", label: "Facebook", Icon: FacebookIcon },
  { key: "tiktokUrl", label: "TikTok", Icon: TikTokIcon },
  { key: "youtubeUrl", label: "YouTube", Icon: YoutubeIcon },
]

export function BusinessSocialLinks({
  links,
  reviewUrl,
}: {
  links: SocialLinks
  reviewUrl?: string | null
}) {
  const items = PLATFORMS.filter((p) => links[p.key])

  if (items.length === 0 && !links.yelpUrl && !reviewUrl) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(({ key, label, Icon }) => (
        <Link
          key={key}
          href={links[key]!}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={label}
          title={label}
          className="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition hover:border-primary/40 hover:bg-accent hover:text-primary"
        >
          <Icon />
        </Link>
      ))}

      {links.yelpUrl && (
        <Link
          href={links.yelpUrl}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Yelp"
          title="Yelp"
          className="flex h-9 items-center justify-center rounded-full border bg-background px-3 text-xs font-bold text-[#d32323] transition hover:border-[#d32323]/40 hover:bg-[#d32323]/5"
        >
          Yelp
        </Link>
      )}

      {reviewUrl && (
        <Link
          href={reviewUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-medium text-background transition hover:bg-foreground/90"
        >
          <Star className="h-3.5 w-3.5 fill-current" />
          View Google reviews
        </Link>
      )}
    </div>
  )
}
