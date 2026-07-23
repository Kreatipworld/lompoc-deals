"use client"

import { useState, useTransition, useCallback, useEffect, useRef } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { Link } from "@/i18n/navigation"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  Check,
  Crown,
  ChevronRight,
  ChevronLeft,
  Building2,
  Mail,
  Lock,
  Phone,
  MapPin,
  User,
} from "lucide-react"
import {
  validateStep1Action,
  businessSignupSubmitAction,
  type BizSignupState,
} from "@/lib/business-signup-actions"
import { TIERS } from "@/lib/stripe"
import { DURATION, EASE, usePrefersReducedMotion } from "@/lib/motion"
import type { Category } from "./page"

// ── Shared submit button ────────────────────────────────────────────────────

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  const t = useTranslations("signupBusiness")
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? t("buttons.pleaseWait") : label}
      {!pending && <ChevronRight className="h-4 w-4" />}
    </button>
  )
}

// ── Step progress indicator ────────────────────────────────────────────────

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < current ? "bg-primary" : i === current ? "bg-primary/60" : "bg-border"
          }`}
        />
      ))}
    </div>
  )
}

// ── Step 1 — Account creation ───────────────────────────────────────────────

function Step1({
  categories,
  onNext,
  defaultValues,
}: {
  categories: Category[]
  onNext: (data: Record<string, string>) => void
  defaultValues: Record<string, string>
}) {
  const t = useTranslations("signupBusiness")
  const [state, action] = useFormState<BizSignupState, FormData>(
    validateStep1Action,
    undefined
  )
  const [isPending, startTransition] = useTransition()
  // Mobile vendors, home-based and PO-box businesses opt out of the address
  // field entirely rather than being forced to invent one.
  const [noAddress, setNoAddress] = useState(false)
  // Lompoc-biased street suggestions from /api/address-autocomplete, debounced.
  // Only the street line is shown — city/state/ZIP are handled by the ZIP pills.
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([])
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onAddressInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const q = e.currentTarget.value
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    if (q.trim().length < 3) { setAddressSuggestions([]); return }
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/address-autocomplete?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        const streets = (data.suggestions ?? []).map((s: string) => s.split(",")[0].trim())
        setAddressSuggestions(Array.from(new Set(streets)))
      } catch { /* suggestions are best-effort */ }
    }, 300)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      // Compose the full address from street + ZIP pill so nobody has to know
      // our address format — the ZIP is always present and always in-area.
      const street = String(fd.get("street") ?? "").trim()
      const zip = String(fd.get("zip") ?? "93436")
      if (street) {
        const city = zip === "93437" ? "Vandenberg SFB" : "Lompoc"
        fd.set("address", `${street}, ${city}, CA ${zip}`)
      }
      const data: Record<string, string> = {}
      Array.from(fd.entries()).forEach(([k, v]) => { data[k] = String(v) })

      startTransition(async () => {
        const result = await validateStep1Action(undefined, fd)
        if (!result?.error) {
          onNext(data)
        } else {
          action(fd)
        }
      })
    },
    [action, onNext]
  )

  const field = (name: string, label: string, icon: React.ReactNode, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <input
          id={name}
          name={name}
          defaultValue={defaultValues[name] ?? ""}
          className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
          {...props}
        />
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {field("ownerFullName", t("step1.ownerFullNameLabel"), <User className="h-4 w-4" />, {
        required: true,
        placeholder: t("step1.ownerFullNamePlaceholder"),
        autoComplete: "name",
      })}
      {field("businessName", t("step1.businessNameLabel"), <Building2 className="h-4 w-4" />, {
        required: true,
        placeholder: t("step1.businessNamePlaceholder"),
      })}
      {field("email", t("step1.emailLabel"), <Mail className="h-4 w-4" />, {
        type: "email",
        required: true,
        autoComplete: "email",
        placeholder: t("step1.emailPlaceholder"),
      })}
      {field("password", t("step1.passwordLabel"), <Lock className="h-4 w-4" />, {
        type: "password",
        required: true,
        minLength: 6,
        autoComplete: "new-password",
        placeholder: t("step1.passwordPlaceholder"),
      })}

      <div className="space-y-1.5">
        <label htmlFor="categoryId" className="text-sm font-medium text-foreground">
          {t("step1.categoryLabel")}
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={defaultValues.categoryId ?? ""}
          className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
        >
          <option value="">{t("step1.categoryPlaceholder")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {field("street", t("step1.streetLabel"), <MapPin className="h-4 w-4" />, {
        required: !noAddress,
        disabled: noAddress,
        placeholder: t("step1.streetPlaceholder"),
        autoComplete: "address-line1",
        list: "address-suggestions",
        onInput: onAddressInput,
        // A disabled input submits no value, so opting out sends no address.
      })}
      <datalist id="address-suggestions">
        {addressSuggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {!noAddress && (
        <div className="space-y-1.5">
          <div className="text-sm font-medium text-foreground">{t("step1.zipLabel")}</div>
          <div className="flex gap-2">
            {(["93436", "93437", "93438"] as const).map((z) => (
              <label key={z} className="cursor-pointer">
                <input
                  type="radio"
                  name="zip"
                  value={z}
                  defaultChecked={(defaultValues.zip ?? "93436") === z}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary hover:border-primary/50">
                  {z}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="noAddress"
          checked={noAddress}
          onChange={(e) => setNoAddress(e.target.checked)}
          className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary/30"
        />
        {t("step1.noAddressToggle")}
      </label>
      {field("phone", t("step1.phoneLabel"), <Phone className="h-4 w-4" />, {
        type: "tel",
        autoComplete: "tel",
        placeholder: t("step1.phonePlaceholder"),
      })}

      {state?.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}{" "}
          {state.error.includes("already exists") && (
            <Link href="/login" className="font-medium underline">
              {t("step1.signInLink")}
            </Link>
          )}
        </p>
      )}

      {isPending ? (
        <div className="h-11 flex items-center justify-center text-sm text-muted-foreground">
          {t("step1.checking")}
        </div>
      ) : (
        <SubmitButton label={t("step1.continueToPlan")} />
      )}

      <p className="text-center text-sm text-muted-foreground">
        {t("step1.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("step1.signIn")}
        </Link>
      </p>
    </form>
  )
}

// ── Step 2 — Plan selection ─────────────────────────────────────────────────

function Step2({
  onNext,
  onBack,
  defaultPlan,
}: {
  onNext: (plan: "free" | "standard" | "premium") => void
  onBack: () => void
  defaultPlan: "free" | "standard" | "premium"
}) {
  const t = useTranslations("signupBusiness")
  // Plus is a contact-led, higher-touch tier — never self-serve here. Any inbound
  // ?plan=premium falls back to Growth for selection.
  const [selected, setSelected] = useState<"free" | "standard">(
    defaultPlan === "premium" ? "standard" : defaultPlan
  )

  // Reusable selected-state indicator: an empty circle that fills with a check.
  const selectDot = (active: boolean) => (
    <span
      aria-hidden
      className={`absolute right-5 top-5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-transparent"
      }`}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  )

  const featureList = (features: readonly string[], muted: boolean) => (
    <ul className="mt-4 space-y-2.5">
      {features.map((f) => (
        <li
          key={f}
          className={`flex items-start gap-2 text-sm leading-snug ${
            muted ? "text-muted-foreground" : "text-foreground/80"
          }`}
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  )

  // data-wide-step lets the auth layout stretch the card to pricing width
  // while this step is mounted (see app/[locale]/(auth)/layout.tsx).
  return (
    <div data-wide-step className="space-y-6">
      {/* pt-3 keeps the floating "most popular" badge from crowding the step bar */}
      <div className="grid grid-cols-1 gap-4 pt-3 md:grid-cols-3">
        {/* Free — understated */}
        <button
          type="button"
          onClick={() => setSelected("free")}
          aria-pressed={selected === "free"}
          className={`relative flex h-full flex-col rounded-3xl border-2 p-6 text-left transition-all duration-200 active:scale-[0.99] ${
            selected === "free"
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border bg-card shadow-sm hover:border-primary/40"
          }`}
        >
          {selectDot(selected === "free")}
          <div className="font-display text-lg font-semibold">{TIERS.free.name}</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-display text-3xl font-bold tracking-tight">
              {t("step2.free")}
            </span>
          </div>
          {featureList(TIERS.free.features, true)}
        </button>

        {/* Growth — the hero: preselected, most popular, richest treatment */}
        <button
          type="button"
          onClick={() => setSelected("standard")}
          aria-pressed={selected === "standard"}
          className={`relative order-first flex h-full flex-col rounded-3xl border-2 p-6 text-left transition-all duration-200 active:scale-[0.99] md:order-none ${
            selected === "standard"
              ? "border-primary bg-gradient-to-b from-primary/[0.08] via-card to-card shadow-lg shadow-primary/15 ring-2 ring-primary/20"
              : "border-primary/50 bg-gradient-to-b from-primary/[0.05] via-card to-card shadow-md hover:border-primary"
          }`}
        >
          <span className="absolute -top-3 left-6 rounded-full bg-gold px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-gold-foreground shadow-sm">
            {t("step2.mostPopular")}
          </span>
          {selectDot(selected === "standard")}
          <div className="font-display text-lg font-semibold text-primary">
            {TIERS.standard.name}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-display text-4xl font-bold tracking-tight">
              ${TIERS.standard.price}
            </span>
            <span className="text-sm text-muted-foreground">{t("step2.perMonth")}</span>
          </div>
          {featureList(TIERS.standard.features, false)}
        </button>

        {/* Plus / Official Partner: contact-only, not a self-serve checkout. */}
        <div className="relative flex h-full flex-col rounded-3xl border-2 border-border bg-muted/40 p-6 text-left shadow-sm">
          <Crown className="absolute right-5 top-5 h-5 w-5 text-gold" />
          <div className="font-display text-lg font-semibold">{TIERS.premium.name}</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-display text-2xl font-bold tracking-tight">
              {t("step2.plusContact")}
            </span>
          </div>
          {featureList(TIERS.premium.features, true)}
          <div aria-hidden className="min-h-5 flex-1" />
          <a
            href="mailto:hello@lompoclocals.com?subject=Lompoc%20Locals%20Plus"
            className="inline-flex h-10 w-full items-center justify-center rounded-full border border-primary/40 px-4 text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            {t("step2.plusContactCta")}
          </a>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border px-5 text-sm font-medium transition hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("step2.back")}
        </button>
        <button
          type="button"
          onClick={() => onNext(selected)}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          {t("step2.continueWith", { planName: TIERS[selected].name })}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 3 — Payment (Stripe) ───────────────────────────────────────────────

function Step3({
  plan,
  step1Data,
  onBack,
  showCanceled,
}: {
  plan: "free" | "standard" | "premium"
  step1Data: Record<string, string>
  onBack: () => void
  showCanceled: boolean
}) {
  const t = useTranslations("signupBusiness")
  const [state, action] = useFormState<BizSignupState, FormData>(
    businessSignupSubmitAction,
    undefined
  )
  const stripeConfigured = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  const overlayShown = !!state?.checkoutUrl

  return (
    <>
      {overlayShown && <SignupSuccessMoment checkoutUrl={state!.checkoutUrl!} />}
      <form
        action={action}
        className="space-y-5"
        inert={overlayShown ? true : undefined}
      >
        {/* Hidden fields carry wizard state */}
        {Object.entries(step1Data).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <input type="hidden" name="plan" value={plan} />

        {showCanceled && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t("step3.canceledBanner")}
          </div>
        )}

        {plan === "free" ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-900">
            <p className="font-semibold">{t("step3.freePlanTitle")}</p>
            <p className="mt-1 text-green-700">
              {t("step3.freePlanBody")}
            </p>
          </div>
        ) : !stripeConfigured ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-semibold">{t("step3.stripeComingSoonTitle")}</p>
            <p className="mt-1 text-amber-700">
              {t("step3.stripeComingSoonBody")}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5 text-sm">
            <p className="font-semibold">
              {TIERS[plan].name} — ${TIERS[plan].price}/mo
            </p>
            <p className="mt-1 text-muted-foreground">
              {t("step3.paidPlanBody")}
            </p>
          </div>
        )}

        {state?.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}{" "}
            {state.error.includes("already exists") && (
              <Link href="/login" className="font-medium underline">
                {t("step3.signInLink")}
              </Link>
            )}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border px-5 text-sm font-medium transition hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("step3.back")}
          </button>
          <SubmitButton
            label={plan === "free" || !stripeConfigured ? t("buttons.createAccount") : t("buttons.payAndCreate")}
          />
        </div>
      </form>
    </>
  )
}

// ── Success moment — shown briefly before Stripe redirect ───────────────────
function SignupSuccessMoment({ checkoutUrl }: { checkoutUrl: string }) {
  const t = useTranslations("signupBusiness")
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (reducedMotion) {
      const t = setTimeout(() => {
        window.location.href = checkoutUrl
      }, 100)
      return () => clearTimeout(t)
    }

    let cancelled = false
    ;(async () => {
      const { animate } = await import("animejs")
      if (cancelled) return

      const check = container.querySelector<HTMLElement>("[data-check]")
      const sweep = container.querySelector<HTMLElement>("[data-sweep]")

      if (check) {
        animate(check, {
          opacity: [0, 1],
          scale: [0.6, 1.1, 1],
          duration: 450,
          easing: EASE.standard,
        })
      }
      if (sweep) {
        animate(sweep, {
          scaleX: [0, 1],
          opacity: [0, 1],
          duration: 450,
          delay: 100,
          easing: EASE.standard,
        })
      }
    })()

    const redirectTimer = setTimeout(() => {
      window.location.href = checkoutUrl
    }, DURATION.success)

    return () => {
      cancelled = true
      clearTimeout(redirectTimer)
    }
  }, [checkoutUrl, reducedMotion])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={t("successMoment.ariaLabel")}
    >
      <div
        data-check
        className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        style={{ opacity: reducedMotion ? 1 : 0 }}
      >
        <Check className="h-10 w-10" strokeWidth={3} />
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="font-display text-xl font-semibold tracking-tight">
          {t("successMoment.accountCreated")}
        </p>
        <div
          data-sweep
          className="h-[2px] w-32 origin-left rounded-full bg-gradient-to-r from-primary via-primary to-transparent"
          style={{
            opacity: reducedMotion ? 1 : 0,
            transform: reducedMotion ? "none" : "scaleX(0)",
          }}
        />
        <p className="text-sm text-muted-foreground">
          {t("successMoment.redirecting")}
        </p>
      </div>
    </div>
  )
}

// ── Wizard orchestrator ─────────────────────────────────────────────────────

export function BusinessSignupWizard({
  categories,
  initialStep,
  showCanceled,
}: {
  categories: Category[]
  initialStep: number
  showCanceled: boolean
}) {
  const t = useTranslations("signupBusiness")
  const router = useRouter()
  const [step, setStep] = useState(initialStep)
  const [step1Data, setStep1Data] = useState<Record<string, string>>({})
  const [plan, setPlan] = useState<"free" | "standard" | "premium">("standard")

  const stepContainerRef = useRef<HTMLDivElement>(null)
  const prevStepRef = useRef(step)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const container = stepContainerRef.current
    if (!container) return
    if (reducedMotion) {
      prevStepRef.current = step
      return
    }
    if (prevStepRef.current === step) return

    const forward = step > prevStepRef.current
    prevStepRef.current = step

    let cancelled = false
    ;(async () => {
      const { animate } = await import("animejs")
      if (cancelled) return
      animate(container, {
        opacity: [0, 1],
        translateX: [forward ? 20 : -20, 0],
        duration: DURATION.transition,
        easing: EASE.standard,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [step, reducedMotion])

  // Restore step1Data and plan from sessionStorage on mount (covers page reloads and soft-nav remounts)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("bizSignupStep1")
      if (saved && Object.keys(step1Data).length === 0) setStep1Data(JSON.parse(saved))
      const savedPlan = sessionStorage.getItem("bizSignupPlan") as "free" | "standard" | "premium" | null
      // Plus is contact-only; never restore a self-serve premium selection.
      if (savedPlan) setPlan(savedPlan === "premium" ? "standard" : savedPlan)
    } catch {
      // ignore – sessionStorage unavailable (private mode, etc.)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep sessionStorage in sync whenever step1Data or plan change
  useEffect(() => {
    if (Object.keys(step1Data).length === 0) return
    try { sessionStorage.setItem("bizSignupStep1", JSON.stringify(step1Data)) } catch {}
  }, [step1Data])

  useEffect(() => {
    try { sessionStorage.setItem("bizSignupPlan", plan) } catch {}
  }, [plan])

  const STEP_LABELS = [
    t("stepLabels.accountInfo"),
    t("stepLabels.choosePlan"),
    t("stepLabels.payment"),
  ]

  const goToStep = (n: number) => {
    setStep(n)
    router.replace(`?step=${n + 1}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("stepBar.stepOf", { current: step + 1, total: STEP_LABELS.length })}</span>
          <span>{STEP_LABELS[step]}</span>
        </div>
        <StepBar current={step} total={STEP_LABELS.length} />
      </div>

      <div ref={stepContainerRef}>
        {step === 0 && (
          <Step1
            categories={categories}
            defaultValues={step1Data}
            onNext={(data) => {
              setStep1Data(data)
              goToStep(1)
            }}
          />
        )}
        {step === 1 && (
          <Step2
            defaultPlan={plan}
            onNext={(p) => {
              setPlan(p)
              goToStep(2)
            }}
            onBack={() => goToStep(0)}
          />
        )}
        {step === 2 && (
          <Step3
            plan={plan}
            step1Data={step1Data}
            showCanceled={showCanceled}
            onBack={() => goToStep(1)}
          />
        )}
      </div>
    </div>
  )
}
