import { db } from "@/db/client"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

// Accept email from CLI arg, env var, or fall back to default
const TARGET_EMAIL =
  process.argv[2] ||
  process.env.ADMIN_EMAIL ||
  "andres@kreatipdesign.com"

async function main() {
  console.log(`Looking up user: ${TARGET_EMAIL}`)

  const existing = await db.query.users.findFirst({
    where: (u, { eq: e }) => e(u.email, TARGET_EMAIL),
  })

  if (!existing) {
    console.error(`User not found: ${TARGET_EMAIL}`)
    console.error(`Tip: Make sure the user has signed up first, then run this script.`)
    console.error(`Usage: npm run seed:admin -- <email>`)
    process.exit(1)
  }

  if (existing.role === "admin") {
    console.log(`${TARGET_EMAIL} is already admin. Nothing to do.`)
    process.exit(0)
  }

  await db
    .update(users)
    .set({ role: "admin" })
    .where(eq(users.email, TARGET_EMAIL))

  console.log(`✓ Set role=admin for ${TARGET_EMAIL}`)
  console.log(`  The user must sign out and sign back in to get a fresh session token.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
