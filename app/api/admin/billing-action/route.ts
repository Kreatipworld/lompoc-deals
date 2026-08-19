import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export const dynamic = "force-dynamic"

/**
 * One-off admin billing operations, executed where the live Stripe key lives.
 * Bearer CRON_SECRET + an explicit subscription allowlist — this is a scalpel,
 * not a surface. Extend the allowlist deliberately, never wildcard it.
 *
 * Actions:
 *  - charge_now:   end the trial immediately → Stripe invoices the plan price
 *                  today on the default card. Refuses if no payment method.
 *  - defer_renewal: push the next invoice out by `days` (trial_end trick,
 *                  proration none). Use AFTER charge_now to grant bonus days:
 *                  charged today, next invoice at +days, monthly after that.
 *  - inspect:      read-only snapshot (status, card on file, upcoming invoice).
 *  - pay_link:     recovery links for a past-due member — the hosted page of the
 *                  open invoice (stable URL; paying it saves the new card) plus a
 *                  fresh billing-portal session (short-lived, mint on demand).
 */
const ALLOWED_SUBSCRIPTIONS = new Set([
  "sub_1U1BrpGlg4SBRCBhWhuSwcev",
  // Eye on I — past_due since Aug 18; recovery links only.
  "sub_1U0DsCGlg4SBRCBhKCAWbGsc",
])

export async function POST(request: Request) {
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { action, subscriptionId, days } = await request.json()
  if (!ALLOWED_SUBSCRIPTIONS.has(subscriptionId)) {
    return NextResponse.json({ error: "Subscription not on the allowlist" }, { status: 403 })
  }

  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["customer", "default_payment_method"],
  })
  const customer = sub.customer as { id: string; invoice_settings?: { default_payment_method?: unknown } }
  const hasCard = Boolean(sub.default_payment_method || customer.invoice_settings?.default_payment_method)

  if (action === "inspect") {
    let upcoming = null
    try {
      const inv = await stripe.invoices.createPreview({ customer: customer.id })
      upcoming = { amount_due: inv.amount_due, next_payment_attempt: inv.next_payment_attempt, period_end: inv.period_end }
    } catch { /* no upcoming invoice */ }
    return NextResponse.json({
      status: sub.status,
      trial_end: sub.trial_end,
      current_period_end: sub.items.data[0]?.current_period_end ?? null,
      has_payment_method: hasCard,
      upcoming,
    })
  }

  if (action === "pay_link") {
    const invoices = await stripe.invoices.list({ customer: customer.id, limit: 5 })
    const open = invoices.data.find((i) => i.status === "open")
    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.AUTH_URL ?? "https://www.lompoclocals.com"}/dashboard/billing`,
    })
    return NextResponse.json({
      status: sub.status,
      has_payment_method: hasCard,
      open_invoice: open
        ? { id: open.id, amount_due: open.amount_due, hosted_invoice_url: open.hosted_invoice_url }
        : null,
      portal_url: portal.url,
    })
  }

  if (action === "charge_now") {
    if (!hasCard) {
      return NextResponse.json({ error: "No payment method on file — aborting, nothing charged" }, { status: 409 })
    }
    if (sub.status !== "trialing") {
      return NextResponse.json({ error: `Subscription is ${sub.status}, not trialing — nothing to end` }, { status: 409 })
    }
    const updated = await stripe.subscriptions.update(subscriptionId, { trial_end: "now" })
    const invoice = updated.latest_invoice
      ? await stripe.invoices.retrieve(String(updated.latest_invoice))
      : null
    return NextResponse.json({
      status: updated.status,
      invoice: invoice
        ? { id: invoice.id, amount_due: invoice.amount_due, status: invoice.status }
        : null,
    })
  }

  if (action === "defer_renewal") {
    const d = Number(days)
    if (!Number.isInteger(d) || d < 1 || d > 60) {
      return NextResponse.json({ error: "days must be 1-60" }, { status: 400 })
    }
    const target = Math.floor(Date.now() / 1000) + d * 86400
    const updated = await stripe.subscriptions.update(subscriptionId, {
      trial_end: target,
      proration_behavior: "none",
    })
    return NextResponse.json({
      status: updated.status,
      next_invoice_at: new Date(target * 1000).toISOString(),
    })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
