"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { MailCheck } from "lucide-react"
import { requestSalesEmailVerification, type VerifyState } from "@/lib/sales-actions"
import { Button } from "@/components/ui/button"

/** The email-verification gate on /sales/post: one button, one link, one click. */
export function VerifyEmailPanel({ email, status }: { email: string; status: "invalid" | null }) {
  const t = useTranslations("sales.post.verify")
  const [state, setState] = useState<VerifyState>(undefined)
  const [pending, start] = useTransition()

  const message =
    state?.sent ? t("sent")
    : state?.error === "tooSoon" ? t("tooSoon")
    : state?.error === "alreadyVerified" ? t("done")
    : state?.error ? t("error")
    : status === "invalid" ? t("invalid")
    : null

  return (
    <div className="rounded-3xl border bg-card p-8 text-center shadow-sm" data-sales-verify>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <MailCheck className="h-6 w-6 text-primary" />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold">{t("heading")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("body", { email })}</p>
      {message && (
        <p className={`mt-4 rounded-xl px-4 py-2 text-sm ${state?.sent || state?.error === "alreadyVerified" ? "bg-success-muted text-success" : "bg-secondary text-foreground"}`}>{message}</p>
      )}
      <Button type="button" className="mt-5" disabled={pending || !!state?.sent} onClick={() => start(async () => setState(await requestSalesEmailVerification()))}>
        {pending ? t("sending") : t("send")}
      </Button>
    </div>
  )
}
