"use client"

import { useFormState, useFormStatus } from "react-dom"
import { saveProfileAction, type ProfileState } from "@/lib/biz-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type Biz = {
  name: string
  description: string | null
  categoryId: number | null
  address: string | null
  phone: string | null
  website: string | null
  logoUrl: string | null
  coverUrl: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  tiktokUrl: string | null
  youtubeUrl: string | null
  yelpUrl: string | null
  googleBusinessUrl: string | null
} | null

type Category = { id: number; name: string }

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save profile"}
    </Button>
  )
}

export function ProfileForm({
  biz,
  categories,
}: {
  biz: Biz
  categories: Category[]
}) {
  const [state, action] = useFormState<ProfileState, FormData>(
    saveProfileAction,
    undefined
  )

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Business name</Label>
        <Input id="name" name="name" required defaultValue={biz?.name ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={biz?.description ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={biz?.categoryId ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">— pick one —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address (Lompoc, CA)</Label>
        <Input
          id="address"
          name="address"
          placeholder="123 Main St, Lompoc, CA 93436"
          defaultValue={biz?.address ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          We&apos;ll geocode this to a map pin automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={biz?.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            type="url"
            placeholder="https://"
            defaultValue={biz?.website ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="logo">Logo image</Label>
          {biz?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={biz.logoUrl}
              alt="current logo"
              className="h-16 w-16 rounded border object-cover"
            />
          )}
          <Input id="logo" name="logo" type="file" accept="image/*" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover">Cover image</Label>
          {biz?.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={biz.coverUrl}
              alt="current cover"
              className="h-16 w-32 rounded border object-cover"
            />
          )}
          <Input id="cover" name="cover" type="file" accept="image/*" />
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight">
            Social media
          </h3>
          <p className="text-xs text-muted-foreground">
            Optional. Paste full URLs (e.g.{" "}
            <code className="text-foreground">https://instagram.com/yourbiz</code>
            ).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Instagram</Label>
            <Input
              id="instagramUrl"
              name="instagramUrl"
              type="url"
              placeholder="https://instagram.com/…"
              defaultValue={biz?.instagramUrl ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebookUrl">Facebook</Label>
            <Input
              id="facebookUrl"
              name="facebookUrl"
              type="url"
              placeholder="https://facebook.com/…"
              defaultValue={biz?.facebookUrl ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiktokUrl">TikTok</Label>
            <Input
              id="tiktokUrl"
              name="tiktokUrl"
              type="url"
              placeholder="https://tiktok.com/@…"
              defaultValue={biz?.tiktokUrl ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtubeUrl">YouTube</Label>
            <Input
              id="youtubeUrl"
              name="youtubeUrl"
              type="url"
              placeholder="https://youtube.com/@…"
              defaultValue={biz?.youtubeUrl ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yelpUrl">Yelp</Label>
            <Input
              id="yelpUrl"
              name="yelpUrl"
              type="url"
              placeholder="https://yelp.com/biz/…"
              defaultValue={biz?.yelpUrl ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="googleBusinessUrl">Google Business</Label>
            <Input
              id="googleBusinessUrl"
              name="googleBusinessUrl"
              type="url"
              placeholder="https://g.page/…"
              defaultValue={biz?.googleBusinessUrl ?? ""}
            />
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600">{state.success}</p>
      )}

      <SaveButton />
    </form>
  )
}
