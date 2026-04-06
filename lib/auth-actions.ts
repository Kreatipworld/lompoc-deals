"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { db } from "@/db/client"
import { users } from "@/db/schema"
import { signIn, signOut } from "@/auth"

const signupSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["local", "business"]),
})

export type FormState = { error?: string } | undefined

export async function signupAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { email, password, role } = parsed.data

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  })
  if (existing) {
    return { error: "An account with that email already exists" }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await db.insert(users).values({ email, passwordHash, role })

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Account created but auto sign-in failed. Try logging in." }
    }
    throw err
  }

  redirect(role === "business" ? "/dashboard/profile" : "/")
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password required"),
})

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password" }
    }
    throw err
  }

  const from = (formData.get("from") as string) || "/"
  redirect(from)
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" })
}
