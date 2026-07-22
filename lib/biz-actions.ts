"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq, gt, sql } from "drizzle-orm"
import { getTranslations } from "next-intl/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { businesses, deals, subscriptions, propertyListings, favorites, businessFollows, users } from "@/db/schema"
import { assertFeature } from "@/lib/plan-features"
import { uploadImage, deleteImage } from "@/lib/blob"
import { geocodeAddress } from "@/lib/geocode"
import { localizedLompocAddressError } from "@/lib/i18n-helpers"
import { DAY_KEYS, type Hours, type DayHours } from "@/lib/hours"
import { isAmenitySlug } from "@/lib/amenities"
import { TIERS } from "@/lib/stripe"
import { sendDealUpdateEmail, sendNewDealFromFollowedBusinessEmail } from "@/lib/email"
import { track } from "@/lib/analytics/track"
import { getSessionId } from "@/lib/analytics/session"

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
  about: z.string().optional(),
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
  const t = await getTranslations("errors.biz")
  const { userId } = await requireBusinessUser()

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    about: formData.get("about") || undefined,
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
    return { error: parsed.error.issues[0]?.message ?? t("invalidInput") }
  }
  const data = parsed.data

  if (data.address) {
    const addrErr = await localizedLompocAddressError(data.address)
    if (addrErr) return { error: addrErr }
  }

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
    return { error: e instanceof Error ? e.message : t("uploadFailed") }
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

  // Amenities — keep only known canonical slugs the owner checked.
  const amenitiesPayload = formData
    .getAll("amenities")
    .map((v) => v.toString())
    .filter((s) => isAmenitySlug(s))

  // Build hours object from form fields. Each day has hours_<day>_open,
  // hours_<day>_close, and hours_<day>_closed (checkbox).
  const hours: Hours = {
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  }
  for (const day of DAY_KEYS) {
    const closed = formData.get(`hours_${day}_closed`) === "on"
    if (closed) continue
    const open = formData.get(`hours_${day}_open`)?.toString().trim()
    const close = formData.get(`hours_${day}_close`)?.toString().trim()
    if (open && close) {
      hours[day] = { open, close } satisfies DayHours
    }
  }
  const anyHours = DAY_KEYS.some((k) => hours[k] !== null)
  const hoursPayload = anyHours ? hours : null

  const existing = await ownedBusiness(userId)
  const firstSave = !existing
  let bizId: number | null = existing?.id ?? null

  if (existing) {
    await db
      .update(businesses)
      .set({
        name: data.name,
        slug: slugify(data.name),
        description: data.description ?? null,
        about: data.about ?? null,
        aboutSource: "owner",
        amenitiesJson: amenitiesPayload,
        amenitiesSource: "owner",
        categoryId: data.categoryId ?? null,
        address: data.address ?? null,
        phone: data.phone ?? null,
        website: data.website || null,
        hoursJson: hoursPayload,
        hoursSource: "owner",
        hoursSyncedAt: null,
        ...socialFields,
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
        ...(logoUrl ? { logoUrl } : {}),
        ...(coverUrl ? { coverUrl } : {}),
      })
      .where(eq(businesses.id, existing.id))
  } else {
    const [newBiz] = await db.insert(businesses).values({
      ownerUserId: userId,
      name: data.name,
      slug: slugify(data.name),
      description: data.description ?? null,
      about: data.about ?? null,
      aboutSource: "owner",
      amenitiesJson: amenitiesPayload,
      amenitiesSource: "owner",
      categoryId: data.categoryId ?? null,
      address: data.address ?? null,
      lat: coords?.lat,
      lng: coords?.lng,
      phone: data.phone ?? null,
      website: data.website || null,
      hoursJson: hoursPayload,
      hoursSource: "owner",
      hoursSyncedAt: null,
      ...socialFields,
      logoUrl,
      coverUrl,
      status: "pending",
    }).returning({ id: businesses.id })
    bizId = newBiz?.id ?? null
  }

  await track("business_profile_saved", {
    userId,
    sessionId: getSessionId(),
    targetType: "business",
    targetId: bizId,
    props: { firstSave },
  })

  revalidatePath("/dashboard/profile")
  revalidatePath("/")
  return { success: "Profile saved" }
}

// ============ photo gallery ============

const MAX_GALLERY_PHOTOS = 8
const BLOB_HOST = "public.blob.vercel-storage.com"

function isOurBlobUrl(url: string): boolean {
  try {
    return new URL(url).host.endsWith(BLOB_HOST)
  } catch {
    return false
  }
}

