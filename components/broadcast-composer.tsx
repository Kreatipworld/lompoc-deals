"use client"

import { useState, useTransition } from "react"
import { Send, FlaskConical, AlertTriangle, CheckCircle2 } from "lucide-react"
import { sendBroadcastAction, type CommsResult } from "@/lib/admin-comms-actions"

// Admin-only tool (English UI). Enforced flow: test-to-me → confirm with
// recipient count → send. The server independently requires confirm="yes".
export function BroadcastComposer({ confirmedCount }: { confirmedCount: number }) {
  const [subject, setSubject] = useState("")
  const [bodyEn, setBodyEn] = useState("")
  const [bodyEs, setBodyEs] = useState("")
  const [tested, setTested] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<CommsResult | null>(null)
  const [pending, startTransition] = useTransition()

  function buildForm(mode: "test" | "send") {
    const fd = new FormData()
    fd.set("mode", mode)
    fd.set("subject", subject)
    fd.set("bodyEn", bodyEn)
    fd.set("bodyEs", bodyEs)
    if (mode === "send") fd.set("confirm", "yes")
    return fd
  }

  function runTest() {
    startTransition(async () => {
      const r = await sendBroadcastAction(buildForm("test"))
      setResult(r)
      if (r.ok) setTested(true)
    })
  }

  function runSend() {
    startTransition(async () => {
      const r = await sendBroadcastAction(buildForm("send"))
      setResult(r)
      setConfirming(false)
      if (r.ok) {
        setTested(false)
        setSubject("")
        setBodyEn("")
        setBodyEs("")
      }
    })
  }

  const canTest = subject.trim().length > 0 && bodyEn.trim().length > 0 && !pending

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Subject
        </label>
        <input
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value)
            setTested(false)
          }}
          placeholder="Flower Festival week — what's on"
          className="mt-1 w-full rounded-xl border bg-background px-4 py-2.5 text-sm"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Body — English
          </label>
          <textarea
            value={bodyEn}
            onChange={(e) => {
              setBodyEn(e.target.value)
              setTested(false)
            }}
            rows={7}
            placeholder="Hi neighbors — here's what's happening this week…"
            className="mt-1 w-full rounded-xl border bg-background px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Body — Spanish (optional; English is used if empty)
          </label>
          <textarea
            value={bodyEs}
            onChange={(e) => {
              setBodyEs(e.target.value)
              setTested(false)
            }}
            rows={7}
            placeholder="Hola vecinos — esto es lo que pasa esta semana…"
            className="mt-1 w-full rounded-xl border bg-background px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {result && (
        <p
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            result.ok ? "border-success/40 bg-success/5 text-success" : "border-destructive/40 bg-destructive/5 text-destructive"
          }`}
        >
          {result.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
          {result.message}
        </p>
      )}

      {!confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runTest}
            disabled={!canTest}
            className="inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary/40 disabled:opacity-40"
          >
            <FlaskConical className="h-4 w-4" />
            {pending ? "Sending…" : "Send test to me"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={!tested || pending}
            title={tested ? undefined : "Send yourself a test first"}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            Broadcast…
          </button>
          {!tested && (
            <span className="text-xs text-muted-foreground">
              Test yourself first — the broadcast button unlocks after.
            </span>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-gold/50 bg-gold/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-gold-foreground" />
            This sends to {confirmedCount} confirmed subscriber{confirmedCount === 1 ? "" : "s"}. No undo.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={runSend}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              {pending ? "Broadcasting…" : `Yes, send to ${confirmedCount}`}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="rounded-full border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:border-foreground/30"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
