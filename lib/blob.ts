import { put, del } from "@vercel/blob"

export async function uploadImage(file: File, prefix: string): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("No file provided")
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image")
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be under 5 MB")
  }

  const ext = file.name.split(".").pop() ?? "bin"
  const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const blob = await put(key, file, {
    access: "public",
    addRandomSuffix: false,
  })
  return blob.url
}

export async function deleteImage(url: string): Promise<void> {
  try {
    await del(url)
  } catch {
    // best-effort delete
  }
}
