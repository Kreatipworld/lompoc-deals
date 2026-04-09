import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "./login-form"

export const metadata = { title: "Sign in — Lompoc Deals" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string }
}) {
  const session = await auth()
  if (session?.user) {
    const destination =
      searchParams.from ??
      (session.user.role === "business" ? "/dashboard" : "/")
    redirect(destination)
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Lompoc Deals account.
        </p>
      </div>
      <div className="mt-8">
        <LoginForm from={searchParams.from} />
      </div>
    </>
  )
}
