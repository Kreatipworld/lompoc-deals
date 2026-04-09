import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.evbuc.com" },
      { protocol: "https", hostname: "**.evbdn.com" },
      { protocol: "https", hostname: "**.eventbrite.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
}

export default withNextIntl(nextConfig)
