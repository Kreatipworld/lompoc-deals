import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

// Neon's driver speaks HTTP via fetch, and Next.js caches identical fetch calls
// inside GET route handlers (crons!) — a SELECT with the same text and params
// could come back from an earlier invocation. The Monday digest mailed a
// two-week-old subscriber list and the news desk saw stale leads exactly this
// way. Every database call opts out of the fetch cache, always.
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: "no-store" } })
export const db = drizzle(sql, { schema })
