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

const CATEGORIES = [
  { value: "community", label: "Community" },
  { value: "business-launch", label: "Business Launch" },
  { value: "festival", label: "Festival" },
  { value: "arts", label: "Arts & Culture" },
  { value: "food", label: "Food & Drink" },
  { value: "sports", label: "Sports & Fitness" },
  { value: "market", label: "Market / Pop-up" },
  { value: "other", label: "Other" },
] as const

export function SubmitEventForm() {
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
        <h2 className="text-xl font-semibold">Event submitted!</h2>
        <p className="text-sm text-muted-foreground">
          Your event is pending review. We&apos;ll publish it shortly after approval.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Event name *</Label>
        <Input id="title" name="title" placeholder="Lompoc Flower Festival…" required minLength={3} maxLength={300} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Start date & time *</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAt">End date & time</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          placeholder="Lompoc Veterans Memorial Building, 100 E Locust Ave"
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Tell people what to expect…"
          rows={4}
          maxLength={2000}
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? "Submitting…" : "Submit event"}
      </Button>
    </form>
  )
}
