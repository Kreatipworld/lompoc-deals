import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Every optimized variant is cached for 30 days; the default (60 s) re-transformed
    // the same member photos over and over, and transformations are billed.
    minimumCacheTTL: 2592000,
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
      // The football word page grew into the hub.
      // Sep 13 2026: first realtor renamed her listing after claiming; keep the shared links alive.
      { source: "/biz/maressa-martinez-realtor", destination: "/biz/empire-real-estate-group-maressa-the-realtor", permanent: true },
      { source: "/:locale(en|es)/biz/maressa-martinez-realtor", destination: "/:locale/biz/empire-real-estate-group-maressa-the-realtor", permanent: true },
      { source: "/find/football", destination: "/football", permanent: true },
      { source: "/en/find/football", destination: "/football", permanent: true },
      { source: "/es/find/football", destination: "/es/football", permanent: true },
      { source: "/grow", destination: "/signup/business", permanent: false },
      { source: "/en/grow", destination: "/signup/business", permanent: false },
      { source: "/es/grow", destination: "/es/signup/business", permanent: false },
    ]
  },
}

export default withNextIntl(nextConfig)
