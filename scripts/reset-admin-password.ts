/**
 * Reset the password for an admin (or any) user.
 * Usage: npm run reset:admin-password -- <email> <new-password>
 * Example: npm run reset:admin-password -- andres@kreatipdesign.com myNewPassword123
 */
import { db } from "@/db/client"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

const [, , email, newPassword] = process.argv

async function main() {
  if (!email || !newPassword) {
    console.error("Usage: npm run reset:admin-password -- <email> <new-password>")
    process.exit(1)
  }

  if (newPassword.length < 6) {
    console.error("Password must be at least 6 characters.")
    process.exit(1)
  }

  const existing = await db.query.users.findFirst({
    where: (u, { eq: e }) => e(u.email, email),
    columns: { id: true, email: true, role: true },
  })

  if (!existing) {
    console.error(`User not found: ${email}`)
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, existing.id))

  console.log(`✓ Password reset for ${email} (role: ${existing.role})`)
  console.log(`  Sign in at /login with the new password.`)
  console.log(`  If you still see errors, clear browser cookies and try again.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
