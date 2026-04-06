import { LoginForm } from "./login-form"

export const metadata = { title: "Sign in — Lompoc Deals" }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string }
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to your Lompoc Deals account.
      </p>
      <div className="mt-8">
        <LoginForm from={searchParams.from} />
      </div>
    </div>
  )
}
