import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "terms" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default async function TermsPage() {
  const t = await getTranslations("terms")

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("pageTitle")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdated")}</p>

      <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert">
        {/* 1. Acceptance */}
        <h2>{t("acceptance.title")}</h2>
        <p>{t("acceptance.body")}</p>

        {/* 2. Description */}
        <h2>{t("description.title")}</h2>
        <p>{t("description.body")}</p>

        {/* 3. Registration */}
        <h2>{t("registration.title")}</h2>
        <p>{t("registration.body")}</p>

        {/* 4. Subscriptions */}
        <h2>{t("subscriptions.title")}</h2>
        <p>{t("subscriptions.intro")}</p>
        <ul>
          {(t.raw("subscriptions.items") as string[]).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <p>{t("subscriptions.billing")}</p>

        {/* 5. User-generated content */}
        <h2>{t("ugc.title")}</h2>
        <p>{t("ugc.body")}</p>

        {/* 6. Prohibited conduct */}
        <h2>{t("prohibited.title")}</h2>
        <p>{t("prohibited.intro")}</p>
        <ul>
          {(t.raw("prohibited.items") as string[]).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        {/* 7. Business listings */}
        <h2>{t("listings.title")}</h2>
        <p>{t("listings.body")}</p>

        {/* 8. Intellectual property */}
        <h2>{t("ip.title")}</h2>
        <p>{t("ip.body")}</p>

        {/* 9. Disclaimers */}
        <h2>{t("disclaimers.title")}</h2>
        <p>{t("disclaimers.body")}</p>

        {/* 10. Limitation of liability */}
        <h2>{t("liability.title")}</h2>
        <p>{t("liability.body")}</p>

        {/* 11. Termination */}
        <h2>{t("termination.title")}</h2>
        <p>{t("termination.body")}</p>

        {/* 12. Governing law */}
        <h2>{t("governing.title")}</h2>
        <p>{t("governing.body")}</p>

        {/* 13. Changes to terms */}
        <h2>{t("changesTerms.title")}</h2>
        <p>{t("changesTerms.body")}</p>

        {/* 14. Contact */}
        <h2>{t("contactSection.title")}</h2>
        <p>{t("contactSection.body")}</p>
        <p>
          <a href="mailto:hello@lompocdeals.com">hello@lompocdeals.com</a>
        </p>
      </div>

      <div className="mt-12 border-t pt-6 text-sm text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground hover:underline">
          Privacy Policy
        </Link>
        {" · "}
        <Link href="/contact" className="hover:text-foreground hover:underline">
          Contact
        </Link>
      </div>
    </div>
  )
}
