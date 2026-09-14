"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { upload } from "@vercel/blob/client"
import { ImagePlus, Star, X, GripVertical, AlertCircle } from "lucide-react"

export const MAX_LISTING_PHOTOS = 12
const MAX_EDGE = 2000
const JPEG_QUALITY = 0.85

export type PhotoItem = {
  key: string
  url: string | null // Blob URL once uploaded
  preview: string // object URL or the Blob URL
  progress: number // 0–100
  error?: string
}

const HEIC_RE = /\.(heic|heif)$/i
export function isHeicFile(file: File): boolean {
  return /^image\/hei[cf]$/i.test(file.type) || HEIC_RE.test(file.name)
}

// Re-encode EVERY photo in the browser as a JPEG (max 2000 px, ~85%) so a
// 12-photo listing uploads fast, never trips a body limit, and — above all —
// never lands in Blob as a format browsers can't display. HEIC/HEIF that this
// browser cannot decode returns null; the caller shows the iPhone hint instead
// of uploading the original (Sep 13 2026: two HEIC uploads broke a listing).
async function toJpeg(file: File): Promise<File | null> {
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
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", JPEG_QUALITY))
  if (!blob) return null
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" })
}

export function PropertyPhotos({
  businessId,
  initial,
  labels,
  onCoverChange,
}: {
  businessId: number
  initial: string[]
  onCoverChange?: (preview: string | null) => void
  labels: {
    title: string
    hint: string
    add: string
    drop: string
    cover: string
    makeCover: string
    remove: string
    tooMany: string
    badType: string
    heic: string
    uploadFailed: string
    count: string // "{n} of {max}"
  }
}) {
  const [items, setItems] = useState<PhotoItem[]>(
    initial.map((url, i) => ({ key: `init-${i}`, url, preview: url, progress: 100 }))
  )
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const dragIndex = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const cover = items[0]?.preview ?? null
  useEffect(() => {
    onCoverChange?.(cover)
  }, [cover, onCoverChange])

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null)
      const list = Array.from(files)
      const room = MAX_LISTING_PHOTOS - items.length
      if (list.length > room) setError(labels.tooMany)
      const accepted = list.slice(0, Math.max(0, room))
      for (const raw of accepted) {
        // HEIC often arrives with an empty MIME type — judge by name too.
        if (!raw.type.startsWith("image/") && !isHeicFile(raw)) {
          setError(labels.badType)
          continue
        }
        // Convert first: nothing that isn't a JPEG we made ourselves is uploaded.
        const file = await toJpeg(raw)
        if (!file) {
          setError(isHeicFile(raw) ? labels.heic : labels.badType)
          continue
        }
        const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const preview = URL.createObjectURL(file)
        setItems((cur) => [...cur, { key, url: null, preview, progress: 0 }])
        try {
          const res = await upload(`listings/${businessId}/${key}.jpg`, file, {
            access: "public",
            handleUploadUrl: "/api/upload/listing-photo",
            onUploadProgress: ({ percentage }) => {
              setItems((cur) => cur.map((it) => (it.key === key ? { ...it, progress: Math.round(percentage) } : it)))
            },
          })
          setItems((cur) => cur.map((it) => (it.key === key ? { ...it, url: res.url, progress: 100 } : it)))
        } catch (e) {
          setItems((cur) => cur.map((it) => (it.key === key ? { ...it, error: labels.uploadFailed, progress: 0 } : it)))
          setError(e instanceof Error && e.message ? e.message : labels.uploadFailed)
        }
      }
    },
    [items.length, businessId, labels]
  )

  const remove = (key: string) => setItems((cur) => cur.filter((it) => it.key !== key))
  const makeCover = (key: string) =>
    setItems((cur) => {
      const i = cur.findIndex((it) => it.key === key)
      if (i <= 0) return cur
      const next = [...cur]
      const [it] = next.splice(i, 1)
      next.unshift(it)
      return next
    })
  const move = (from: number, to: number) =>
    setItems((cur) => {
      if (from === to || from < 0 || to < 0 || from >= cur.length || to >= cur.length) return cur
      const next = [...cur]
      const [it] = next.splice(from, 1)
      next.splice(to, 0, it)
      return next
    })

  const uploading = items.some((it) => it.url === null && !it.error)

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium">{labels.title}</label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {labels.count.replace("{n}", String(items.length)).replace("{max}", String(MAX_LISTING_PHOTOS))}
        </span>
      </div>

      {/* Ordered URLs go with the form; uploads still in flight are skipped by the action. */}
      {items.map((it) => it.url && <input key={it.key} type="hidden" name="photoUrls" value={it.url} />)}
      <input type="hidden" name="photosUploading" value={uploading ? "1" : ""} />

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files)
        }}
        className={`rounded-2xl border-2 border-dashed p-4 transition ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
      >
        {items.length > 0 && (
          <ul className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((it, i) => (
              <li
                key={it.key}
                draggable
                onDragStart={() => (dragIndex.current = i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (dragIndex.current != null) move(dragIndex.current, i)
                  dragIndex.current = null
                }}
                className={`group relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted ${i === 0 ? "ring-2 ring-primary" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.preview} alt="" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                    {labels.cover}
                  </span>
                )}
                {it.url === null && !it.error && (
                  <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/30">
                    <div className="h-full bg-primary transition-[width]" style={{ width: `${it.progress}%` }} />
                  </div>
                )}
                {it.error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-destructive/70 p-2 text-center text-[11px] font-medium text-white">
                    {it.error}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  <span className="cursor-grab text-white/90" title="Drag to reorder">
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <div className="flex gap-1">
                    {i !== 0 && it.url && (
                      <button
                        type="button"
                        onClick={() => makeCover(it.key)}
                        className="rounded-md bg-white/90 p-1 text-foreground hover:bg-white"
                        title={labels.makeCover}
                        aria-label={labels.makeCover}
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(it.key)}
                      className="rounded-md bg-white/90 p-1 text-foreground hover:bg-white"
                      title={labels.remove}
                      aria-label={labels.remove}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
          <ImagePlus className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">{labels.drop}</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={items.length >= MAX_LISTING_PHOTOS}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {labels.add}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void addFiles(e.target.files)
              e.target.value = ""
            }}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{labels.hint}</p>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  )
}
