import { db } from "@/db/client"
import { businesses, subscriptions } from "@/db/schema"
import { inArray, eq, sql } from "drizzle-orm"

/**
 * Effective plan rank per business (Plus 2, Growth 1, Free 0) for a set of ids.
 * Admin planOverride wins, otherwise an active/trialing subscription counts —
 * the same rule the directory uses to showcase members first.
 */
export async function memberTiers(ids: number[]): Promise<Map<number, number>> {
  const out = new Map<number, number>()
  if (ids.length === 0) return out
  const rows = await db
    .select({
      id: businesses.id,
      tier: sql<number>`coalesce(max(case
        when ${businesses.planOverride} = 'premium' then 2
        when ${businesses.planOverride} = 'standard' then 1
        when ${businesses.planOverride} = 'free' then 0
        when ${subscriptions.status} in ('active','trialing') and ${subscriptions.tier} = 'premium' then 2
        when ${subscriptions.status} in ('active','trialing') and ${subscriptions.tier} = 'standard' then 1
        else 0 end), 0)::int`,
    })
    .from(businesses)
    .leftJoin(subscriptions, eq(subscriptions.userId, businesses.ownerUserId))
    .where(inArray(businesses.id, ids))
    .groupBy(businesses.id)
  for (const r of rows) out.set(r.id, Number(r.tier))
  return out
}
