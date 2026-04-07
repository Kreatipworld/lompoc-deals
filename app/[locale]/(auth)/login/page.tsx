import { LoginForm } from "./login-form"

export const metadata = { title: "Sign in — Lompoc Deals" }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string }
}) {
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
