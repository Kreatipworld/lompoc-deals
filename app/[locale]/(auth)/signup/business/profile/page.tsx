import { confirmCheckoutOnReturn } from "@/lib/business-signup-actions"
import { BusinessProfileSetupForm } from "./profile-form"

// Server wrapper: when Stripe redirects back with a session_id, verify the
// payment immediately and unlock the paid tier — the webhook is a backup, not
// the only path (a paying customer must never land in the app still on Free).
export default async function BusinessProfileSetupPage({
  searchParams,
}: {
  searchParams: { session_id?: string; stripe_pending?: string }
}) {
  let paidConfirmed = false
  if (searchParams.session_id) {
    paidConfirmed = (await confirmCheckoutOnReturn(searchParams.session_id)) === "paid"
  }
  return (
    <BusinessProfileSetupForm
      stripePending={searchParams.stripe_pending === "1"}
      paidConfirmed={paidConfirmed}
    />
  )
}
