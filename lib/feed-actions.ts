"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { feedPosts } from "@/db/schema"
import { uploadImage } from "@/lib/blob"
import { geocodeAddress } from "@/lib/geocode"
import { lompocAddressError } from "@/lib/lompoc-zip"
import { addDays, computeExpiration } from "@/lib/feed-expiration"

async function requireLocalUser() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Not authorized — sign in required")
  }
  return { userId: parseInt(session.user.id, 10) }
}

// ─── Submit a new feed post ─────────────────────────────────────────────────

const submitSchema = z
  .object({
    type: z.enum(["for_sale", "info"]),
    title: z.string().min(2, "Title must be at least 2 characters").max(200),
    description: z.string().min(10, "Description must be at least 10 characters"),
    priceCents: z.coerce.number().int().min(0).max(9_999_900).optional().nullable(),
    saleStartsAt: z.string().optional().nullable(),
    saleEndsAt: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
  })
  .refine(
    (d) => {
      if (d.saleStartsAt && d.saleEndsAt) {
        return new Date(d.saleStartsAt) <= new Date(d.saleEndsAt)
      }
      return true
    },
    { message: "Sale start date must be before end date", path: ["saleEndsAt"] }
  )

export type FeedActionState =
  | { error?: string; success?: string; postId?: number }
  | undefined

export async function submitFeedPostAction(
  _prev: FeedActionState,
  formData: FormData
): Promise<FeedActionState> {
  let userId: number
  try {
    ;({ userId } = await requireLocalUser())
  } catch {
    return { error: "Please sign in to post." }
  }

  const parsed = submitSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description"),
    priceCents: formData.get("priceCents") || null,
    saleStartsAt: formData.get("saleStartsAt") || null,
    saleEndsAt: formData.get("saleEndsAt") || null,
    address: formData.get("address") || null,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const data = parsed.data

  // Address validation against Lompoc ZIPs
  if (data.address) {
    const addrErr = lompocAddressError(data.address)
    if (addrErr) return { error: addrErr }
  }

  // Geocode address if provided (returns null on failure — non-fatal)
  let coords: { lat: number; lng: number } | null = null
  if (data.address) {
    coords = await geocodeAddress(data.address)
  }

  // Upload photos (0–4)
  const photoFiles = formData.getAll("photos").filter((v): v is File => v instanceof File && v.size > 0)
  if (photoFiles.length > 4) {
    return { error: "You can upload up to 4 photos." }
  }
  const photoUrls: string[] = []
  for (const file of photoFiles) {
    if (file.size > 5 * 1024 * 1024) {
      return { error: `Photo "${file.name}" exceeds 5MB.` }
    }
    try {
      const url = await uploadImage(file, "feed")
      photoUrls.push(url)
    } catch (e) {
      return { error: `Photo upload failed: ${e instanceof Error ? e.message : "unknown error"}` }
    }
  }

  // Placeholder expiresAt — admin recomputes correctly at approval.
  const placeholderExpiresAt = addDays(new Date(), 60)

  const [inserted] = await db
    .insert(feedPosts)
    .values({
      postedByUserId: userId,
      type: data.type,
      title: data.title,
      description: data.description,
      photos: photoUrls.length > 0 ? photoUrls : null,
      priceCents: data.priceCents ?? null,
      saleStartsAt: data.saleStartsAt ? new Date(data.saleStartsAt) : null,
      saleEndsAt: data.saleEndsAt ? new Date(data.saleEndsAt) : null,
      address: data.address ?? null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      status: "pending",
      expiresAt: placeholderExpiresAt,
    })
    .returning({ id: feedPosts.id })

  revalidatePath("/feed/my")
  revalidatePath("/admin/feed")
  redirect(`/feed/my?submitted=${inserted.id}`)
}

// ─── Mark for_sale post as sold ─────────────────────────────────────────────

export async function markSoldAction(formData: FormData): Promise<FeedActionState> {
  const { userId } = await requireLocalUser()
  const id = parseInt(formData.get("postId")?.toString() ?? "0", 10)
  if (!id) return { error: "Missing post id." }

  const [post] = await db
    .select()
    .from(feedPosts)
    .where(and(eq(feedPosts.id, id), eq(feedPosts.postedByUserId, userId)))
    .limit(1)
  if (!post) return { error: "Post not found." }
  if (post.type !== "for_sale") return { error: "Only for-sale posts can be marked sold." }

  await db.update(feedPosts).set({ status: "sold" }).where(eq(feedPosts.id, id))
  revalidatePath("/feed/my")
  revalidatePath("/feed")
  return { success: "Marked as sold." }
}

// ─── Extend expiration ───────────────────────────────────────────────────────

export async function extendExpirationAction(
  formData: FormData
): Promise<FeedActionState> {
  const { userId } = await requireLocalUser()
  const id = parseInt(formData.get("postId")?.toString() ?? "0", 10)
  if (!id) return { error: "Missing post id." }

  const [post] = await db
    .select()
    .from(feedPosts)
    .where(and(eq(feedPosts.id, id), eq(feedPosts.postedByUserId, userId)))
    .limit(1)
  if (!post) return { error: "Post not found." }
  if (post.status !== "approved") {
    return { error: "Only approved posts can be extended." }
  }

  const newExpiresAt = computeExpiration(
    { type: post.type, saleEndsAt: post.saleEndsAt },
    new Date()
  )

  await db.update(feedPosts).set({ expiresAt: newExpiresAt }).where(eq(feedPosts.id, id))
  revalidatePath("/feed/my")
  revalidatePath("/feed")
  return { success: "Extended for another period." }
}
