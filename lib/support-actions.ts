"use server"

import { z } from "zod"
import { eq, desc } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { supportTickets, businesses } from "@/db/schema"
import { notifyPlatform, sendTicketAckEmail } from "@/lib/email"
import { getCurrentLocale } from "@/lib/i18n-helpers"

const ticketSchema = z.object({
  category: z.enum(["bug", "billing", "feature", "question", "other"]),
  subject: z.string().min(3, "Please add a short subject.").max(200),
  message: z.string().min(5, "Please describe what's going on.").max(4000),
})

export type TicketState = { success?: string; error?: string } | undefined

/** A logged-in member files a support ticket. Saves it and emails hello@. */
export async function submitTicketAction(
  _prev: TicketState,
  formData: FormData
): Promise<TicketState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Please sign in first." }
  const userId = parseInt(session.user.id, 10)

  const parsed = ticketSchema.safeParse({
    category: formData.get("category"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." }
  }
  const { category, subject, message } = parsed.data

  const biz = await db.query.businesses.findFirst({
    where: eq(businesses.ownerUserId, userId),
    columns: { id: true, name: true },
  })

  try {
    await db.insert(supportTickets).values({
      userId,
      businessId: biz?.id ?? null,
      category,
      subject,
      message,
    })
  } catch (err) {
    console.error("[submitTicketAction] insert failed:", err)
    return { error: "Something went wrong saving your message. Please try again." }
  }

  // Alert the founder inbox (fire-and-forget — never block the member).
  const esc = (s: string) => s.replace(/</g, "&lt;")
  await notifyPlatform(`🐛 New support ticket — ${category}`, [
    `<strong>${esc(subject)}</strong>`,
    esc(message),
    `From: ${session.user.email ?? `user #${userId}`}`,
    `Business: ${biz?.name ?? "—"}`,
  ])

  // Auto-acknowledge the member so they know it's being handled.
  if (session.user.email) {
    const locale = (await getCurrentLocale()) as "en" | "es"
    await sendTicketAckEmail(session.user.email, subject, locale)
  }

  return { success: "Thanks — we got it. We'll follow up at your email." }
}

/** Admin: list tickets, newest first, with the reporter's email + business. */
export async function listTickets() {
  const rows = await db
    .select({
      id: supportTickets.id,
      category: supportTickets.category,
      subject: supportTickets.subject,
      message: supportTickets.message,
      status: supportTickets.status,
      createdAt: supportTickets.createdAt,
      businessName: businesses.name,
    })
    .from(supportTickets)
    .leftJoin(businesses, eq(supportTickets.businessId, businesses.id))
    .orderBy(desc(supportTickets.createdAt))
    .limit(200)
  return rows
}
