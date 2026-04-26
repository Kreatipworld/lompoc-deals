"use client"

import { useFormState, useFormStatus } from "react-dom"
import { saveProfileAction, type ProfileState } from "@/lib/biz-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  DAY_KEYS,
  DAY_LABELS,
  parseHours,
  type Hours,
} from "@/lib/hours"
import { useTranslations } from "next-intl"

type Biz = {
  name: string
  description: string | null
  categoryId: number | null
  address: string | null
  phone: string | null
  website: string | null
  logoUrl: string | null
  coverUrl: string | null
  hoursJson: unknown
  instagramUrl: string | null
  facebookUrl: string | null
  tiktokUrl: string | null
  youtubeUrl: string | null
  yelpUrl: string | null
  googleBusinessUrl: string | null
} | null

function HoursEditor({ initial, labelTo, labelClosed }: { initial: Hours; labelTo: string; labelClosed: string }) {
  return (
    <div className="space-y-2">
      {DAY_KEYS.map((day) => {
        const d = initial[day]
        const isClosed = d === null
        return (
          <div
            key={day}
            className="flex items-center gap-3 rounded-lg border p-2"
          >
            <span className="w-10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {DAY_LABELS[day]}
            </span>
            <Input
              type="time"
              name={`hours_${day}_open`}
              defaultValue={d?.open ?? "09:00"}
              className="h-8 max-w-[110px]"
              disabled={isClosed}
            />
            <span className="text-xs text-muted-foreground">{labelTo}</span>
            <Input
              type="time"
              name={`hours_${day}_close`}
              defaultValue={d?.close ?? "17:00"}
              className="h-8 max-w-[110px]"
              disabled={isClosed}
            />
            <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                name={`hours_${day}_closed`}
                defaultChecked={isClosed}
                onChange={(e) => {
                  const row = e.currentTarget.closest("div")
                  if (!row) return
                  const inputs =
                    row.querySelectorAll<HTMLInputElement>("input[type=time]")
                  inputs.forEach((i) => (i.disabled = e.currentTarget.checked))
                }}
              />
              {labelClosed}
            </label>
          </div>
        )
      })}
    </div>
  )
}

type Category = { id: number; name: string }

function SaveButton({ labels }: { labels: { saving: string; idle: string } }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? labels.saving : labels.idle}
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
  const t = useTranslations("dashboardProfile")
  const [state, action] = useFormState<ProfileState, FormData>(
    saveProfileAction,
    undefined
  )

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input id="name" name="name" required defaultValue={biz?.name ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("descriptionLabel")}</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={biz?.description ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">{t("categoryLabel")}</Label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={biz?.categoryId ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("categoryDefault")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{t("addressLabel")}</Label>
        <Input
          id="address"
          name="address"
          placeholder={t("addressPlaceholder")}
          defaultValue={biz?.address ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          {t("addressHint")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">{t("phoneLabel")}</Label>
          <Input id="phone" name="phone" defaultValue={biz?.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">{t("websiteLabel")}</Label>
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
          <Label htmlFor="logo">{t("logoLabel")}</Label>
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
          <Label htmlFor="cover">{t("coverLabel")}</Label>
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
            {t("hoursTitle")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("hoursHint")}
          </p>
        </div>
        <HoursEditor initial={parseHours(biz?.hoursJson)} labelTo={t("hoursTo")} labelClosed={t("hoursClosed")} />
      </div>

      <div className="space-y-4 border-t pt-6">
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight">
            {t("socialTitle")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("socialHint")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">{t("instagramLabel")}</Label>
            <Input
              id="instagramUrl"
              name="instagramUrl"
              type="url"
              placeholder="https://instagram.com/…"
              defaultValue={biz?.instagramUrl ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebookUrl">{t("facebookLabel")}</Label>
            <Input
              id="facebookUrl"
              name="facebookUrl"
              type="url"
              placeholder="https://facebook.com/…"
              defaultValue={biz?.facebookUrl ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiktokUrl">{t("tiktokLabel")}</Label>
            <Input
              id="tiktokUrl"
              name="tiktokUrl"
              type="url"
              placeholder="https://tiktok.com/@…"
              defaultValue={biz?.tiktokUrl ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtubeUrl">{t("youtubeLabel")}</Label>
            <Input
              id="youtubeUrl"
              name="youtubeUrl"
              type="url"
              placeholder="https://youtube.com/@…"
              defaultValue={biz?.youtubeUrl ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yelpUrl">{t("yelpLabel")}</Label>
            <Input
              id="yelpUrl"
              name="yelpUrl"
              type="url"
              placeholder="https://yelp.com/biz/…"
              defaultValue={biz?.yelpUrl ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="googleBusinessUrl">{t("googleBusinessLabel")}</Label>
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

      <SaveButton labels={{ saving: t("savePending"), idle: t("saveIdle") }} />
    </form>
  )
}
