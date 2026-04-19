import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
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
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
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
        if (!found.passwordHash) return null // Google-only account

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
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true

      const email = user.email
      if (!email) return false

      const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
      })

      if (existing) {
        // Link Google account to existing user if not already linked
        if (!existing.googleId) {
          await db
            .update(users)
            .set({
              googleId: account.providerAccountId,
              emailVerified: new Date(),
              // Backfill name if missing
              ...(existing.name ? {} : { name: profile?.name ?? null }),
            })
            .where(eq(users.id, existing.id))
        }
        return true
      }

      // Create new local user via Google
      await db.insert(users).values({
        email,
        passwordHash: null,
        role: "local",
        name: profile?.name ?? null,
        googleId: account.providerAccountId,
        emailVerified: new Date(),
      })
      return true
    },

    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          // Look up DB user to get our id and role
          const found = await db.query.users.findFirst({
            where: eq(users.email, user.email!),
          })
          if (found) {
            token.id = String(found.id)
            token.role = found.role
          }
        } else {
          token.id = (user as { id: string }).id
          token.role = (user as { role: "local" | "business" | "admin" }).role
        }
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
