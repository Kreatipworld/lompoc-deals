import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" })
  return { title: t("resetPassword.metaTitle") }
}

import { Link } from "@/i18n/navigation"
import { ResetPasswordForm } from "./reset-password-form"

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  if (!searchParams.token) {
    return (
      <>
        <div className="space-y-2 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Invalid link
          </h1>
          <p className="text-sm text-muted-foreground">
            This reset link is missing or invalid.
          </p>
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Choose a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter a new password for your account.
        </p>
      </div>
      <div className="mt-8">
        <ResetPasswordForm token={searchParams.token} />
      </div>
    </>
  )
}
