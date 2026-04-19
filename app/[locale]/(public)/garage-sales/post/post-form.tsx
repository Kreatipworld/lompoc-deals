"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2 } from "lucide-react"
import { Link } from "@/i18n/navigation"

const ITEM_CATEGORIES = [
  { value: "furniture", label: "Furniture" },
  { value: "clothes", label: "Clothes & Accessories" },
  { value: "electronics", label: "Electronics" },
  { value: "toys", label: "Toys & Games" },
  { value: "books", label: "Books & Media" },
  { value: "kitchen", label: "Kitchen & Home" },
  { value: "tools", label: "Tools & Hardware" },
  { value: "sports", label: "Sports & Outdoors" },
  { value: "antiques", label: "Antiques & Collectibles" },
  { value: "other", label: "Other" },
] as const

export function PostGarageSaleForm() {
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
        throw new Error(data.error ?? "Submission failed")
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
        <h2 className="text-xl font-semibold">Your sale is live!</h2>
        <p className="text-sm text-muted-foreground">
          Locals can now find your garage sale on the map.
        </p>
        <div className="mt-2 flex gap-3">
          {newSaleId && (
            <Link
              href={`/garage-sales/${newSaleId}`}
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              View your listing
            </Link>
          )}
          <Link
            href="/garage-sales"
            className="rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-accent"
          >
            Browse all sales
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          name="address"
          placeholder="123 Oak St, Lompoc, CA 93436"
          required
          minLength={5}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">Street address so shoppers can find you</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date *</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date *</Label>
          <Input id="endDate" name="endDate" type="date" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input id="startTime" name="startTime" type="time" placeholder="07:00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End time</Label>
          <Input id="endTime" name="endTime" type="time" placeholder="13:00" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">What&apos;s for sale? *</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Lots of household items — furniture, kids clothes, books, kitchen stuff. No junk, all in good condition."
          rows={4}
          required
          minLength={10}
          maxLength={2000}
        />
      </div>

      <div className="space-y-2">
        <Label>Item categories <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <div className="flex flex-wrap gap-2">
          {ITEM_CATEGORIES.map((cat) => {
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
                {cat.label}
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
        {formStatus === "submitting" ? "Posting…" : "Post garage sale — free"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Your sale appears on the map immediately. No review required.
      </p>
    </form>
  )
}
