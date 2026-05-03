import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "privacy" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy")

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("pageTitle")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdated")}</p>

      <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert">
        {/* 1. Introduction */}
        <h2>{t("intro.title")}</h2>
        <p>{t("intro.body")}</p>

        {/* 2. Information we collect */}
        <h2>{t("collection.title")}</h2>
        <p>{t("collection.body")}</p>
        <ul>
          <li>{t("collection.accountInfo")}</li>
          <li>{t("collection.businessInfo")}</li>
          <li>{t("collection.browsingData")}</li>
          <li>{t("collection.paymentInfo")}</li>
        </ul>

        {/* 3. How we use it */}
        <h2>{t("usage.title")}</h2>
        <p>{t("usage.intro")}</p>
        <ul>
          {(t.raw("usage.items") as string[]).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        {/* 4. Third-party services */}
        <h2>{t("thirdParties.title")}</h2>
        <p>{t("thirdParties.intro")}</p>
        <ul>
          {(t.raw("thirdParties.items") as string[]).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <p>
          <strong>{t("thirdParties.noSale")}</strong>
        </p>

        {/* 5. Cookies */}
        <h2>{t("cookies.title")}</h2>
        <p>{t("cookies.body")}</p>

        {/* 6. California Privacy Rights */}
        <h2>{t("california.title")}</h2>
        <p>{t("california.intro")}</p>
        <ul>
          {(t.raw("california.items") as string[]).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <p>{t("california.howToExercise")}</p>

        {/* 7. Data retention */}
        <h2>{t("retention.title")}</h2>
        <p>{t("retention.body")}</p>

        {/* 8. Children's privacy */}
        <h2>{t("children.title")}</h2>
        <p>{t("children.body")}</p>

        {/* 9. Security */}
        <h2>{t("security.title")}</h2>
        <p>{t("security.body")}</p>

        {/* 10. Changes */}
        <h2>{t("changes.title")}</h2>
        <p>{t("changes.body")}</p>

        {/* 11. Contact */}
        <h2>{t("contactSection.title")}</h2>
        <p>{t("contactSection.body")}</p>
        <p>
          <a href="mailto:hello@lompocdeals.com">hello@lompocdeals.com</a>
        </p>
      </div>

      <div className="mt-12 border-t pt-6 text-sm text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground hover:underline">
          Terms of Service
        </Link>
        {" · "}
        <Link href="/contact" className="hover:text-foreground hover:underline">
          Contact
        </Link>
      </div>
    </div>
  )
}
