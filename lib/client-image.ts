/**
 * Browser-side image preparation, shared by every uploader.
 *
 * Why this exists: `uploadImage` rejects anything over 5 MB and a modern phone
 * photo is routinely bigger than that. The listing uploader re-encoded in the
 * browser and worked; the business gallery sent the raw file and did not. A
 * paying member reported on Sep 21 2026 that gallery photos "don't even pop up
 * to load" — their files were simply too large, and the save reported success
 * anyway. Both uploaders now share this.
 *
 * Re-encoding also guarantees we never store a format browsers cannot display:
 * HEIC/HEIF that this browser cannot decode returns null so the caller can say
 * so, instead of putting an undecodable file in front of the whole town.
 */
export const MAX_EDGE = 2000
export const JPEG_QUALITY = 0.85

const HEIC_RE = /\.(heic|heif)$/i

export function isHeicFile(file: File): boolean {
  return /^image\/hei[cf]$/i.test(file.type) || HEIC_RE.test(file.name)
}

/** Re-encode to a capped-size JPEG. Returns null when the browser cannot decode it. */
export async function toJpeg(file: File): Promise<File | null> {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap || !bitmap.width || !bitmap.height) return null
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob(res, "image/jpeg", JPEG_QUALITY)
  )
  if (!blob) return null
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" })
}
