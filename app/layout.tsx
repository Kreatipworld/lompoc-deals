import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { getLocale } from "next-intl/server"
import { Analytics } from "@vercel/analytics/react"
import { siteUrl } from "@/lib/seo"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

// Locale-neutral only. Titles, descriptions, Open Graph and Twitter cards are
// set per locale in app/[locale]/layout.tsx (siteMeta namespace) — anything
// English placed here is inherited by every /es page.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Feed discovery for readers, aggregators, and news crawlers.
  alternates: { types: { "application/rss+xml": `${siteUrl}/api/blog/rss` } },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} flex min-h-screen flex-col antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}
