export type EventName =
  | "search_run"
  | "map_pin_clicked"
  | "business_page_viewed"
  | "local_signup"
  | "digest_subscribed"
  | "favorite_added"
  | "business_signup"
  | "business_profile_saved"
  | "business_claim_submitted"
  | "business_claim_approved"
  | "first_deal_posted"
  | "paid_upgrade"
  | "deal_view"
  | "deal_click"
  | "deal_claim"
  | "deal_redeem"

export interface EventProps {
  search_run: { query: string; resultCount: number; locale: "en" | "es" }
  map_pin_clicked: { from: "map" | "list" }
  business_page_viewed: { locale: "en" | "es"; referrer?: string }
  local_signup: { via: "email" | "google" }
  digest_subscribed: { doubleOptIn: boolean }
  favorite_added: Record<string, never>
  business_signup: { via: "email" | "google" }
  business_profile_saved: { firstSave: boolean }
  business_claim_submitted: Record<string, never>
  business_claim_approved: { adminUserId: number }
  first_deal_posted: { dealId: number; type: "coupon" | "special" | "announcement" }
  paid_upgrade: { tier: "standard" | "premium"; priceUsdCents: number }
  deal_view: Record<string, never>
  deal_click: Record<string, never>
  deal_claim: Record<string, never>
  deal_redeem: Record<string, never>
}

export type EventPropsFor<N extends EventName> = EventProps[N]
