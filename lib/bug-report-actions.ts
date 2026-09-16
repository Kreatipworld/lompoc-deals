"use server"

import { desc, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { bugReports } from "@/db/schema"

export type BugStatus = "new" | "fixed" | "ignored"

async function requireAdmin() {
  const session = await auth()
  if ((session?.user as { role?: string } | undefined)?.role !== "admin") throw new Error("admin only")
}

/** Newest first; the admin Bugs page. */
export async function listBugReports(limit = 200) {
  await requireAdmin()
  return db.select().from(bugReports).orderBy(desc(bugReports.createdAt)).limit(limit)
}

/** How many reports are still open — the admin overview tile. */
export async function countNewBugReports(): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(bugReports).where(eq(bugReports.status, "new"))
  return row?.n ?? 0
}

/** Mark a report fixed / ignored / back to new (form action on the admin page). */
export async function setBugStatusAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = parseInt(String(formData.get("id") ?? ""), 10)
  const status = String(formData.get("status") ?? "") as BugStatus
  if (Number.isNaN(id) || !["new", "fixed", "ignored"].includes(status)) return
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000) || null
  await db
    .update(bugReports)
    .set({ status, adminNote: note ?? undefined, resolvedAt: status === "new" ? null : new Date() })
    .where(eq(bugReports.id, id))
  revalidatePath("/admin/bugs")
  revalidatePath("/admin")
}
