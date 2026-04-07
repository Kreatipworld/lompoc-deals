"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { businesses, deals } from "@/db/schema"
import { uploadImage } from "@/lib/blob"
import { geocodeAddress } from "@/lib/geocode"

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

async function requireBusinessUser() {
  const session = await auth()
  if (!session?.user || session.user.role !== "business") {
    throw new Error("Not authorized")
  }
  return { userId: parseInt(session.user.id, 10) }
}

async function ownedBusiness(userId: number) {
  return db.query.businesses.findFirst({
    where: (b, { eq: e }) => e(b.ownerUserId, userId),
  })
}

// ============ profile ============

const optionalUrl = z
  .string()
  .url("Must be a valid URL")
  .optional()
  .or(z.literal(""))

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: optionalUrl,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  yelpUrl: optionalUrl,
  googleBusinessUrl: optionalUrl,
})

export type ProfileState = { error?: string; success?: string } | undefined

export async function saveProfileAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const { userId } = await requireBusinessUser()

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    website: formData.get("website") || undefined,
    instagramUrl: formData.get("instagramUrl") || undefined,
    facebookUrl: formData.get("facebookUrl") || undefined,
    tiktokUrl: formData.get("tiktokUrl") || undefined,
    youtubeUrl: formData.get("youtubeUrl") || undefined,
    yelpUrl: formData.get("yelpUrl") || undefined,
    googleBusinessUrl: formData.get("googleBusinessUrl") || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const data = parsed.data

  // Optional file uploads
  const logoFile = formData.get("logo") as File | null
  const coverFile = formData.get("cover") as File | null
  let logoUrl: string | undefined
  let coverUrl: string | undefined
  try {
    if (logoFile && logoFile.size > 0) {
      logoUrl = await uploadImage(logoFile, "logos")
    }
    if (coverFile && coverFile.size > 0) {
      coverUrl = await uploadImage(coverFile, "covers")
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed" }
  }

  // Geocode address if provided
  let coords: { lat: number; lng: number } | null = null
  if (data.address) {
    coords = await geocodeAddress(data.address)
  }

  const socialFields = {
    instagramUrl: data.instagramUrl || null,
    facebookUrl: data.facebookUrl || null,
    tiktokUrl: data.tiktokUrl || null,
    youtubeUrl: data.youtubeUrl || null,
    yelpUrl: data.yelpUrl || null,
    googleBusinessUrl: data.googleBusinessUrl || null,
  }

  const existing = await ownedBusiness(userId)
  if (existing) {
    await db
      .update(businesses)
      .set({
        name: data.name,
        slug: slugify(data.name),
        description: data.description ?? null,
        categoryId: data.categoryId ?? null,
        address: data.address ?? null,
        phone: data.phone ?? null,
        website: data.website || null,
        ...socialFields,
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
        ...(logoUrl ? { logoUrl } : {}),
        ...(coverUrl ? { coverUrl } : {}),
      })
      .where(eq(businesses.id, existing.id))
  } else {
    await db.insert(businesses).values({
      ownerUserId: userId,
      name: data.name,
      slug: slugify(data.name),
      description: data.description ?? null,
      categoryId: data.categoryId ?? null,
      address: data.address ?? null,
      lat: coords?.lat,
      lng: coords?.lng,
      phone: data.phone ?? null,
      website: data.website || null,
      ...socialFields,
      logoUrl,
      coverUrl,
      status: "pending",
    })
  }

  revalidatePath("/dashboard/profile")
  revalidatePath("/")
  return { success: "Profile saved" }
}

// ============ deals ============

const dealSchema = z.object({
  type: z.enum(["coupon", "special", "announcement"]),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  discountText: z.string().optional(),
  terms: z.string().optional(),
  startsAt: z.string().min(1, "Start date required"),
  expiresAt: z.string().min(1, "Expiration date required"),
})

export type DealState = { error?: string; success?: string } | undefined

export async function saveDealAction(
  _prev: DealState,
  formData: FormData
): Promise<DealState> {
  const { userId } = await requireBusinessUser()
  const biz = await ownedBusiness(userId)
  if (!biz) {
    return { error: "Create your business profile before posting deals" }
  }

  const parsed = dealSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    discountText: formData.get("discountText") || undefined,
    terms: formData.get("terms") || undefined,
    startsAt: formData.get("startsAt"),
    expiresAt: formData.get("expiresAt"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const data = parsed.data

  const startsAt = new Date(data.startsAt)
  const expiresAt = new Date(data.expiresAt)
  if (expiresAt <= startsAt) {
    return { error: "Expiration must be after the start date" }
  }

  const imageFile = formData.get("image") as File | null
  let imageUrl: string | undefined
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadImage(imageFile, "deals")
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Image upload failed" }
    }
  }

  const dealId = formData.get("dealId")
  if (dealId) {
    // Edit existing — verify ownership via biz
    const id = parseInt(dealId.toString(), 10)
    const existing = await db.query.deals.findFirst({
      where: (d, { eq: e }) => e(d.id, id),
    })
    if (!existing || existing.businessId !== biz.id) {
      return { error: "Deal not found" }
    }
    await db
      .update(deals)
      .set({
        type: data.type,
        title: data.title,
        description: data.description ?? null,
        discountText: data.discountText ?? null,
        terms: data.terms ?? null,
        startsAt,
        expiresAt,
        ...(imageUrl ? { imageUrl } : {}),
      })
      .where(eq(deals.id, id))
  } else {
    await db.insert(deals).values({
      businessId: biz.id,
      type: data.type,
      title: data.title,
      description: data.description ?? null,
      discountText: data.discountText ?? null,
      terms: data.terms ?? null,
      startsAt,
      expiresAt,
      imageUrl,
    })
  }

  revalidatePath("/dashboard/deals")
  revalidatePath("/")
  redirect("/dashboard/deals")
}

export async function deleteDealAction(formData: FormData) {
  const { userId } = await requireBusinessUser()
  const biz = await ownedBusiness(userId)
  if (!biz) return

  const dealId = parseInt(formData.get("dealId")?.toString() ?? "0", 10)
  if (!dealId) return

  // Soft-delete by expiring the deal immediately. (Real delete would lose stats.)
  await db
    .update(deals)
    .set({ expiresAt: new Date(Date.now() - 1000) })
    .where(and(eq(deals.id, dealId), eq(deals.businessId, biz.id)))

  revalidatePath("/dashboard/deals")
  revalidatePath("/")
}

// ============ data fetchers (used by dashboard server components) ============

export async function getMyBusiness() {
  const { userId } = await requireBusinessUser()
  const biz = await ownedBusiness(userId)
  return biz ?? null
}

export async function getMyDeals() {
  const { userId } = await requireBusinessUser()
  const biz = await ownedBusiness(userId)
  if (!biz) return []
  return db.query.deals.findMany({
    where: (d, { eq: e }) => e(d.businessId, biz.id),
    orderBy: (d, { desc }) => [desc(d.createdAt)],
  })
}

export async function getMyDealById(id: number) {
  const { userId } = await requireBusinessUser()
  const biz = await ownedBusiness(userId)
  if (!biz) return null
  const d = await db.query.deals.findFirst({
    where: (d, { eq: e }) => e(d.id, id),
  })
  if (!d || d.businessId !== biz.id) return null
  return d
}

export async function getCategoriesList() {
  return db.query.categories.findMany({
    orderBy: (c, { asc }) => [asc(c.name)],
  })
}
