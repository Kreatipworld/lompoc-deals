"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { db } from "@/db/client"
import { users, businessClaims } from "@/db/schema"
import { signIn, signOut } from "@/auth"

const signupSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["local", "business"]),
  claimSlug: z.string().optional(),
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
    claimSlug: formData.get("claimSlug") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { email, password, claimSlug } = parsed.data
  // If claiming a business, force role=business regardless of toggle
  const role = claimSlug ? "business" : parsed.data.role

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  })
  if (existing) {
    return { error: "An account with that email already exists" }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const inserted = await db
    .insert(users)
    .values({ email, passwordHash, role })
    .returning({ id: users.id })
  const newUserId = inserted[0]?.id

  // If claiming, find the business and create a pending claim
  if (claimSlug && newUserId) {
    const biz = await db.query.businesses.findFirst({
      where: (b, { eq: e }) => e(b.slug, claimSlug),
      columns: { id: true },
    })
    if (biz) {
      await db.insert(businessClaims).values({
        businessId: biz.id,
        userId: newUserId,
        status: "pending",
      })
    }
  }

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

  if (claimSlug) {
    redirect(`/dashboard/profile?claimed=${encodeURIComponent(claimSlug)}`)
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

  // Look up role so we can redirect business users directly to their dashboard
  const user = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
    columns: { role: true },
  })

  const from = formData.get("from") as string | null
  const destination =
    from ||
    (user?.role === "business" ? "/dashboard/profile" : user?.role === "admin" ? "/admin" : "/")
  redirect(destination)
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" })
}
