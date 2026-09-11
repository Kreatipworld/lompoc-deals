"use server"

import { z } from "zod"
import { and, eq, gt, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { businesses, listingLeads, propertyListings } from "@/db/schema"
import { sendListingLeadEmail } from "@/lib/email"
import { track } from "@/lib/analytics/track"
import { getSessionId } from "@/lib/analytics/session"

export type LeadState = { success?: string; error?: string } | undefined

const schema = z.object({
  businessId: z.coerce.number().int().positive(),
  listingId: z.coerce.number().int().positive().optional(),
  kind: z.enum(["showing", "contact"]),
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional(),
  message: z.string().trim().max(2000).optional(),
  preferredTime: z.string().trim().max(200).optional(),
  sourcePath: z.string().trim().max(300).optional(),
  // Honeypot — hidden from people, filled by bots.
  website: z.string().max(0).optional(),
})

const PLACEHOLDER_DOMAIN = "lompocdeals.system"

/**
 * A buyer's tour or contact request. Inserts the lead, emails the agent
 * (hello@ always in copy), counts it in analytics. Same email + same target
 * within 10 minutes is treated as a repeat click and ignored quietly.
 */
export async function createListingLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = schema.safeParse({
    ...raw,
    listingId: raw.listingId ? raw.listingId : undefined,
    phone: raw.phone || undefined,
    message: raw.message || undefined,
    preferredTime: raw.preferredTime || undefined,
    sourcePath: raw.sourcePath || undefined,
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first?.path[0] === "email" ? "Enter a valid email so the agent can reply." : "Add your name and a valid email." }
  }
  const d = parsed.data
  if (d.website) return { success: "Sent." } // bot: pretend

  const biz = await db.query.businesses.findFirst({
    where: and(eq(businesses.id, d.businessId), eq(businesses.status, "approved")),
    columns: { id: true, name: true, slug: true, email: true },
  })
  if (!biz) return { error: "This agent is not available right now." }

  let listing: { id: number; title: string; address: string | null } | null = null
  if (d.listingId) {
    const l = await db.query.propertyListings.findFirst({
      where: and(eq(propertyListings.id, d.listingId), eq(propertyListings.businessId, biz.id)),
      columns: { id: true, title: true, address: true },
    })
    listing = l ?? null
  }

  // Light rate limit: the same buyer, same target, within 10 minutes.
  const dupe = await db
    .select({ id: listingLeads.id })
    .from(listingLeads)
    .where(
      and(
        eq(listingLeads.businessId, biz.id),
        eq(listingLeads.email, d.email.toLowerCase()),
        listing ? eq(listingLeads.listingId, listing.id) : sql`${listingLeads.listingId} is null`,
        gt(listingLeads.createdAt, sql`now() - interval '10 minutes'`)
      )
    )
    .limit(1)
  const agentFirst = biz.name.split(" · ")[0].trim().split(/[,\s]/)[0] || biz.name
  if (dupe.length) return { success: agentFirst }

  const [row] = await db
    .insert(listingLeads)
    .values({
      businessId: biz.id,
      listingId: listing?.id ?? null,
      kind: d.kind,
      name: d.name,
      email: d.email.toLowerCase(),
      phone: d.phone ?? null,
      message: d.message ?? null,
      preferredTime: d.preferredTime ?? null,
      sourcePath: d.sourcePath ?? null,
    })
    .returning({ id: listingLeads.id })

  const agentEmail = biz.email && !biz.email.endsWith(PLACEHOLDER_DOMAIN) ? biz.email : null
  const resendId = await sendListingLeadEmail({
    agentEmail,
    agentName: biz.name,
    kind: d.kind,
    lead: { name: d.name, email: d.email, phone: d.phone, message: d.message, preferredTime: d.preferredTime },
    listing,
    profileSlug: biz.slug,
  })
  if (resendId && row) {
    await db.update(listingLeads).set({ emailedAt: new Date() }).where(eq(listingLeads.id, row.id))
  }

  await track("lead_created", {
    sessionId: getSessionId(),
    targetType: "business",
    targetId: biz.id,
    props: listing ? { slug: biz.slug, kind: d.kind, listingId: listing.id } : { slug: biz.slug, kind: d.kind },
  })

  return { success: agentFirst }
}
