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
      // The 2026 partner guide deck is retired. It printed "2,400+ locals a
      // month" as "real numbers, this month" (measured July, stale by
      // September), pitched a Free tier we no longer sell, and priced Plus as
      // "let's talk" when it has been self-serve at $99.99 for weeks. Invites
      // already in inboxes link to it, so it redirects rather than 404s.
      { source: "/partner-guide.html", destination: "/partners", permanent: true },
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
      // "partners" is a membership status, not a kind of business, so
      // /category/partners 404s — and the owner hit it on Sep 21 2026 expecting
      // the roster of Official Partners. That roster now lives at /members.
      { source: "/category/partners", destination: "/members", permanent: true },
      { source: "/en/category/partners", destination: "/members", permanent: true },
      { source: "/es/category/partners", destination: "/es/members", permanent: true },
      { source: "/category/members", destination: "/members", permanent: true },
      { source: "/en/category/members", destination: "/members", permanent: true },
      { source: "/es/category/members", destination: "/es/members", permanent: true },
      // Retired and guessed category slugs. "Dispensaries" was a real category
      // until Sep 8 2026 (renamed to Construction; the dispensaries themselves
      // sit in Retail), and old posts still point at it. The rest are the
      // plausible words people type — and the ones our own marketing docs and
      // GBP post schedule wrote down before the slugs were settled.
      { source: "/category/dispensaries", destination: "/category/retail", permanent: true },
      { source: "/en/category/dispensaries", destination: "/category/retail", permanent: true },
      { source: "/es/category/dispensaries", destination: "/es/category/retail", permanent: true },
      { source: "/category/dispensary", destination: "/category/retail", permanent: true },
      { source: "/en/category/dispensary", destination: "/category/retail", permanent: true },
      { source: "/es/category/dispensary", destination: "/es/category/retail", permanent: true },
      { source: "/category/restaurants", destination: "/category/food-drink", permanent: true },
      { source: "/en/category/restaurants", destination: "/category/food-drink", permanent: true },
      { source: "/es/category/restaurants", destination: "/es/category/food-drink", permanent: true },
      { source: "/category/food", destination: "/category/food-drink", permanent: true },
      { source: "/en/category/food", destination: "/category/food-drink", permanent: true },
      { source: "/es/category/food", destination: "/es/category/food-drink", permanent: true },
      { source: "/category/automotive", destination: "/category/auto", permanent: true },
      { source: "/en/category/automotive", destination: "/category/auto", permanent: true },
      { source: "/es/category/automotive", destination: "/es/category/auto", permanent: true },
      { source: "/category/events", destination: "/events", permanent: true },
      { source: "/en/category/events", destination: "/events", permanent: true },
      { source: "/es/category/events", destination: "/es/events", permanent: true },
      // ── Words the site itself teaches ───────────────────────────────────
      // Sep 21 2026: /directory 404'd while the nav label right above it read
      // "Directory" (it points at /businesses) — the site was teaching people a
      // URL that did not exist. Same for "Neighborhood" (/feed) and the words
      // our own titles use: "Coupons", "Specials", "Wineries", "Weekly digest".
      // Rule: if a label, heading or badge names a word, the obvious URL for
      // that word must resolve. scripts/check-production.mjs section 16 guards it.
      { source: "/directory", destination: "/businesses", permanent: true },
      { source: "/en/directory", destination: "/businesses", permanent: true },
      { source: "/es/directory", destination: "/es/businesses", permanent: true },
      { source: "/neighborhood", destination: "/feed", permanent: true },
      { source: "/en/neighborhood", destination: "/feed", permanent: true },
      { source: "/es/neighborhood", destination: "/es/feed", permanent: true },
      { source: "/coupons", destination: "/deals", permanent: true },
      { source: "/en/coupons", destination: "/deals", permanent: true },
      { source: "/es/coupons", destination: "/es/deals", permanent: true },
      { source: "/specials", destination: "/deals", permanent: true },
      { source: "/en/specials", destination: "/deals", permanent: true },
      { source: "/es/specials", destination: "/es/deals", permanent: true },
      { source: "/wineries", destination: "/category/wineries", permanent: true },
      { source: "/en/wineries", destination: "/category/wineries", permanent: true },
      { source: "/es/wineries", destination: "/es/category/wineries", permanent: true },
      { source: "/restaurants", destination: "/category/food-drink", permanent: true },
      { source: "/en/restaurants", destination: "/category/food-drink", permanent: true },
      { source: "/es/restaurants", destination: "/es/category/food-drink", permanent: true },
      { source: "/digest", destination: "/subscribe", permanent: true },
      { source: "/en/digest", destination: "/subscribe", permanent: true },
      { source: "/es/digest", destination: "/es/subscribe", permanent: true },
      { source: "/newsletter", destination: "/subscribe", permanent: true },
      { source: "/en/newsletter", destination: "/subscribe", permanent: true },
      { source: "/es/newsletter", destination: "/es/subscribe", permanent: true },
      { source: "/grow", destination: "/signup/business", permanent: false },
      { source: "/en/grow", destination: "/signup/business", permanent: false },
      { source: "/es/grow", destination: "/es/signup/business", permanent: false },
    ]
  },
}

export default withNextIntl(nextConfig)
