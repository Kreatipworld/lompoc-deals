"use client"

import { useState } from "react"
import { Bug } from "lucide-react"

/**
 * "Report a bug" — the one button that turns a bad moment into a fix.
 * Lives on the error page, the 404 page, and in the footer. Self-contained on
 * purpose: it renders inside a crashed tree, so it must not depend on the
 * next-intl provider or anything else that may be the thing that broke.
 * Copy follows the URL locale (/es/…).
 */
type Source = "error" | "not_found" | "footer"

const COPY = {
  en: {
    button: "Report a bug",
    title: "What went wrong?",
    hint: "Tell us what you were trying to do. One sentence is plenty.",
    placeholder: "I tapped a home on the map and the page went blank…",
    email: "Your email (optional, so we can tell you when it's fixed)",
    send: "Send report",
    sending: "Sending…",
    cancel: "Cancel",
    thanks: "Thank you. Every report makes Lompoc Locals better.",
    failed: "Could not send right now. Email us at hello@lompoclocals.com.",
    tooShort: "Add a few words about what happened.",
  },
  es: {
    button: "Reportar un error",
    title: "¿Qué salió mal?",
    hint: "Cuéntanos qué intentabas hacer. Con una frase basta.",
    placeholder: "Toqué una casa en el mapa y la página se quedó en blanco…",
    email: "Tu correo (opcional, para avisarte cuando esté arreglado)",
    send: "Enviar reporte",
    sending: "Enviando…",
    cancel: "Cancelar",
    thanks: "Gracias. Cada reporte hace mejor a Lompoc Locals.",
    failed: "No se pudo enviar ahora. Escríbenos a hello@lompoclocals.com.",
    tooShort: "Escribe unas palabras sobre lo que pasó.",
  },
}

function localeFromPath(): "en" | "es" {
  if (typeof window === "undefined") return "en"
  return /^\/es(\/|$)/.test(window.location.pathname) ? "es" : "en"
}

export function ReportBug({
  source,
  errorMessage,
  digest,
  variant = "button",
  className = "",
}: {
  source: Source
  errorMessage?: string | null
  digest?: string | null
  variant?: "button" | "link"
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [note, setNote] = useState<string | null>(null)
  const locale = localeFromPath()
  const c = COPY[locale]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (description.trim().length < 5) {
      setNote(c.tooShort)
      return
    }
    setState("sending")
    setNote(null)
    const route = typeof window !== "undefined" ? window.location.pathname + window.location.search : ""
    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description, email: email || undefined, route, errorMessage: errorMessage ?? undefined, digest: digest ?? undefined, locale, source }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: number }
      if (!res.ok || !data.ok) throw new Error("send failed")
      setState("sent")
      // The report itself is the event: route + source + id, queryable next to client_error.
      fetch("/api/track/event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "bug_report", props: { route, source, reportId: data.id } }),
        keepalive: true,
      }).catch(() => {})
    } catch {
      setState("failed")
      setNote(c.failed)
    }
  }

  const trigger =
    variant === "link" ? (
      <button type="button" onClick={() => setOpen(true)} data-report-bug={source} className={`inline-flex items-center gap-1.5 hover:text-foreground ${className}`}>
        <Bug className="h-3.5 w-3.5" />
        {c.button}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-report-bug={source}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-semibold transition hover:bg-accent ${className}`}
      >
        <Bug className="h-4 w-4" />
        {c.button}
      </button>
    )

  if (!open) return trigger

  const panel = (
    <div data-report-bug-form className="w-full rounded-[20px] border border-border/80 bg-card p-5 text-left shadow-lg">
      {state === "sent" ? (
        <p className="text-sm font-medium text-success" data-report-bug-sent>
          {c.thanks}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">{c.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
          </div>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={c.placeholder}
            rows={3}
            required
            maxLength={2000}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
          />
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={c.email}
            maxLength={320}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
          />
          {note && <p className="text-xs text-destructive">{note}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={state === "sending"}
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {state === "sending" ? c.sending : c.send}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">
              {c.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  )

  if (variant === "link") {
    return (
      <>
        {trigger}
        <div className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[380px]">{panel}</div>
      </>
    )
  }
  return <div className="mt-4 w-full">{panel}</div>
}
