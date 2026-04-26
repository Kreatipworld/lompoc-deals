"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2 } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

const ITEM_CATEGORY_KEYS = [
  { value: "furniture", key: "furniture" },
  { value: "clothes", key: "clothes" },
  { value: "electronics", key: "electronics" },
  { value: "toys", key: "toys" },
  { value: "books", key: "books" },
  { value: "kitchen", key: "kitchen" },
  { value: "tools", key: "tools" },
  { value: "sports", key: "sports" },
  { value: "antiques", key: "antiques" },
  { value: "other", key: "other" },
] as const

export function PostGarageSaleForm() {
  const t = useTranslations("garageSaleForm")
  const tGarageSales = useTranslations("garageSales")
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [newSaleId, setNewSaleId] = useState<number | null>(null)

  function toggleCat(val: string) {
    setSelectedCats((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormStatus("submitting")
    setErrorMsg("")

    const form = e.currentTarget
    const fd = new FormData(form)

    const payload = {
      address: fd.get("address") as string,
      description: fd.get("description") as string,
      startDate: fd.get("startDate") as string,
      endDate: fd.get("endDate") as string,
      startTime: (fd.get("startTime") as string) || undefined,
      endTime: (fd.get("endTime") as string) || undefined,
      itemCategories: selectedCats.length > 0 ? selectedCats : undefined,
    }

    try {
      const res = await fetch("/api/garage-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? t("errorDefault"))
      }
      const data = await res.json()
      setNewSaleId(data.id)
      setFormStatus("success")
    } catch (err) {
      setFormStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  if (formStatus === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <h2 className="text-xl font-semibold">{tGarageSales("success")}</h2>
        <p className="text-sm text-muted-foreground">
          {tGarageSales("successSubtitle")}
        </p>
        <div className="mt-2 flex gap-3">
          {newSaleId && (
            <Link
              href={`/garage-sales/${newSaleId}`}
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              {tGarageSales("viewListing")}
            </Link>
          )}
          <Link
            href="/garage-sales"
            className="rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-accent"
          >
            {tGarageSales("browseAll")}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="address">{t("addressLabel")} *</Label>
        <Input
          id="address"
          name="address"
          placeholder={t("addressPlaceholder")}
          required
          minLength={5}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">{t("addressHint")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">{t("startDate")} *</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">{t("endDate")} *</Label>
          <Input id="endDate" name="endDate" type="date" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startTime">{t("startTime")}</Label>
          <Input id="startTime" name="startTime" type="time" placeholder="07:00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">{t("endTime")}</Label>
          <Input id="endTime" name="endTime" type="time" placeholder="13:00" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("descriptionLabel")} *</Label>
        <Textarea
          id="description"
          name="description"
          placeholder={t("descriptionPlaceholder")}
          rows={4}
          required
          minLength={10}
          maxLength={2000}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("categoriesLabel")} <span className="text-muted-foreground font-normal">{t("categoriesOptional")}</span></Label>
        <div className="flex flex-wrap gap-2">
          {ITEM_CATEGORY_KEYS.map((cat) => {
            const active = selectedCats.includes(cat.value)
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCat(cat.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "border-border text-muted-foreground hover:border-orange-300 hover:text-orange-700"
                }`}
              >
                {t(cat.key)}
              </button>
            )
          })}
        </div>
      </div>

      {formStatus === "error" && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      <Button
        type="submit"
        disabled={formStatus === "submitting"}
        className="w-full bg-orange-500 hover:bg-orange-600"
      >
        {formStatus === "submitting" ? t("submittingButton") : t("submitButton")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {t("disclaimer")}
      </p>
    </form>
  )
}