const galleryManifestEntrySchema = z.union([
  z.object({ kind: z.literal("existing"), url: z.string().url() }),
  z.object({ kind: z.literal("new"), idx: z.number().int().min(0) }),
])

export type GalleryState = { ok: boolean; error?: string } | undefined

export async function saveGalleryAction(
  _prev: GalleryState,
  formData: FormData
): Promise<GalleryState> {
  const t = await getTranslations("errors.biz")
  const { userId } = await requireBusinessUser()
  const biz = await ownedBusiness(userId)
  if (!biz) {
    return { ok: false, error: t("createProfileFirstShort") }
  }

  const manifestRaw = formData.get("manifest")
  if (typeof manifestRaw !== "string") {
    return { ok: false, error: t("invalidInput") }
  }

  let manifest: Array<{ kind: "existing"; url: string } | { kind: "new"; idx: number }>
  try {
    const parsed = z.array(galleryManifestEntrySchema).safeParse(JSON.parse(manifestRaw))
    if (!parsed.success) return { ok: false, error: t("invalidInput") }
    manifest = parsed.data
  } catch {
    return { ok: false, error: t("invalidInput") }
  }

  // Rebuild the final ordered list of photo URLs, honoring the 8-photo cap.
  // Existing photos keep their URL; new photos are uploaded as we go. A file
  // that fails validation (not an image, too large) is skipped rather than
  // failing the whole save.
  const final: string[] = []
  for (const entry of manifest) {
    if (final.length >= MAX_GALLERY_PHOTOS) break
    if (entry.kind === "existing") {
      final.push(entry.url)
    } else {
      const file = formData.get(`new_${entry.idx}`) as File | null
      if (!file || file.size === 0) continue
      try {
        const url = await uploadImage(file, "photos")
        final.push(url)
      } catch {
        continue
      }
    }
  }

  // Only ever delete blobs we own (uploaded via Vercel Blob). Enrichment
  // photos live on lh3.googleusercontent.com and are never ours to delete.
  const oldPhotos: string[] = Array.isArray(biz.photosJson) ? (biz.photosJson as string[]) : []
  const removed = oldPhotos.filter((url) => !final.includes(url))
  await Promise.allSettled(
    removed.filter(isOurBlobUrl).map((url) => deleteImage(url))
  )

  await db
    .update(businesses)
    .set({
      photosJson: final,
      coverUrl: final.length > 0 ? final[0] : biz.coverUrl,
    })
    .where(eq(businesses.id, biz.id))

  revalidatePath("/dashboard/profile")
  revalidatePath(`/biz/${biz.slug}`)
  revalidatePath("/")

  return { ok: true }
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
  maxRedemptions: z.coerce.number().int().min(1).optional().nullable(),
  maxPerDay: z.coerce.number().int().min(1).optional().nullable(),
})

export type DealState = { error?: string; success?: string; fieldErrors?: Record<string, string> } | undefined

