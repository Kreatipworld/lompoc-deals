"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"
import { createListingLead, type LeadState } from "@/lib/lead-actions"
import { Input } from "@/components/ui/input"

type Kind = "showing" | "contact"

function Submit({ label, pending: pendingLabel }: { label: string; pending: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

/**
 * The buyer's side of a lead: a button that opens a small form (name, email,
 * phone, message, preferred time for tours) and posts to the agent. Used on the
 * home page ("Request a tour" / "Contact agent") and on the agent profile ("Contact").
 */
export function LeadForm({
  businessId,
  listingId,
  kind,
  label,
  agentName,
  variant = "primary",
  className = "",
}: {
  businessId: number
  listingId?: number
  kind: Kind
  label: string
  agentName: string
  variant?: "primary" | "secondary"
  className?: string
}) {
  const t = useTranslations("leadForm")
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState<LeadState, FormData>(createListingLead, undefined)

  const btnClass =
    variant === "primary"
      ? "inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      : "inline-flex items-center justify-center rounded-full border border-border/80 bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-foreground/30"

  if (state?.success) {
    return (
      <div className={`rounded-2xl border border-success/30 bg-success-muted px-4 py-3 text-sm font-medium text-success ${className}`} data-lead="sent">
        {t("sent", { name: state.success })}
      </div>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${btnClass} ${className}`} data-lead={kind}>
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={label}>
          <form
            action={action}
            className="w-full max-w-md rounded-[20px] border border-border/80 bg-card p-5 shadow-xl"
            data-lead-form={kind}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-lg font-semibold tracking-tight">
                  {kind === "showing" ? t("titleShowing") : t("titleContact")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("goesTo", { name: agentName })}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="rounded-full p-1 text-muted-foreground hover:bg-primary/[0.06] hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <input type="hidden" name="businessId" value={businessId} />
            {listingId != null && <input type="hidden" name="listingId" value={listingId} />}
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="sourcePath" value={pathname ?? ""} />
            {/* Honeypot — hidden from people, filled by bots. Checked server-side. */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

            <div className="mt-4 grid gap-3">
              <Input name="name" required maxLength={200} placeholder={t("name")} autoComplete="name" />
              <Input name="email" type="email" required maxLength={320} placeholder={t("email")} autoComplete="email" />
              <Input name="phone" type="tel" maxLength={50} placeholder={t("phone")} autoComplete="tel" />
              {kind === "showing" && <Input name="preferredTime" maxLength={200} placeholder={t("preferredTime")} />}
              <textarea
                name="message"
                maxLength={2000}
                rows={3}
                placeholder={kind === "showing" ? t("messageShowing") : t("messageContact")}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {state?.error && <p className="mt-3 text-sm text-destructive">{state.error}</p>}

            <div className="mt-4">
              <Submit label={kind === "showing" ? t("submitShowing") : t("submitContact")} pending={t("sending")} />
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">{t("privacy")}</p>
          </form>
        </div>
      )}
    </>
  )
}
