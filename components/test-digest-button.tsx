"use client"

import { useState, useTransition } from "react"
import { FlaskConical, CheckCircle2, AlertTriangle } from "lucide-react"
import { sendTestDigestAction, type CommsResult } from "@/lib/admin-comms-actions"

export function TestDigestButton() {
  const [result, setResult] = useState<CommsResult | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => startTransition(async () => setResult(await sendTestDigestAction()))}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary/40 disabled:opacity-40"
      >
        <FlaskConical className="h-4 w-4" />
        {pending ? "Sending…" : "Send test digest to me"}
      </button>
      {result && (
        <p
          className={`flex items-start gap-2 text-sm ${result.ok ? "text-success" : "text-destructive"}`}
        >
          {result.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
          {result.message}
        </p>
      )}
    </div>
  )
}
