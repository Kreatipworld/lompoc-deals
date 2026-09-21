import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { businesses } from "@/db/schema"

/**
 * Hand a listing to its real owner.
 *
 * Clearing `plan_override` is the important half. A comp is a gift attached to a
 * listing *we* built and maintained while nobody owned it. `effectiveTier()`
 * returns the override before it ever looks at a subscription, so a comped
 * listing that gets claimed would grant its new owner full member entitlements
 * for nothing — permanently, and without ever being asked for a card.
 *
 * Both claim paths (self-serve auto-approve at signup, and admin approval) must
 * go through here, or the two drift apart and one of them leaks a free ride.
 *
 * Returns the override that was removed, so the caller can say so out loud.
 */
export async function transferBusinessToOwner(
  businessId: number,
  newOwnerUserId: number
): Promise<{ revokedComp: string | null }> {
  const before = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { planOverride: true },
  })
  await db
    .update(businesses)
    .set({ ownerUserId: newOwnerUserId, planOverride: null })
    .where(eq(businesses.id, businessId))
  return { revokedComp: before?.planOverride ?? null }
}
