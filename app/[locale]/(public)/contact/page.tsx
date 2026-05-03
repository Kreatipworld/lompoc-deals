import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Mail, Building2, Heart } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "contactPage" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default async function ContactPage() {
  const t = await getTranslations("contactPage")

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {t("intro")}
        </p>
      </div>

      {/* Three cards */}
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {/* Email card */}
        <div className="flex flex-col items-center rounded-2xl border bg-card p-7 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold tracking-tight">
            {t("emailCard.title")}
          </h2>
          <a
            href="mailto:hello@lompocdeals.com"
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            {t("emailCard.label")}
          </a>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("emailCard.description")}
          </p>
        </div>

        {/* For business owners card */}
        <div className="flex flex-col items-center rounded-2xl border bg-card p-7 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold tracking-tight">
            {t("businessCard.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("businessCard.description")}
          </p>
          <Link
            href="/for-businesses"
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            {t("businessCard.linkLabel")} →
          </Link>
        </div>

        {/* For locals card */}
        <div className="flex flex-col items-center rounded-2xl border bg-card p-7 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold tracking-tight">
            {t("localsCard.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("localsCard.description")}
          </p>
          <Link
            href="/locals"
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            {t("localsCard.linkLabel")} →
          </Link>
        </div>
      </div>

      {/* Contact form — mailto v1, no backend */}
      <div className="mt-16 rounded-2xl border bg-card p-8 shadow-sm">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          {t("formSection.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("formSection.subtitle")}
        </p>

        <form
          action="mailto:hello@lompocdeals.com"
          method="post"
          encType="text/plain"
          className="mt-6 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="contact-name"
                className="text-sm font-medium leading-none"
              >
                {t("formSection.nameLabel")}
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                placeholder={t("formSection.namePlaceholder")}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="contact-email"
                className="text-sm font-medium leading-none"
              >
                {t("formSection.emailLabel")}
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                placeholder={t("formSection.emailPlaceholder")}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="contact-message"
              className="text-sm font-medium leading-none"
            >
              {t("formSection.messageLabel")}
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={5}
              placeholder={t("formSection.messagePlaceholder")}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {t("formSection.submitLabel")}
          </button>
        </form>
      </div>
    </div>
  )
}
