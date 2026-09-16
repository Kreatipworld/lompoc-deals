import { redirect } from "@/i18n/navigation"
import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@/i18n/routing"

// next-intl's redirect keeps the locale prefix; next/navigation's would drop /es.
export default function GarageSalesPostPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale)
  redirect({ href: "/feed/post?type=for_sale", locale: params.locale })
}
