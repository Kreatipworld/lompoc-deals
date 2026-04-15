"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { db } from "@/db/client"
import { users, businesses, subscriptions } from "@/db/schema"
import { signIn } from "@/auth"
import { stripe, TIERS } from "@/lib/stripe"
import type { TierKey } from "@/lib/stripe"
import { uploadImage } from "@/lib/blob"
import { geocodeAddress } from "@/lib/geocode"
import { sendWelcomeEmail } from "@/lib/email"

// ─── Step 1 — Account creation ──────────────────────────────────────────────

const step1Schema = z.object({
  ownerFullName: z.string().min(2, "Owner name must be at least 2 characters"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  categoryId: z.coerce.number().int().positive().optional(),
  address: z.string().min(5, "Enter a valid address"),
  phone: z.string().optional(),
})

export type BizSignupState = { error?: string } | undefined

/** Validates Step 1 data — called client-side via action to get inline errors. */
export async function validateStep1Action(
  _prev: BizSignupState,
  formData: FormData
): Promise<BizSignupState> {
  const parsed = step1Schema.safeParse({
    ownerFullName: formData.get("ownerFullName"),
    businessName: formData.get("businessName"),
    email: formData.get("email"),
    password: formData.get("password"),
    categoryId: formData.get("categoryId") || undefined,
    address: formData.get("address"),
    phone: formData.get("phone") || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  })
  if (existing) {
    return { error: "An account with that email already exists" }
  }

  // Valid — no error returned (caller advances to step 2)
}

// ─── Final submit — creates account, subscription, redirects to Stripe or step 4 ─

const finalSchema = z.object({
  ownerFullName: z.string().min(2),
  businessName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  categoryId: z.coerce.number().int().positive().optional(),
  address: z.string().min(5),
  phone: z.string().optional(),
  plan: z.enum(["free", "standard", "premium"]),
})

export async function businessSignupSubmitAction(
  _prev: BizSignupState,
  formData: FormData
): Promise<BizSignupState> {
  // Guard: if account fields are missing the session was lost — tell the user to restart
  if (!formData.get("email")) {
    return { error: "Your session expired. Please go back to step 1 and re-enter your details." }
  }

  const parsed = finalSchema.safeParse({
    ownerFullName: formData.get("ownerFullName") ?? "",
    businessName: formData.get("businessName") ?? "",
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
    categoryId: formData.get("categoryId") || undefined,
    address: formData.get("address") ?? "",
    phone: formData.get("phone") || undefined,
    plan: formData.get("plan") ?? "",
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { ownerFullName, businessName, email, password, categoryId, address, phone, plan } =
    parsed.data

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    // Check if this is a resume-after-Stripe-cancel scenario:
    // the user's account was created but payment never completed.
    const passwordMatch = await bcrypt.compare(password, existing.passwordHash)
    if (passwordMatch && existing.role === "business") {
      const existingSub = await db.query.subscriptions.findFirst({
        where: (s, { eq: e }) => e(s.userId, existing.id),
      })
      if (existingSub?.status === "trialing" && plan !== "free") {
        // Resume: create a new Stripe checkout for the existing customer
        const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"
        const tierKey = plan as TierKey
        const priceId = TIERS[tierKey].priceId
        if (priceId) {
          try {
            const customerId =
              existingSub.stripeCustomerId ??
              (
                await stripe.customers.create({
                  email,
                  metadata: { userId: String(existing.id) },
                })
              ).id

            if (!existingSub.stripeCustomerId) {
              await db
                .update(subscriptions)
                .set({ stripeCustomerId: customerId })
                .where(eq(subscriptions.userId, existing.id))
            }

            const checkoutSession = await stripe.checkout.sessions.create({
              customer: customerId,
              mode: "subscription",
              payment_method_types: ["card"],
              line_items: [{ price: priceId, quantity: 1 }],
              success_url: `${baseUrl}/signup/business/profile?userId=${existing.id}&session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${baseUrl}/signup/business?step=3&canceled=1`,
              metadata: { userId: String(existing.id), tier: plan },
              subscription_data: { metadata: { userId: String(existing.id), tier: plan } },
            })

            if (!checkoutSession.url) {
              return { error: "Could not create checkout session. Please try again." }
            }

            // Sign in the existing user before redirecting
            try {
              await signIn("credentials", { email, password, redirect: false })
            } catch (err) {
              if (err instanceof AuthError) {
                return { error: "Sign-in failed. Please sign in and visit your dashboard." }
              }
              throw err
            }

            redirect(checkoutSession.url)
          } catch (err) {
            if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err
            return { error: "Payment setup failed. Please try again or contact support." }
          }
        }
      }
    }
    return {
      error:
        "An account with that email already exists. Please sign in instead.",
    }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const [newUser] = await db
    .insert(users)
    .values({ email, passwordHash, role: "business" })
    .returning({ id: users.id })

  const userId = newUser.id

  // Slugify business name
  const slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  // Geocode address
  let coords: { lat: number; lng: number } | null = null
  try {
    coords = await geocodeAddress(address)
  } catch {
    // non-fatal — continue without coords
  }

  await db.insert(businesses).values({
    ownerUserId: userId,
    ownerFullName,
    name: businessName,
    slug,
    address,
    lat: coords?.lat,
    lng: coords?.lng,
    phone: phone ?? null,
    categoryId: categoryId ?? null,
    status: "pending",
  })

  // Fire-and-forget welcome email — don't block signup on failure
  sendWelcomeEmail(email, ownerFullName, "business").catch((err) =>
    console.error("[businessSignupSubmitAction] welcome email failed:", err)
  )

  // Auto sign-in
  try {
    await signIn("credentials", { email, password, redirect: false })
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Account created but sign-in failed. Please log in." }
    }
    throw err
  }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"
  const tierKey = plan as TierKey

  if (plan === "free") {
    // Free plan — create subscription record and go straight to profile setup
    await db.insert(subscriptions).values({
      userId,
      tier: "free",
      status: "active",
      cancelAtPeriodEnd: 0,
    })
    redirect(`/signup/business/profile?userId=${userId}`)
  }

  // Paid plan — Stripe checkout
  const priceId = TIERS[tierKey].priceId
  if (!priceId) {
    // Stripe not configured — create free sub, skip to profile with a notice
    await db.insert(subscriptions).values({
      userId,
      tier: "free",
      status: "active",
      cancelAtPeriodEnd: 0,
    })
    redirect(`/signup/business/profile?userId=${userId}&stripe_pending=1`)
  }

  try {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId: String(userId) },
    })
    await db.insert(subscriptions).values({
      userId,
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
      success_url: `${baseUrl}/signup/business/profile?userId=${userId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/signup/business?step=3&canceled=1`,
      metadata: { userId: String(userId), tier: plan },
      subscription_data: { metadata: { userId: String(userId), tier: plan } },
    })

    if (!checkoutSession.url) {
      return { error: "Could not create checkout session. Please try again." }
    }
    redirect(checkoutSession.url)
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err
    return { error: "Payment setup failed. Please try again or contact support." }
  }
}

