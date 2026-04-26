"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2 } from "lucide-react"
import { useTranslations } from "next-intl"

const CATEGORY_KEYS = [
  { value: "community", key: "categoryCommunity" },
  { value: "business-launch", key: "categoryBusinessLaunch" },
  { value: "festival", key: "categoryFestival" },
  { value: "arts", key: "categoryArts" },
  { value: "food", key: "categoryFood" },
  { value: "sports", key: "categorySports" },
  { value: "market", key: "categoryMarket" },
  { value: "other", key: "categoryOther" },
] as const

export function SubmitEventForm() {
  const t = useTranslations("submitEvent")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [category, setCategory] = useState("other")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMsg("")

    const form = e.currentTarget
    const fd = new FormData(form)

    const payload = {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      location: fd.get("location") as string,
      category,
      startsAt: fd.get("startsAt") as string,
      endsAt: (fd.get("endsAt") as string) || undefined,
    }

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Submission failed")
      }
      setStatus("success")
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <h2 className="text-xl font-semibold">{t("successHeading")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("successBody")}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">{t("eventName")} *</Label>
        <Input id="title" name="title" placeholder={t("eventNamePlaceholder")} required minLength={3} maxLength={300} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">{t("category")}</Label>
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_KEYS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {t(c.key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startsAt">{t("startsAt")} *</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAt">{t("endsAt")}</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">{t("location")}</Label>
        <Input
          id="location"
          name="location"
          placeholder={t("locationPlaceholder")}
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          name="description"
          placeholder={t("descriptionPlaceholder")}
          rows={4}
          maxLength={2000}
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? t("submittingButton") : t("submitButton")}
      </Button>
    </form>
  )
}
