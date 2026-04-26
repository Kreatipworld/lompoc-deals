"use client"

import { useFormState, useFormStatus } from "react-dom"
import { profileSetupAction, type ProfileSetupState } from "@/lib/business-signup-actions"
import { useSearchParams } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { ImagePlus, Globe, Link2, ChevronRight, AlertCircle } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations("signupBusiness")
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? t("profile.savePending") : t("profile.saveIdle")}
      {!pending && <ChevronRight className="h-4 w-4" />}
    </button>
  )
}

export default function BusinessProfileSetupPage() {
  const t = useTranslations("signupBusiness")
  const [state, action] = useFormState<ProfileSetupState, FormData>(
    profileSetupAction,
    undefined
  )
  const searchParams = useSearchParams()
  const stripePending = searchParams.get("stripe_pending") === "1"

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("profile.stepLabel")}
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t("profile.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("profile.subtitle")}
        </p>
      </div>

      {stripePending && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {t("profile.stripePendingBanner")}
          </span>
        </div>
      )}

      <form action={action} className="space-y-5">
        {/* Logo upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            {t("profile.logoLabel")}{" "}
            <span className="text-muted-foreground font-normal">{t("profile.logoOptional")}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-border p-4 transition hover:border-primary/50">
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("profile.logoUploadCta")}</span>
            <input type="file" name="logo" accept="image/*" className="sr-only" />
          </label>
        </div>

        {/* Cover image upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            {t("profile.coverLabel")}{" "}
            <span className="text-muted-foreground font-normal">{t("profile.coverOptional")}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-border p-4 transition hover:border-primary/50">
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("profile.coverUploadCta")}</span>
            <input type="file" name="cover" accept="image/*" className="sr-only" />
          </label>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium text-foreground">
            {t("profile.descriptionLabel")}{" "}
            <span className="text-muted-foreground font-normal">{t("profile.descriptionOptional")}</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder={t("profile.descriptionPlaceholder")}
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4 resize-none"
          />
        </div>

        {/* Website */}
        <div className="space-y-1.5">
          <label htmlFor="website" className="text-sm font-medium text-foreground">
            {t("profile.websiteLabel")}{" "}
            <span className="text-muted-foreground font-normal">{t("profile.websiteOptional")}</span>
          </label>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="website"
              name="website"
              type="url"
              placeholder={t("profile.websitePlaceholder")}
              className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
            />
          </div>
        </div>

        {/* Social links */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground">
            {t("profile.socialLinksLabel")}{" "}
            <span className="text-muted-foreground font-normal">{t("profile.socialLinksOptional")}</span>
          </div>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="instagramUrl"
              type="url"
              placeholder={t("profile.instagramPlaceholder")}
              className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
            />
          </div>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="facebookUrl"
              type="url"
              placeholder={t("profile.facebookPlaceholder")}
              className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
            />
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">T</span>
            <input
              name="tiktokUrl"
              type="url"
              placeholder={t("profile.tiktokPlaceholder")}
              className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
            />
          </div>
        </div>

        {state?.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <SubmitButton />

        <div className="text-center">
          <Link
            href="/signup/business/first-deal"
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            {t("profile.skipForNow")}
          </Link>
        </div>
      </form>
    </div>
  )
}
