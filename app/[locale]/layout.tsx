import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { Toaster } from "@/components/ui/sonner"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BottomNav } from "@/components/bottom-nav"
import { routing } from "@/i18n/routing"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as "en" | "es")) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SiteHeader />
      <main className="flex-1 pt-16 pb-16 sm:pt-0 sm:pb-0">{children}</main>
      <SiteFooter />
      <BottomNav />
      <Toaster />
    </NextIntlClientProvider>
  )
}
