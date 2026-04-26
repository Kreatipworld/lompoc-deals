"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { submitFeedPostAction, type FeedActionState } from "@/lib/feed-actions"
import { useTranslations } from "next-intl"

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations("feedPost")
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? t("submitPending") : t("submitIdle")}
    </button>
  )
}

export function FeedPostForm({
  initialType,
}: {
  initialType: "for_sale" | "info"
}) {
  const t = useTranslations("feedPost")
  const [type, setType] = useState<"for_sale" | "info">(initialType)
  const [priceDollars, setPriceDollars] = useState<string>("")
  const [state, action] = useFormState<FeedActionState, FormData>(
    submitFeedPostAction,
    undefined
  )

  // Convert dollars input to cents for hidden form field on submit
  const priceCents =
    priceDollars.trim() === ""
      ? ""
      : String(Math.round(parseFloat(priceDollars) * 100))

  return (
    <form action={action} className="mt-6 space-y-5" encType="multipart/form-data">
      <div className="flex gap-2 rounded-full border bg-muted p-1">
        {(["for_sale", "info"] as const).map((t_) => (
          <button
            key={t_}
            type="button"
            onClick={() => setType(t_)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
              type === t_
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background"
            }`}
          >
            {t_ === "for_sale" ? t("typeForSale") : t("typeInfo")}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      <label className="block">
        <span className="text-sm font-medium">{t("titleLabel")}</span>
        <input
          name="title"
          required
          maxLength={200}
          className="mt-1 block h-11 w-full rounded-lg border bg-background px-3 text-sm"
          placeholder={type === "for_sale" ? t("titlePlaceholderForSale") : t("titlePlaceholderInfo")}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">{t("descriptionLabel")}</span>
        <textarea
          name="description"
          required
          rows={5}
          className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder={t("descriptionPlaceholder")}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">
          {t("photosLabel")}{" "}
          <span className="text-muted-foreground">
            ({type === "info" ? t("photosOptional") : t("photosUpTo")})
          </span>
        </span>
        <input
          type="file"
          name="photos"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="mt-1 block w-full text-sm"
        />
      </label>

      {type === "for_sale" && (
        <>
          <label className="block">
            <span className="text-sm font-medium">
              {t("priceLabel")}{" "}
              <span className="text-muted-foreground">({t("priceOptional")})</span>
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                className="block h-11 w-full rounded-lg border bg-background px-3 text-sm"
                placeholder="120.00"
              />
            </div>
            {/* Hidden cents field actually submitted */}
            <input type="hidden" name="priceCents" value={priceCents} />
          </label>

          <fieldset className="rounded-lg border p-3">
            <legend className="text-sm font-medium">
              {t("saleWindowLabel")}{" "}
              <span className="text-muted-foreground">({t("saleWindowOptional")})</span>
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs text-muted-foreground">{t("saleStartsLabel")}</span>
                <input
                  type="datetime-local"
                  name="saleStartsAt"
                  className="mt-1 block h-10 w-full rounded-lg border bg-background px-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">{t("saleEndsLabel")}</span>
                <input
                  type="datetime-local"
                  name="saleEndsAt"
                  className="mt-1 block h-10 w-full rounded-lg border bg-background px-2 text-sm"
                />
              </label>
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm font-medium">
              {t("addressLabel")}{" "}
              <span className="text-muted-foreground">({t("addressOptional")})</span>
            </span>
            <input
              name="address"
              className="mt-1 block h-11 w-full rounded-lg border bg-background px-3 text-sm"
              placeholder={t("addressPlaceholder")}
            />
          </label>
        </>
      )}

      {state?.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