export async function saveDealAction(
  _prev: DealState,
  formData: FormData
): Promise<DealState> {
  const t = await getTranslations("errors.biz")
  const { userId } = await requireBusinessUser()
  const biz = await ownedBusiness(userId)
  if (!biz) {
    return { error: t("createProfileFirst") }
  }

  const parsed = dealSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    discountText: formData.get("discountText") || undefined,
    terms: formData.get("terms") || undefined,
    startsAt: formData.get("startsAt"),
    expiresAt: formData.get("expiresAt"),
    maxRedemptions: formData.get("maxRedemptions") ? Number(formData.get("maxRedemptions")) : null,
    maxPerDay: formData.get("maxPerDay") ? Number(formData.get("maxPerDay")) : null,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("invalidInput") }
  }
  const data = parsed.data

  const startsAt = new Date(data.startsAt)
  const expiresAt = new Date(data.expiresAt)
  if (expiresAt <= startsAt) {
    return { error: t("expirationAfterStart") }
  }

  const imageFile = formData.get("image") as File | null
  let imageUrl: string | undefined
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadImage(imageFile, "deals")
    } catch (e) {
      return { error: e instanceof Error ? e.message : t("imageUploadFailed") }
    }
  }

  const dealId = formData.get("dealId")

  // Subscription tier gating for new deals only
  if (!dealId) {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    })
    const isActive = sub?.status === "active" || sub?.status === "trialing"
    const tierKey = sub?.tier ?? "free"
    const limit = isActive ? TIERS[tierKey].dealLimit : TIERS.free.dealLimit

    if (limit !== Infinity) {
      const now = new Date()
      const activeCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(deals)
        .where(and(eq(deals.businessId, biz.id), gt(deals.expiresAt, now)))
        .then((r) => r[0]?.count ?? 0)

      if (activeCount >= limit) {
        return {
          error:
            limit === 0
              ? `Posting deals starts on the Growth plan. Upgrade to post your first deal.`
              : `Your ${TIERS[tierKey].name} plan allows up to ${limit} active deals. Upgrade to Plus for unlimited deals.`,
        }
      }
    }
  }

  if (dealId) {
    // Edit existing — verify ownership via biz
    const id = parseInt(dealId.toString(), 10)
    const existing = await db.query.deals.findFirst({
      where: (d, { eq: e }) => e(d.id, id),
    })
    if (!existing || existing.businessId !== biz.id) {
      return { error: t("dealNotFound") }
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
        maxRedemptions: data.maxRedemptions ?? null,
        maxPerDay: data.maxPerDay ?? null,
        ...(imageUrl ? { imageUrl } : {}),
      })
      .where(eq(deals.id, id))

    // Fire deal-update notifications (non-blocking)
    void notifyDealUpdated(id, {
      title: data.title,
      description: data.description ?? null,
      discountText: data.discountText ?? null,
      businessName: biz.name,
      businessSlug: biz.slug,
    })
  } else {
    const [inserted] = await db
      .insert(deals)
      .values({
        businessId: biz.id,
        type: data.type,
        title: data.title,
        description: data.description ?? null,
        discountText: data.discountText ?? null,
        terms: data.terms ?? null,
        startsAt,
        expiresAt,
        maxRedemptions: data.maxRedemptions ?? null,
        maxPerDay: data.maxPerDay ?? null,
        imageUrl,
      })
      .returning({ id: deals.id })

    // Fire new-deal notifications to business followers (non-blocking)
    if (inserted) {
      void notifyNewDeal(biz.id, {
        id: inserted.id,
        title: data.title,
        description: data.description ?? null,
        discountText: data.discountText ?? null,
        businessName: biz.name,
        businessSlug: biz.slug,
      })

      // Emit first_deal_posted if this is the business's first deal
      const dealCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(deals)
        .where(eq(deals.businessId, biz.id))
      const isFirst = (dealCount[0]?.count ?? 0) === 1
      if (isFirst) {
        await track("first_deal_posted", {
          userId,
          sessionId: getSessionId(),
          targetType: "business",
          targetId: biz.id,
          props: { dealId: inserted.id, type: data.type },
        })
      }
    }
  }

  revalidatePath("/dashboard/deals")
  revalidatePath("/")
  redirect("/dashboard/deals")
}

