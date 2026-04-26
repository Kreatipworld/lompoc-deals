"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { getTranslations } from "next-intl/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { feedPosts } from "@/db/schema"
import { uploadImage } from "@/lib/blob"
import { geocodeAddress } from "@/lib/geocode"
import { localizedLompocAddressError } from "@/lib/i18n-helpers"
import { addDays, computeExpiration } from "@/lib/feed-expiration"

async function requireLocalUser() {
  const session = await auth()
  if (!session?.user || session.user.role !== "local") {
    throw new Error("Not authorized — local account required")
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
  const t = await getTranslations("errors.feed")

  let userId: number
  try {
    ;({ userId } = await requireLocalUser())
  } catch {
    return { error: t("pleaseSignIn") }
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
    return { error: parsed.error.issues[0]?.message ?? t("invalidInput") }
  }

  const data = parsed.data

  // Address validation against Lompoc ZIPs
  if (data.address) {
    const addrErr = await localizedLompocAddressError(data.address)
    if (addrErr) return { error: addrErr }
  }

  // Geocode address if provided (returns null on failure — non-fatal)
  let coords: { lat: number; lng: number } | null = null
  if (data.address) {
    coords = await geocodeAddress(data.address)
  }

  // Upload photos (0–4)
  const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
  const photoFiles = formData.getAll("photos").filter((v): v is File => v instanceof File && v.size > 0)
  if (photoFiles.length > 4) {
    return { error: t("tooManyPhotos") }
  }
  const photoUrls: string[] = []
  for (const file of photoFiles) {
    if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
      return { error: t("photoNotImage", { name: file.name }) }
    }
    if (file.size > 5 * 1024 * 1024) {
      return { error: t("photoTooLarge", { name: file.name }) }
    }
    try {
      const url = await uploadImage(file, "feed")
      photoUrls.push(url)
    } catch (e) {
      return { error: t("photoUploadFailed", { message: e instanceof Error ? e.message : "unknown error" }) }
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
  const t = await getTranslations("errors.feed")
  const { userId } = await requireLocalUser()
  const id = parseInt(formData.get("postId")?.toString() ?? "0", 10)
  if (!id) return { error: t("missingPostId") }

  const [post] = await db
    .select()
    .from(feedPosts)
    .where(and(eq(feedPosts.id, id), eq(feedPosts.postedByUserId, userId)))
    .limit(1)
  if (!post) return { error: t("postNotFound") }
  if (post.type !== "for_sale") return { error: t("onlyForSaleCanBeSold") }

  await db.update(feedPosts).set({ status: "sold" }).where(eq(feedPosts.id, id))
  revalidatePath("/feed/my")
  revalidatePath("/feed")
  return { success: "Marked as sold." }
}

// ─── Extend expiration ───────────────────────────────────────────────────────

export async function extendExpirationAction(
  formData: FormData
): Promise<FeedActionState> {
  const t = await getTranslations("errors.feed")
  const { userId } = await requireLocalUser()
  const id = parseInt(formData.get("postId")?.toString() ?? "0", 10)
  if (!id) return { error: t("missingPostId") }

  const [post] = await db
    .select()
    .from(feedPosts)
    .where(and(eq(feedPosts.id, id), eq(feedPosts.postedByUserId, userId)))
    .limit(1)
  if (!post) return { error: t("postNotFound") }
  if (post.status !== "approved") {
    return { error: t("onlyApprovedCanBeExtended") }
  }

  // For yard-sale posts (saleEndsAt set), the original window has usually
  // passed by the time the user clicks "Still valid" — feeding that stale
  // saleEndsAt back into computeExpiration would produce an already-past
  // expiresAt and the cron would expire the post again. Instead, treat
  // "extend" as converting the post to single-item-style: clear saleEndsAt
  // and use the standard 30-day rule.
  const newExpiresAt = computeExpiration({ type: post.type, saleEndsAt: null }, new Date())

  await db
    .update(feedPosts)
    .set({ expiresAt: newExpiresAt, saleEndsAt: null, saleStartsAt: null })
    .where(eq(feedPosts.id, id))
  revalidatePath("/feed/my")
  revalidatePath("/feed")
  return { success: "Extended for another period." }
}
