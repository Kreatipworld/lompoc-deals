import type { Metadata } from "next"
import localFont from "next/font/local"
import { Fraunces } from "next/font/google"
import { getLocale } from "next-intl/server"
import "./globals.css"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["SOFT", "opsz"],
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
    "coupons",
    "local business",
    "Vandenberg Valley",
  ],
  openGraph: {
    title: "Lompoc Deals",
    description:
      "Local coupons, specials, and announcements from Lompoc, California businesses.",
    url: siteUrl,
    siteName: "Lompoc Deals",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lompoc Deals",
    description:
      "Local coupons, specials, and announcements from Lompoc, California businesses.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} flex min-h-screen flex-col antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
