"use client"

import { useFormState, useFormStatus } from "react-dom"
import { Link } from "@/i18n/navigation"
import { Mail, Lock } from "lucide-react"
import { loginAction, type FormState } from "@/lib/auth-actions"
import { useTranslations } from "next-intl"

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations("auth")
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-[transform,background-color,opacity] duration-150 hover:bg-primary/90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? t("login.submitPending") : t("login.submitIdle")}
    </button>
  )
}

export function LoginForm({ from }: { from?: string }) {
  const [state, action] = useFormState<FormState, FormData>(
    loginAction,
    undefined
  )
  const t = useTranslations("auth")

  return (
    <form action={action} className="space-y-5">
      {from && <input type="hidden" name="from" value={from} />}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          {t("login.emailLabel")}
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder={t("login.emailPlaceholder")}
            className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            {t("login.passwordLabel")}
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary hover:underline"
          >
            {t("login.forgotPassword")}
          </Link>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
          />
        </div>
      </div>

      {state?.error && (
        <p className="form-message-enter rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="text-center text-sm text-muted-foreground">
        {t("login.newHere")}{" "}
        <Link
          href="/signup"
          className="font-medium text-primary hover:underline"
        >
          {t("login.createAccount")}
        </Link>
      </p>
    </form>
  )
}
