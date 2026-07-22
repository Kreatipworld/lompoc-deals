"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, ArrowRight, Star, Trash2, Upload } from "lucide-react"
import { saveGalleryAction } from "@/lib/biz-actions"
import { Button } from "@/components/ui/button"

const MAX_PHOTOS = 8

type Item =
  | { id: string; kind: "existing"; url: string }
  | { id: string; kind: "new"; file: File; previewUrl: string }

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function itemSrc(item: Item): string {
  return item.kind === "existing" ? item.url : item.previewUrl
}

export function PhotoManager({ initialPhotos }: { initialPhotos: string[] }) {
  const t = useTranslations("photoManager")
  const router = useRouter()

  const [items, setItems] = useState<Item[]>(() =>
    initialPhotos.map((url) => ({ id: makeId(), kind: "existing", url }))
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlsRef = useRef<Set<string>>(new Set())

  // If the server hands us a fresh photo list (e.g. after a save elsewhere
  // triggers a re-render), sync local state to match.
  const initialKey = initialPhotos.join("|")
  useEffect(() => {
    setItems(initialPhotos.map((url) => ({ id: makeId(), kind: "existing", url })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey])

  // Revoke any still-outstanding object URLs when the component unmounts.
  useEffect(() => {
    const urls = objectUrlsRef.current
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [])

  const atLimit = items.length >= MAX_PHOTOS

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setError(null)
    setSuccess(false)
    setItems((prev) => {
      const room = MAX_PHOTOS - prev.length
      if (room <= 0) return prev
      const files = Array.from(fileList).slice(0, room)
      const added: Item[] = files.map((file) => {
        const previewUrl = URL.createObjectURL(file)
        objectUrlsRef.current.add(previewUrl)
        return { id: makeId(), kind: "new", file, previewUrl }
      })
      return [...prev, ...added]
    })
  }

  function handleRemove(id: string) {
    setError(null)
    setSuccess(false)
    setItems((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target?.kind === "new") {
        URL.revokeObjectURL(target.previewUrl)
        objectUrlsRef.current.delete(target.previewUrl)
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  function handleMakeFirst(id: string) {
    setError(null)
    setSuccess(false)
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id)
      if (idx <= 0) return prev
      const copy = [...prev]
      const [item] = copy.splice(idx, 1)
      copy.unshift(item)
      return copy
    })
  }

  function handleMove(id: string, dir: -1 | 1) {
    setError(null)
    setSuccess(false)
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id)
      const newIdx = idx + dir
      if (idx === -1 || newIdx < 0 || newIdx >= prev.length) return prev
      const copy = [...prev]
      ;[copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]
      return copy
    })
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const manifest: Array<
        { kind: "existing"; url: string } | { kind: "new"; idx: number }
      > = []
      const formData = new FormData()
      let newIdx = 0
      for (const item of items) {
        if (item.kind === "existing") {
          manifest.push({ kind: "existing", url: item.url })
        } else {
          manifest.push({ kind: "new", idx: newIdx })
          formData.append(`new_${newIdx}`, item.file)
          newIdx += 1
        }
      }
      formData.append("manifest", JSON.stringify(manifest))

      const result = await saveGalleryAction(undefined, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.refresh()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saveError"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-base font-semibold tracking-tight">
          {t("title")}
        </h3>
        <p className="text-xs text-muted-foreground">{t("help")}</p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item, index) => {
            const isFirst = index === 0
            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm"
              >
                <div className="relative aspect-square w-full bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={itemSrc(item)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {isFirst && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
                      <Star className="h-3 w-3 fill-current" />
                      {t("shownFirst")}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1 border-t bg-card/95 p-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(item.id, -1)}
                      disabled={index === 0}
                      aria-label={t("moveLeft")}
                      className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(item.id, 1)}
                      disabled={index === items.length - 1}
                      aria-label={t("moveRight")}
                      className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {!isFirst && (
                    <button
                      type="button"
                      onClick={() => handleMakeFirst(item.id)}
                      aria-label={t("makeFirst")}
                      title={t("makeFirst")}
                      className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    aria-label={t("remove")}
                    title={t("remove")}
                    className="flex h-7 w-7 items-center justify-center rounded-md border text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ""
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={atLimit}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {t("addPhotos")}
        </Button>
        <span className="text-xs text-muted-foreground">
          {atLimit ? t("limitReached", { max: MAX_PHOTOS }) : t("countHint", { count: items.length, max: MAX_PHOTOS })}
        </span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">{t("saved")}</p>}

      <Button type="button" onClick={handleSave} disabled={isSaving}>
        {isSaving ? t("saving") : t("save")}
      </Button>
    </div>
  )
}
