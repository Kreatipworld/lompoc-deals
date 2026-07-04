"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { getTranslations } from "next-intl/server"
import { db } from "@/db/client"
import { users } from "@/db/schema"
import { signIn } from "@/auth"
import { sendWelcomeEmail } from "@/lib/email"
import { getCurrentLocale } from "@/lib/i18n-helpers"
import { track, stitchSession } from "@/lib/analytics/track"
import { getSessionId } from "@/lib/analytics/session"

const localSignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  city: z.string().optional(),
  zip: z.string().optional(),
  interests: z.array(z.string()).optional(),
})

export type LocalSignupState = { error?: string } | undefined

/** Return a redirect destination for a freshly-created local user, mirroring
 * the safeDestination check in lib/auth-actions.ts — a local user can never
 * land on /dashboard or /admin, so those are excluded even if requested. */
function safeLocalDestination(from: string | null): string {
  if (
    from &&
    from.startsWith("/") &&
    !from.startsWith("/dashboard") &&
    !from.startsWith("/admin")
  ) {
    return from
  }
  return "/account"
}

export async function localSignupAction(
  _prev: LocalSignupState,
  formData: FormData
): Promise<LocalSignupState> {
  const t = await getTranslations("errors.userSignup")
  const rawInterests = formData.getAll("interests").map((i) => String(i))

  const parsed = localSignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    city: formData.get("city") || undefined,
    zip: formData.get("zip") || undefined,
    interests: rawInterests.length > 0 ? rawInterests : undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("invalidInput") }
  }

  const { name, email, password, city, zip, interests } = parsed.data
  const from = (formData.get("from") as string | null) || null

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  })
  if (existing) {
    return { error: t("emailAlreadyExists") }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const locale = await getCurrentLocale()
  const [newUser] = await db.insert(users).values({
    email,
    passwordHash,
    role: "local",
    name,
    city: city ?? null,
    zip: zip ?? null,
    interestsJson: interests && interests.length > 0 ? interests : null,
    locale,
  }).returning({ id: users.id })

  // Stitch anonymous session to new user, then track signup
  const sid = getSessionId()
  if (sid && newUser) await stitchSession(sid, newUser.id)
  if (newUser) {
    await track("local_signup", {
      userId: newUser.id,
      sessionId: sid,
      targetType: "user",
      targetId: newUser.id,
      props: { via: "email" },
    })
  }

  // Fire-and-forget welcome email — don't block signup on failure
  sendWelcomeEmail(email, name, "local", locale).catch((err) =>
    console.error("[localSignupAction] welcome email failed:", err)
  )

  let autoSignInOk = true
  try {
    await signIn("credentials", { email, password, redirect: false })
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: t("accountCreatedSignInFailed") }
    }
    // Unexpected error (e.g. crypto failure, network issue): account was
    // created — fall back to manual login rather than crashing the page.
    console.error("[localSignupAction] auto sign-in failed:", err)
    autoSignInOk = false
  }

  if (!autoSignInOk) {
    redirect(from ? `/login?from=${encodeURIComponent(from)}` : "/login")
  }

  redirect(safeLocalDestination(from))
}

