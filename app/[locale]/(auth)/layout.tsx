import Link from "next/link"
import { Flower2 } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Decorative gradient blobs */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-accent via-background to-background"
      />
      <div
        aria-hidden
        className="absolute -top-32 left-[-10%] -z-10 h-[420px] w-[420px] rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 right-[-10%] -z-10 h-[460px] w-[460px] rounded-full bg-primary/10 blur-3xl"
      />

      <div className="w-full max-w-md">
        {/* Brand lockup */}
        <Link
          href="/"
          className="mx-auto mb-8 flex items-center justify-center gap-2"
          aria-label="Lompoc Deals home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Flower2 className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Lompoc Deals
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-3xl border bg-card p-8 shadow-xl shadow-primary/5 sm:p-10">
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to be a kind neighbor and not spam local
          businesses.
        </p>
      </div>
    </div>
  )
}
