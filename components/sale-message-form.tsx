"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"
import { sendSaleMessage, type MessageState } from "@/lib/sales-actions"
import { Input } from "@/components/ui/input"

function Submit({ label, pending: pendingLabel }: { label: string; pending: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
      {pending ? pendingLabel : label}
    </button>
  )
}

/**
 * "Message seller": a button that opens a small form and relays by email. The
 * seller's address never reaches this component — only their listing id does.
 */
export function SaleMessageForm({ listingId, className = "" }: { listingId: number; className?: string }) {
  const t = useTranslations("sales.message")
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState<MessageState, FormData>(sendSaleMessage, undefined)

  if (state?.success) {
    return (
      <div className={`rounded-2xl border border-success/30 bg-success-muted px-4 py-3 text-sm font-medium text-success ${className}`} data-sale-message="sent">
        {t("sent")}
      </div>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 ${className}`} data-sale-message="open">
        {t("button")}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={t("title")}>
          <form action={action} className="w-full max-w-md rounded-[20px] border border-border/80 bg-card p-5 shadow-xl" data-sale-message-form>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-lg font-semibold tracking-tight">{t("title")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("intro")}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="rounded-full p-1.5 text-muted-foreground hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input type="hidden" name="listingId" value={listingId} />
            <input type="hidden" name="sourcePath" value={pathname} />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <div className="mt-4 space-y-3">
              <Input name="name" placeholder={t("name")} aria-label={t("name")} required minLength={2} maxLength={200} autoComplete="name" />
              <Input name="email" type="email" placeholder={t("email")} aria-label={t("email")} required maxLength={320} autoComplete="email" inputMode="email" />
              <Input name="phone" type="tel" placeholder={t("phone")} aria-label={t("phone")} maxLength={50} autoComplete="tel" inputMode="tel" />
              <textarea
                name="message"
                required
                minLength={5}
                maxLength={2000}
                rows={4}
                placeholder={t("messagePlaceholder")}
                aria-label={t("message")}
                className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-base outline-none ring-primary/30 focus:ring-2 sm:text-sm"
              />
            </div>
            {state?.error && <p className="mt-3 text-sm text-destructive">{t(`errors.${state.error}`)}</p>}
            <div className="mt-4">
              <Submit label={t("send")} pending={t("sending")} />
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">{t("privacy")}</p>
          </form>
        </div>
      )}
    </>
  )
}
