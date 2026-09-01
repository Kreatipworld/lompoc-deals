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
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
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
      // The master Growth link — printable, speakable, shareable. Lands on the
      // business signup wizard (Growth preselected): list the business, pick
      // the plan, card, done — the Rieck flow, self-serve for anybody.
      // Row 409's slug carried Google's clunky listing name ("...formally (Ron's...)").
      // The row now uses the clean slug; the indexed old URL 301s to it.
      { source: "/biz/heritage-home-plumbing-services-formally-ron-s-plumbing-heating-a-c", destination: "/biz/heritage-home-plumbing-services", permanent: true },
      { source: "/en/biz/heritage-home-plumbing-services-formally-ron-s-plumbing-heating-a-c", destination: "/en/biz/heritage-home-plumbing-services", permanent: true },
      { source: "/es/biz/heritage-home-plumbing-services-formally-ron-s-plumbing-heating-a-c", destination: "/es/biz/heritage-home-plumbing-services", permanent: true },
      { source: "/grow", destination: "/signup/business", permanent: false },
      { source: "/en/grow", destination: "/signup/business", permanent: false },
      { source: "/es/grow", destination: "/es/signup/business", permanent: false },
    ]
  },
}

export default withNextIntl(nextConfig)
