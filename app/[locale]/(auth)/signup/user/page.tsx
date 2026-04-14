import { Heart } from "lucide-react"
import { UserSignupForm } from "./user-signup-form"

export const metadata = { title: "Sign up as a local — Lompoc Deals" }

export default function UserSignupPage() {
  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Heart className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Join as a local
          </h1>
          <p className="text-sm text-muted-foreground">
            Save deals, follow businesses, and discover what&apos;s happening in Lompoc. Free forever.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <UserSignupForm />
      </div>
    </>
  )
}
