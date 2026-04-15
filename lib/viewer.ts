import { auth } from "@/auth"
import { db } from "@/db/client"

export type Viewer = {
  isAuthed: boolean
  isAdmin: boolean
  isLocal: boolean
  isBusiness: boolean
  userId: number | null
  favoritedDealIds: Set<number>
  followedBusinessIds: Set<number>
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
      followedBusinessIds: new Set(),
    }
  }

  const userId = parseInt(session.user.id, 10)
  const role = session.user.role

  let favoritedDealIds = new Set<number>()
  let followedBusinessIds = new Set<number>()
  if (role === "local") {
    const [favRows, followRows] = await Promise.all([
      db.query.favorites.findMany({
        where: (f, { eq }) => eq(f.userId, userId),
        columns: { dealId: true },
      }),
      db.query.businessFollows.findMany({
        where: (f, { eq }) => eq(f.userId, userId),
        columns: { businessId: true },
      }),
    ])
    favoritedDealIds = new Set(favRows.map((r) => r.dealId))
    followedBusinessIds = new Set(followRows.map((r) => r.businessId))
  }

  return {
    isAuthed: true,
    isAdmin: role === "admin",
    isLocal: role === "local",
    isBusiness: role === "business",
    userId,
    favoritedDealIds,
    followedBusinessIds,
  }
}
