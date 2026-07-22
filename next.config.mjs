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
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async redirects() {
    // /for-businesses was renamed to /partners. A page-level redirect() call
    // is unreliable here once next-intl's middleware rewrites the unprefixed
    // (default-locale) and /es/ URLs internally, so the rename is handled at
    // the routing layer instead — covers the default locale (unprefixed),
    // /en/, and /es/ variants.
    return [
      { source: "/for-businesses", destination: "/partners", permanent: true },
      { source: "/en/for-businesses", destination: "/partners", permanent: true },
      { source: "/es/for-businesses", destination: "/es/partners", permanent: true },
    ]
  },
}

export default withNextIntl(nextConfig)
