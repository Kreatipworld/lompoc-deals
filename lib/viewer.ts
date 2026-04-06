import { auth } from "@/auth"
import { db } from "@/db/client"

export type Viewer = {
  isAuthed: boolean
  isAdmin: boolean
  isLocal: boolean
  isBusiness: boolean
  userId: number | null
  favoritedDealIds: Set<number>
}

export async function getViewer(): Promise<Viewer> {
  const session = await auth()
  if (!session?.user) {
    return {
      isAuthed: false,
      isAdmin: false,
      isLocal: false,
      isBusiness: false,
      userId: null,
      favoritedDealIds: new Set(),
    }
  }

  const userId = parseInt(session.user.id, 10)
  const role = session.user.role

  let favoritedDealIds = new Set<number>()
  if (role === "local") {
    const rows = await db.query.favorites.findMany({
      where: (f, { eq }) => eq(f.userId, userId),
      columns: { dealId: true },
    })
    favoritedDealIds = new Set(rows.map((r) => r.dealId))
  }

  return {
    isAuthed: true,
    isAdmin: role === "admin",
    isLocal: role === "local",
    isBusiness: role === "business",
    userId,
    favoritedDealIds,
  }
}
