import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { users } from "@/db/schema"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const found = await db.query.users.findFirst({
          where: eq(users.email, email),
        })
        if (!found) return null

        const ok = await bcrypt.compare(password, found.passwordHash)
        if (!ok) return null

        return {
          id: String(found.id),
          email: found.email,
          role: found.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id
        token.role = (user as { role: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as "local" | "business" | "admin"
      }
      return session
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const role = auth?.user?.role
      if (pathname.startsWith("/dashboard")) return role === "business"
      if (pathname.startsWith("/admin")) return role === "admin"
      return true
    },
  },
})
