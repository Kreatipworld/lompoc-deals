"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { createAnthropic } from "@ai-sdk/anthropic"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { saleListings, users } from "@/db/schema"
import { canTransition, computeExpiresAt, REJECT_REASONS } from "@/lib/sales"
import { sendSaleListingLiveEmail, sendSaleListingRejectedEmail } from "@/lib/sales-email"
import { translateBatch } from "@/lib/translate-content"

async function requireAdmin(): Promise<number> {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") throw new Error("Not authorized")
  return parseInt(session.user.id, 10)
}

/** The ISR pages that show a listing: /sales, its category, its own page — both locales. */
function revalidateSales(listing: { id: number; category: string }) {
  for (const p of ["", "/es"]) {
    revalidatePath(`${p}/sales`)
    revalidatePath(`${p}/sales/c/${listing.category}`)
    revalidatePath(`${p}/sales/${listing.id}`)
  }
  revalidatePath("/[locale]/sales", "page")
  revalidatePath("/[locale]/sales/c/[category]", "page")
  revalidatePath("/[locale]/sales/[id]", "page")
  revalidatePath("/admin/sales")
}

const REASON_TEXT: Record<(typeof REJECT_REASONS)[number], { en: string; es: string }> = {
  "prohibited-weapons": { en: "Weapons and ammunition can't be listed on Lompoc Sales.", es: "No se pueden publicar armas ni municiones en Lompoc Sales." },
  "prohibited-animals": { en: "Animals can't be sold on Lompoc Sales.", es: "No se pueden vender animales en Lompoc Sales." },
  "prohibited-counterfeit": { en: "Counterfeit or replica goods aren't allowed.", es: "No se permiten productos falsificados o réplicas." },
  "prohibited-tickets": { en: "Tickets can't be listed above face value.", es: "No se pueden vender boletos por encima de su precio original." },
  "prohibited-illegal": { en: "This item can't be sold legally here.", es: "Este artículo no se puede vender legalmente aquí." },
  "not-local": { en: "Lompoc Sales is only for Lompoc and Vandenberg (ZIP 93436, 93437, 93438).", es: "Lompoc Sales es solo para Lompoc y Vandenberg (ZIP 93436, 93437, 93438)." },
  spam: { en: "This looks like spam or a commercial ad rather than a personal sale.", es: "Parece spam o un anuncio comercial, no una venta personal." },
  unclear: { en: "We couldn't tell what's for sale — add a clear title, description and photo.", es: "No quedó claro qué se vende — agrega un título, descripción y foto claros." },
  other: { en: "It doesn't fit the Lompoc Sales rules.", es: "No cumple con las reglas de Lompoc Sales." },
}

/**
 * Approve: → active, expires_at computed, Spanish description written (best
 * effort, never blocks), seller emailed, public pages revalidated.
 */
export async function approveSaleListingAction(formData: FormData) {
  const adminId = await requireAdmin()
  const id = parseInt(formData.get("id")?.toString() ?? "0", 10)
  if (!id) return
  const listing = await db.query.saleListings.findFirst({ where: eq(saleListings.id, id) })
  if (!listing || !canTransition(listing.status, "active", "admin")) return

  const approvedAt = new Date()
  const expiresAt = computeExpiresAt(listing.kind, approvedAt, listing.endsAt)
  await db.update(saleListings).set({ status: "active", approvedAt, approvedBy: adminId, expiresAt, rejectReason: null, updatedAt: approvedAt }).where(eq(saleListings.id, id))

  // Spanish twin, only now — we don't pay to translate spam.
  if (!listing.descriptionEs && process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const out = await translateBatch(anthropic, [{ id, description: listing.description }], ["description"])
      const es = out.items[0]?.descriptionEs
      if (typeof es === "string" && es.trim()) await db.update(saleListings).set({ descriptionEs: es.trim() }).where(eq(saleListings.id, id))
    } catch (err) {
      console.warn("[sales] translate on approve failed (cron will retry):", err instanceof Error ? err.message : err)
    }
  }

  const seller = await db.query.users.findFirst({ where: eq(users.id, listing.userId), columns: { email: true, locale: true } })
  if (seller) void sendSaleListingLiveEmail(seller.email, { title: listing.title, listingId: id, locale: seller.locale, expiresAt })
  revalidateSales(listing)
}

export async function rejectSaleListingAction(formData: FormData) {
  await requireAdmin()
  const id = parseInt(formData.get("id")?.toString() ?? "0", 10)
  if (!id) return
  const listing = await db.query.saleListings.findFirst({ where: eq(saleListings.id, id) })
  if (!listing || !canTransition(listing.status, "rejected", "admin")) return

  const code = formData.get("reason")?.toString() ?? "other"
  const note = (formData.get("note")?.toString() ?? "").trim().slice(0, 500)
  const seller = await db.query.users.findFirst({ where: eq(users.id, listing.userId), columns: { email: true, locale: true } })
  const canned = REASON_TEXT[(REJECT_REASONS as readonly string[]).includes(code) ? (code as (typeof REJECT_REASONS)[number]) : "other"]
  const reason = `${seller?.locale === "es" ? canned.es : canned.en}${note ? ` ${note}` : ""}`

  await db.update(saleListings).set({ status: "rejected", rejectReason: reason, updatedAt: new Date() }).where(eq(saleListings.id, id))
  if (seller) void sendSaleListingRejectedEmail(seller.email, { title: listing.title, reason, locale: seller.locale })
  revalidateSales(listing)
}

/** Hide any live listing (abuse). Reversible with "unhide". */
export async function hideSaleListingAction(formData: FormData) {
  await requireAdmin()
  const id = parseInt(formData.get("id")?.toString() ?? "0", 10)
  if (!id) return
  const listing = await db.query.saleListings.findFirst({ where: eq(saleListings.id, id) })
  if (!listing || !canTransition(listing.status, "hidden", "admin")) return
  await db.update(saleListings).set({ status: "hidden", updatedAt: new Date() }).where(eq(saleListings.id, id))
  revalidateSales(listing)
}

export async function unhideSaleListingAction(formData: FormData) {
  await requireAdmin()
  const id = parseInt(formData.get("id")?.toString() ?? "0", 10)
  if (!id) return
  const listing = await db.query.saleListings.findFirst({ where: eq(saleListings.id, id) })
  if (!listing || !canTransition(listing.status, "active", "admin")) return
  await db.update(saleListings).set({ status: "active", updatedAt: new Date() }).where(eq(saleListings.id, id))
  revalidateSales(listing)
}

/** Block a seller: flag on users; their pending listings are rejected quietly. */
export async function blockSalesUserAction(formData: FormData) {
  await requireAdmin()
  const userId = parseInt(formData.get("userId")?.toString() ?? "0", 10)
  if (!userId) return
  await db.update(users).set({ salesBlockedAt: new Date() }).where(eq(users.id, userId))
  const pending = await db.select({ id: saleListings.id, category: saleListings.category }).from(saleListings).where(eq(saleListings.userId, userId))
  for (const l of pending) {
    // Live and pending alike: a blocked seller has nothing on the site.
    await db.update(saleListings).set({ status: "hidden", updatedAt: new Date() }).where(eq(saleListings.id, l.id))
    revalidateSales(l)
  }
  revalidatePath("/admin/sales")
}

export async function unblockSalesUserAction(formData: FormData) {
  await requireAdmin()
  const userId = parseInt(formData.get("userId")?.toString() ?? "0", 10)
  if (!userId) return
  await db.update(users).set({ salesBlockedAt: null }).where(eq(users.id, userId))
  revalidatePath("/admin/sales")
}
