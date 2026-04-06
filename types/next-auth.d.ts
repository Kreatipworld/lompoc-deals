import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "local" | "business" | "admin"
    } & DefaultSession["user"]
  }

  interface User {
    role: "local" | "business" | "admin"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: "local" | "business" | "admin"
  }
}
