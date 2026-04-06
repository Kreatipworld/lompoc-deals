import { SignupForm } from "./signup-form"

export const metadata = { title: "Sign up — Lompoc Deals" }

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Save deals as a local, or post deals as a business.
      </p>
      <div className="mt-8">
        <SignupForm />
      </div>
    </div>
  )
}
