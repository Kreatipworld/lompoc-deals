"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { db } from "@/db/client"
import { users, businessClaims, subscriptions } from "@/db/schema"
import { signIn, signOut } from "@/auth"
import { stripe, TIERS } from "@/lib/stripe"

const signupSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // "premium" is a signup-only role that creates a business account + Stripe checkout
  role: z.enum(["local", "business", "premium"]),
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
  // "premium" is a UI-only value; DB role is "business" for both business and premium
  const selectedRole = claimSlug ? "business" : parsed.data.role
  const dbRole = selectedRole === "premium" ? "business" : selectedRole

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  })
  if (existing) {
    return { error: "An account with that email already exists" }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const inserted = await db
    .insert(users)
    .values({ email, passwordHash, role: dbRole })
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

  // Premium signup: create Stripe checkout session and redirect there
  if (selectedRole === "premium" && newUserId) {
    const priceId = TIERS.premium.priceId
    const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"

    if (priceId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId: String(newUserId) },
      })
      // Create a pending subscription record so the webhook can update it
      await db.insert(subscriptions).values({
        userId: newUserId,
        stripeCustomerId: customer.id,
        tier: "free",
        status: "trialing",
        cancelAtPeriodEnd: 0,
      })
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${baseUrl}/dashboard/billing?success=1`,
        cancel_url: `${baseUrl}/signup?plan=premium&canceled=1`,
        metadata: { userId: String(newUserId), tier: "premium" },
        subscription_data: {
          metadata: { userId: String(newUserId), tier: "premium" },
        },
      })
      redirect(checkoutSession.url!)
    } else {
      // Stripe price not configured — redirect to billing to set up later
      redirect("/dashboard/billing?setup_required=1")
    }
  }

  if (claimSlug) {
    redirect(`/dashboard/profile?claimed=${encodeURIComponent(claimSlug)}`)
  }
  redirect(dbRole === "business" ? "/dashboard/profile" : "/account")
}

/** Return a redirect destination that the given role is actually allowed to visit. */
function safeDestination(from: string | null, role: string): string {
  if (from) {
    const isMerchantOnly = from.startsWith("/dashboard")
    const isAdminOnly = from.startsWith("/admin")
    if (isMerchantOnly && role === "business") return from
    if (isAdminOnly && role === "admin") return from
    // `from` leads somewhere the user can't access — fall through to default
    if (!isMerchantOnly && !isAdminOnly) return from
  }
  if (role === "business") return "/dashboard/profile"
  if (role === "admin") return "/admin"
  return "/account"
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
  const role = user?.role ?? "local"
  const destination = safeDestination(from, role)
  redirect(destination)
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" })
}
