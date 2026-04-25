"use client"

import { useState, useTransition, useCallback, useEffect, useRef } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { Link } from "@/i18n/navigation"
import { useRouter } from "next/navigation"
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
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? "Please wait…" : label}
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
  const [state, action] = useFormState<BizSignupState, FormData>(
    validateStep1Action,
    undefined
  )
  const [isPending, startTransition] = useTransition()

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
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
      {field("ownerFullName", "Your full name", <User className="h-4 w-4" />, {
        required: true,
        placeholder: "Jane Smith",
        autoComplete: "name",
      })}
      {field("businessName", "Business name", <Building2 className="h-4 w-4" />, {
        required: true,
        placeholder: "Lompoc Blooms",
      })}
      {field("email", "Email", <Mail className="h-4 w-4" />, {
        type: "email",
        required: true,
        autoComplete: "email",
        placeholder: "you@yourbusiness.com",
      })}
      {field("password", "Password", <Lock className="h-4 w-4" />, {
        type: "password",
        required: true,
        minLength: 6,
        autoComplete: "new-password",
        placeholder: "At least 6 characters",
      })}

      <div className="space-y-1.5">
        <label htmlFor="categoryId" className="text-sm font-medium text-foreground">
          Category
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={defaultValues.categoryId ?? ""}
          className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
        >
          <option value="">Select a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {field("address", "Business address", <MapPin className="h-4 w-4" />, {
        required: true,
        placeholder: "123 H St, Lompoc, CA 93436",
        autoComplete: "street-address",
      })}
      {field("phone", "Phone (optional)", <Phone className="h-4 w-4" />, {
        type: "tel",
        autoComplete: "tel",
        placeholder: "(805) 555-0100",
      })}

      {state?.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}{" "}
          {state.error.includes("already exists") && (
            <Link href="/login" className="font-medium underline">
              Sign in instead
            </Link>
          )}
        </p>
      )}

      {isPending ? (
        <div className="h-11 flex items-center justify-center text-sm text-muted-foreground">
          Checking…
        </div>
      ) : (
        <SubmitButton label="Continue to plan selection" />
      )}

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
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
  const [selected, setSelected] = useState<"free" | "standard" | "premium">(defaultPlan)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(Object.entries(TIERS) as [keyof typeof TIERS, (typeof TIERS)[keyof typeof TIERS]][]).map(
          ([key, tier]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={`relative flex flex-col rounded-3xl border-2 p-5 text-left transition ${
                selected === key
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {key === "standard" && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/30 bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              {key === "premium" && (
                <Crown className="absolute right-4 top-4 h-4 w-4 text-amber-500" />
              )}
              <div className="font-display text-base font-semibold">{tier.name}</div>
              <div className="mt-1">
                {tier.price === 0 ? (
                  <span className="font-display text-2xl font-bold">Free</span>
                ) : (
                  <>
                    <span className="font-display text-2xl font-bold">${tier.price}</span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </>
                )}
              </div>
              <ul className="mt-3 space-y-1.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          )
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border px-5 text-sm font-medium transition hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          onClick={() => onNext(selected)}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Continue with {TIERS[selected].name}
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
        // Block keyboard/pointer interaction with the underlying form while
        // the success overlay is shown — prevents tab-back focus + SR noise
        // during the 900ms pre-Stripe window.
        inert={overlayShown ? true : undefined}
      >
        {/* Hidden fields carry wizard state */}
        {Object.entries(step1Data).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <input type="hidden" name="plan" value={plan} />

        {showCanceled && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Payment was cancelled. Choose a plan and try again.
          </div>
        )}

        {plan === "free" ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-900">
            <p className="font-semibold">Free plan — no payment needed!</p>
            <p className="mt-1 text-green-700">
              You selected the Free plan. Click continue to set up your profile.
            </p>
          </div>
        ) : !stripeConfigured ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-semibold">Stripe billing coming soon</p>
            <p className="mt-1 text-amber-700">
              Payment processing isn&apos;t fully configured yet. Your account will be created on the{" "}
              <strong>Free</strong> plan and upgraded automatically once billing is enabled.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5 text-sm">
            <p className="font-semibold">
              {TIERS[plan].name} — ${TIERS[plan].price}/mo
            </p>
            <p className="mt-1 text-muted-foreground">
              You&apos;ll be securely redirected to Stripe to complete payment. Cancel anytime.
            </p>
          </div>
        )}

        {state?.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}{" "}
            {state.error.includes("already exists") && (
              <Link href="/login" className="font-medium underline">
                Sign in
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
            Back
          </button>
          <SubmitButton
            label={plan === "free" || !stripeConfigured ? "Create account" : "Pay & create account"}
          />
        </div>
      </form>
    </>
  )
}

// ── Success moment — shown briefly before Stripe redirect ───────────────────
function SignupSuccessMoment({ checkoutUrl }: { checkoutUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (reducedMotion) {
      // Short delay just to avoid a flash-of-nothing before redirect
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
      aria-label="Account created, redirecting to payment"
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
          Account created
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
          Redirecting to secure payment…
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
      if (savedPlan) setPlan(savedPlan)
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

  const STEP_LABELS = ["Account info", "Choose a plan", "Payment"]

  const goToStep = (n: number) => {
    setStep(n)
    router.replace(`?step=${n + 1}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {STEP_LABELS.length}</span>
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
