/**
 * Social reach used on seller pages (/realtors). Pulled from Buffer's aggregated
 * metrics (all channels, last 30 days) and refreshed by hand — Buffer has no
 * server-side API key in the app. Update `asOf` whenever the numbers change.
 * Rule: real numbers only (see memory "honest numbers").
 */
export const SOCIAL_PROOF = {
  asOf: "2026-09-16",
  windowDays: 30,
  posts: 191,
  reactions: 3385,
  shares: 879,
  comments: 201,
  tiktokFollowers: "1,000+",
  bestVideoViews: "25,000+", // Big Game (Braves at Conqs), Sep 2 2026, ≈26k views
} as const
