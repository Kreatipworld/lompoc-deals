export type GalleryPlan = {
  lead: string | null // first photo, or null when there are no photos
  thumbs: string[] // up to maxThumbs photos after the lead
  overflow: number // photos hidden behind the "+N" tile (>= 0)
  total: number
}

/** Plan the mosaic tiles from a flat photo list. Pure — no DOM, no DB. */
export function planGallery(photos: string[], maxThumbs = 4): GalleryPlan {
  const total = photos.length
  if (total === 0) return { lead: null, thumbs: [], overflow: 0, total: 0 }
  const lead = photos[0]
  const thumbs = photos.slice(1, 1 + maxThumbs)
  const overflow = Math.max(0, total - 1 - thumbs.length)
  return { lead, thumbs, overflow, total }
}
