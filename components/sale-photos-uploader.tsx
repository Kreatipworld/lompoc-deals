"use client"

import { useCallback, useRef, useState } from "react"
import { upload } from "@vercel/blob/client"
import { useTranslations } from "next-intl"
import { ImagePlus, Star, X, AlertCircle } from "lucide-react"
import { isHeicFile, toJpeg } from "@/lib/client-image"
import { MAX_SALE_PHOTOS } from "@/lib/sales"

type Item = { key: string; url: string | null; preview: string; progress: number; error?: string }

/**
 * Photos for a sale listing: re-encoded to JPEG in the browser
 * (lib/client-image.ts), streamed straight to Blob under sales/<userId>/,
 * first photo = cover. The final URLs travel in a hidden `photos` field.
 */
export function SalePhotosUploader({ userId, onChange }: { userId: number; onChange: (urls: string[]) => void }) {
  const t = useTranslations("sales.post.uploader")
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const emit = (next: Item[]) => {
    setItems(next)
    onChange(next.map((i) => i.url).filter((u): u is string => !!u))
  }

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null)
      const list = Array.from(files)
      const room = MAX_SALE_PHOTOS - items.length
      if (list.length > room) setError(t("tooMany"))
      let current = items
      for (const raw of list.slice(0, Math.max(0, room))) {
        if (!raw.type.startsWith("image/") && !isHeicFile(raw)) {
          setError(t("badType"))
          continue
        }
        const file = await toJpeg(raw)
        if (!file) {
          setError(isHeicFile(raw) ? t("heic") : t("badType"))
          continue
        }
        const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const preview = URL.createObjectURL(file)
        current = [...current, { key, url: null, preview, progress: 0 }]
        setItems(current)
        try {
          const res = await upload(`sales/${userId}/${key}.jpg`, file, {
            access: "public",
            handleUploadUrl: "/api/upload/sale-photo",
            onUploadProgress: ({ percentage }) => setItems((cur) => cur.map((i) => (i.key === key ? { ...i, progress: percentage } : i))),
          })
          current = current.map((i) => (i.key === key ? { ...i, url: res.url, progress: 100 } : i))
          emit(current)
        } catch {
          current = current.map((i) => (i.key === key ? { ...i, error: t("uploadFailed") } : i))
          setItems(current)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, userId]
  )

  const remove = (key: string) => emit(items.filter((i) => i.key !== key))
  const makeCover = (key: string) => {
    const idx = items.findIndex((i) => i.key === key)
    if (idx <= 0) return
    const next = [items[idx], ...items.slice(0, idx), ...items.slice(idx + 1)]
    emit(next)
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); void addFiles(e.dataTransfer.files) }}
        className={`rounded-2xl border-2 border-dashed p-4 text-center transition ${dragOver ? "border-primary bg-primary/5" : "border-border/80"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="sr-only"
          onChange={(e) => { if (e.target.files) void addFiles(e.target.files); e.target.value = "" }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={items.length >= MAX_SALE_PHOTOS}
          className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4" />
          {t("add")}
        </button>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t("drop")} · {t("count", { n: items.length, max: MAX_SALE_PHOTOS })}
        </p>
      </div>

      {items.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((it, i) => (
            <li key={it.key} className="relative aspect-square overflow-hidden rounded-xl border border-border/80 bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.preview} alt="" className="h-full w-full object-cover" />
              {it.progress < 100 && !it.error && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
                  <div className="h-full bg-primary transition-all" style={{ width: `${it.progress}%` }} />
                </div>
              )}
              {it.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-2 text-center text-[11px] text-white">
                  <AlertCircle className="mr-1 h-3.5 w-3.5" /> {it.error}
                </div>
              )}
              {i === 0 ? (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-gold-foreground">
                  <Star className="h-3 w-3" /> {t("cover")}
                </span>
              ) : (
                it.url && (
                  <button type="button" onClick={() => makeCover(it.key)} className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow">
                    {t("makeCover")}
                  </button>
                )
              )}
              <button type="button" onClick={() => remove(it.key)} aria-label={t("remove")} className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-foreground shadow hover:bg-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
