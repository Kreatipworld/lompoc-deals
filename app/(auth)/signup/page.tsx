import { SignupForm } from "./signup-form"

export const metadata = { title: "Sign up — Lompoc Deals" }

export default function SignupPage() {
  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Save deals as a local, or post deals as a business.
        </p>
      </div>
      <div className="mt-8">
        <SignupForm />
      </div>
    </>
  )
}