export async function toggleDealPausedAction(formData: FormData) {
  const { userId } = await requireBusinessUser()
  const biz = await ownedBusiness(userId)
  if (!biz) return

  const dealId = parseInt(formData.get("dealId")?.toString() ?? "0", 10)
  const paused = formData.get("paused") === "true"
  if (!dealId) return

  await db
    .update(deals)
    .set({ paused: !paused })
    .where(and(eq(deals.id, dealId), eq(deals.businessId, biz.id)))

  revalidatePath("/dashboard/deals")
  revalidatePath("/")
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

// ============ notification helpers ============

type DealInfo = {
  title: string
  description: string | null
  discountText: string | null
  businessName: string
  businessSlug: string
}

async function notifyDealUpdated(dealId: number, info: DealInfo) {
  try {
    const favRows = await db
      .select({ email: users.email, token: users.email, notif: users.notificationEmails, locale: users.locale })
      .from(favorites)
      .innerJoin(users, eq(favorites.userId, users.id))
      .where(and(eq(favorites.dealId, dealId), eq(users.notificationEmails, true)))

    await Promise.allSettled(
      favRows.map((row) =>
        sendDealUpdateEmail(
          row.email,
          { id: dealId, ...info },
          Buffer.from(row.email).toString("base64url"),
          (row.locale ?? "en") as "en" | "es"
        )
      )
    )
  } catch (e) {
    console.error("[notify] deal update failed", e)
  }
}

async function notifyNewDeal(businessId: number, info: DealInfo & { id: number }) {
  try {
    const followRows = await db
      .select({ email: users.email, notif: users.notificationEmails, locale: users.locale })
      .from(businessFollows)
      .innerJoin(users, eq(businessFollows.userId, users.id))
      .where(
        and(
          eq(businessFollows.businessId, businessId),
          eq(users.notificationEmails, true)
        )
      )

    await Promise.allSettled(
      followRows.map((row) =>
        sendNewDealFromFollowedBusinessEmail(
          row.email,
          info,
          Buffer.from(row.email).toString("base64url"),
          (row.locale ?? "en") as "en" | "es"
        )
      )
    )
  } catch (e) {
    console.error("[notify] new deal failed", e)
  }
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

// ============ property listings ============

export type PropertyState = { error?: string }

const propertySchema = z.object({
  type: z.enum(["for-sale", "for-rent"]),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  priceDollars: z.coerce.number().positive("Price must be a positive number"),
  beds: z.coerce.number().int().min(0).optional(),
  baths: z.coerce.number().min(0).optional(),
  sqft: z.coerce.number().int().min(0).optional(),
  address: z.string().optional(),
})

export async function upsertPropertyAction(
  _prevState: PropertyState,
  formData: FormData
): Promise<PropertyState> {
  const t = await getTranslations("errors.biz")
  const { userId } = await requireBusinessUser()
  const biz = await ownedBusiness(userId)
  if (!biz) return { error: t("createProfileFirstShort") }

  // Require premium tier
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })
  const tierKey = sub?.tier ?? "free"
  try {
    assertFeature(tierKey, "canListRealEstate")
  } catch {
    return { error: t("propertyListingsRequirePremium") }
  }

  const parsed = propertySchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priceDollars: formData.get("priceCents"),
    beds: formData.get("beds") || undefined,
    baths: formData.get("baths") || undefined,
    sqft: formData.get("sqft") || undefined,
    address: formData.get("address") || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("invalidInput") }
  }
  const data = parsed.data

  const imageFile = formData.get("image") as File | null
  let imageUrl: string | undefined
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadImage(imageFile, "listings")
    } catch (e) {
      return { error: e instanceof Error ? e.message : t("imageUploadFailed") }
    }
  }

  const listingId = formData.get("listingId")

  if (listingId) {
    const id = parseInt(listingId.toString(), 10)
    const existing = await db.query.propertyListings.findFirst({
      where: (pl, { eq: e }) => e(pl.id, id),
    })
    if (!existing || existing.businessId !== biz.id) {
      return { error: t("listingNotFound") }
    }
    await db
      .update(propertyListings)
      .set({
        type: data.type,
        title: data.title,
        description: data.description ?? null,
        priceCents: Math.round(data.priceDollars * 100),
        beds: data.beds ?? null,
        baths: data.baths ?? null,
        sqft: data.sqft ?? null,
        address: data.address ?? null,
        ...(imageUrl ? { imageUrl } : {}),
      })
      .where(eq(propertyListings.id, id))
  } else {
    await db.insert(propertyListings).values({
      businessId: biz.id,
      type: data.type,
      title: data.title,
      description: data.description ?? null,
      priceCents: Math.round(data.priceDollars * 100),
      beds: data.beds ?? null,
      baths: data.baths ?? null,
      sqft: data.sqft ?? null,
      address: data.address ?? null,
      imageUrl,
      status: "active",
    })
  }

  revalidatePath("/dashboard/properties")
  revalidatePath("/")
  redirect("/dashboard/properties")
}

export async function deletePropertyAction(formData: FormData) {
  const { userId } = await requireBusinessUser()
  const biz = await ownedBusiness(userId)
  if (!biz) return

  const listingId = parseInt(formData.get("listingId")?.toString() ?? "0", 10)
  if (!listingId) return

  await db
    .update(propertyListings)
    .set({ status: "inactive" })
    .where(and(eq(propertyListings.id, listingId), eq(propertyListings.businessId, biz.id)))

  revalidatePath("/dashboard/properties")
  revalidatePath("/")
}

export async function getMyProperties() {
  const { userId } = await requireBusinessUser()
  const biz = await ownedBusiness(userId)
  if (!biz) return []
  return db.query.propertyListings.findMany({
    where: (pl, { and: a, eq: e }) => a(e(pl.businessId, biz.id), e(pl.status, "active")),
    orderBy: (pl, { desc }) => [desc(pl.createdAt)],
  })
}

export async function getMyPropertyById(id: number) {
  const { userId } = await requireBusinessUser()
  const biz = await ownedBusiness(userId)
  if (!biz) return null
  const pl = await db.query.propertyListings.findFirst({
    where: (p, { eq: e }) => e(p.id, id),
  })
  if (!pl || pl.businessId !== biz.id) return null
  return pl
}
