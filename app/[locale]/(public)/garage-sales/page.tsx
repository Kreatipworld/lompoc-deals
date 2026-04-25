import { permanentRedirect } from "next/navigation"

export default function GarageSalesPage() {
  // 308 permanent — old yard-sales URL becomes the for-sale slice of the feed.
  // Search engines transfer authority to /feed via the permanent status.
  permanentRedirect("/feed?type=for_sale")
}
