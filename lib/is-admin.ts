import { auth } from "@/auth"

export async function getIsAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.role === "admin"
}
