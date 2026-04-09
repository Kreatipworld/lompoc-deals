import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { getLocale } from "next-intl/server"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lompoc Deals — local coupons, specials, and announcements",
    template: "%s | Lompoc Deals",
  },
  description:
    "The latest deals from Lompoc, California businesses. Coupons, specials, and announcements updated daily.",
  keywords: [
    "Lompoc",
    "Lompoc CA",
    "Lompoc deals",
    "lompoc coupons",
    "things to do in lompoc",
    "local business",
    "ofertas en lompoc",
    "Vandenberg Valley",
  ],
  openGraph: {
    title: "Lompoc Deals — Local Coupons & Things To Do",
    description:
      "Browse deals from 155+ Lompoc, California businesses — restaurants, salons, services, and more. Free to claim.",
    url: siteUrl,
    siteName: "Lompoc Deals",
    locale: "en_US",
    type: "website",
    images: [{ url: "/lompoc-flowers-4.jpg", width: 1200, height: 630, alt: "Lompoc, California flower fields" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lompoc Deals — Local Coupons & Things To Do",
    description:
      "Browse deals from 155+ Lompoc, CA businesses — free to claim, updated daily.",
  },
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
      </body>
    </html>
  )
}
