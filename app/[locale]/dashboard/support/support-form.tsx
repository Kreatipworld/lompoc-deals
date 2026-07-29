"use client"

import { useFormState, useFormStatus } from "react-dom"
import { useTranslations } from "next-intl"
import { submitTicketAction, type TicketState } from "@/lib/support-actions"

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations("dashboardSupport")
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? t("sending") : t("submit")}
    </button>
  )
}

export function SupportForm() {
  const t = useTranslations("dashboardSupport")
  const [state, action] = useFormState<TicketState, FormData>(submitTicketAction, undefined)

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-sm text-green-800">
        {t("thanks")}
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5 rounded-2xl border bg-card p-6">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium">
          {t("category")}
        </label>
        <select
          id="category"
          name="category"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="bug">{t("catBug")}</option>
          <option value="question">{t("catQuestion")}</option>
          <option value="billing">{t("catBilling")}</option>
          <option value="feature">{t("catFeature")}</option>
          <option value="other">{t("catOther")}</option>
        </select>
      </div>
      <div>
        <label htmlFor="subject" className="mb-1 block text-sm font-medium">
          {t("subject")}
        </label>
        <input
          id="subject"
          name="subject"
          required
          maxLength={200}
          placeholder={t("subjectPlaceholder")}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium">
          {t("message")}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder={t("messagePlaceholder")}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>
      <SubmitButton />
    </form>
  )
}
