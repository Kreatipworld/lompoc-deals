import { db } from "@/db/client"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

const TARGET_EMAIL = "andres@kreatipdesign.com"

async function main() {
  const existing = await db.query.users.findFirst({
    where: (u, { eq: e }) => e(u.email, TARGET_EMAIL),
  })

  if (!existing) {
    console.error(`User not found: ${TARGET_EMAIL}`)
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
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
