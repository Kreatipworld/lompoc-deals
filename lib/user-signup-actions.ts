"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { db } from "@/db/client"
import { users } from "@/db/schema"
import { signIn } from "@/auth"

const localSignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  city: z.string().optional(),
  zip: z.string().optional(),
  interests: z.array(z.string()).optional(),
})

export type LocalSignupState = { error?: string } | undefined

export async function localSignupAction(
  _prev: LocalSignupState,
  formData: FormData
): Promise<LocalSignupState> {
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
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { name, email, password, city, zip, interests } = parsed.data

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  })
  if (existing) {
    return { error: "An account with that email already exists" }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await db.insert(users).values({
    email,
    passwordHash,
    role: "local",
    name,
    city: city ?? null,
    zip: zip ?? null,
    interestsJson: interests && interests.length > 0 ? interests : null,
  })

  let autoSignInOk = true
  try {
    await signIn("credentials", { email, password, redirect: false })
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Account created but sign-in failed. Please log in." }
    }
    // Unexpected error (e.g. crypto failure, network issue): account was
    // created — fall back to manual login rather than crashing the page.
    console.error("[localSignupAction] auto sign-in failed:", err)
    autoSignInOk = false
  }

  redirect(autoSignInOk ? "/account" : "/login")
}