// ─── Step 4 — Profile setup ─────────────────────────────────────────────────

const profileSchema = z.object({
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  tiktokUrl: z.string().url().optional().or(z.literal("")),
})

export type ProfileSetupState = { error?: string } | undefined

export async function profileSetupAction(
  _prev: ProfileSetupState,
  formData: FormData
): Promise<ProfileSetupState> {
  const logoFile = formData.get("logo") as File | null
  const coverFile = formData.get("cover") as File | null

  let logoUrl: string | undefined
  let coverUrl: string | undefined
  try {
    if (logoFile && logoFile.size > 0) logoUrl = await uploadImage(logoFile, "logos")
    if (coverFile && coverFile.size > 0) coverUrl = await uploadImage(coverFile, "covers")
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed" }
  }

  const parsed = profileSchema.safeParse({
    description: formData.get("description") || undefined,
    website: formData.get("website") || undefined,
    instagramUrl: formData.get("instagramUrl") || undefined,
    facebookUrl: formData.get("facebookUrl") || undefined,
    tiktokUrl: formData.get("tiktokUrl") || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const data = parsed.data

  // Find the business for the current user (just created)
  const { auth } = await import("@/auth")
  const session = await auth()
  if (!session?.user) return { error: "Not authenticated" }
  const userId = parseInt(session.user.id, 10)

  const biz = await db.query.businesses.findFirst({
    where: (b, { eq: e }) => e(b.ownerUserId, userId),
  })
  if (!biz) return { error: "Business not found" }

  await db.update(businesses).set({
    description: data.description ?? null,
    website: data.website || null,
    instagramUrl: data.instagramUrl || null,
    facebookUrl: data.facebookUrl || null,
    tiktokUrl: data.tiktokUrl || null,
    ...(logoUrl ? { logoUrl } : {}),
    ...(coverUrl ? { coverUrl } : {}),
  }).where(eq(businesses.id, biz.id))

  redirect("/signup/business/first-deal")
}
