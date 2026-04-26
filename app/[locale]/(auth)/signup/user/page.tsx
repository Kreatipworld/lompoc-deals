import { Heart } from "lucide-react"
import { UserSignupForm } from "./user-signup-form"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" })
  return {
    title: t("signupUser.metaTitle"),
    description: t("signupUser.metaDescription"),
  }
}

export default async function UserSignupPage({
  params,
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" })

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Heart className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t("signupUser.heading")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("signupUser.subheading")}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <UserSignupForm />
      </div>
    </>
  )
}
