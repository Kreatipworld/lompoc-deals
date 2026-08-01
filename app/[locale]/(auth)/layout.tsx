import { Link } from "@/i18n/navigation"
import { BrandLogo } from "@/components/brand-logo"
import { ArrowLeft } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getTranslations("auth")
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

      {/* Widens automatically while a step renders [data-wide-step] (plan selection) */}
      <div className="w-full max-w-md transition-[max-width] duration-500 ease-out has-[[data-wide-step]]:max-w-4xl">
        {/* Brand lockup. It has always linked home, but nothing about it said so — no hover, no
            affordance — so on a phone (where most claim links are opened, straight out of an
            email) it read as decoration. The transition gives it a state on tap and hover; the
            worded link below the card is what people actually find. */}
        <Link
          href="/"
          className="mx-auto mb-8 flex items-center justify-center transition-opacity hover:opacity-70 active:opacity-60"
          aria-label="Lompoc Locals home"
        >
          <BrandLogo className="h-12 w-auto" />
        </Link>

        {/* Card */}
        <div className="rounded-3xl border bg-card p-8 shadow-xl shadow-primary/5 sm:p-10">
          {children}
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backHome")}
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing you agree to be a kind neighbor and not spam local
          businesses.
        </p>
      </div>
    </div>
  )
}
