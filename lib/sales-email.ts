/**
 * Lompoc Sales emails. The builders are pure (subject + html) so
 * lib/sales-email.test.ts can assert them; the senders wrap them with Resend.
 * Every send is from hello@lompoclocals.com. The buyer→seller relay sets
 * reply-to = buyer and does NOT copy hello@ — those conversations are private.
 */
import { brandedEmailHtml, emailSiteUrl, escapeHtml, FROM_ADDRESS, getResend } from "@/lib/email"

type Locale = "en" | "es"
export type BuiltEmail = { subject: string; html: string }

const loc = (l: string | null | undefined): Locale => (l === "es" ? "es" : "en")

export function buildSaleListingLiveEmail(opts: { title: string; listingId: number; locale?: string | null; expiresAt: Date }): BuiltEmail {
  const l = loc(opts.locale)
  const url = emailSiteUrl(`${l === "es" ? "/es" : ""}/sales/${opts.listingId}`)
  const until = opts.expiresAt.toLocaleDateString(l === "es" ? "es-US" : "en-US", { month: "long", day: "numeric", timeZone: "America/Los_Angeles" })
  const title = escapeHtml(opts.title)
  if (l === "es") {
    return {
      subject: `Tu anuncio "${opts.title}" ya está publicado`,
      html: brandedEmailHtml({
        heading: "Tu anuncio ya está en Lompoc Sales.",
        intro: `Revisamos <strong>${title}</strong> y ya lo pueden ver los vecinos de Lompoc y Vandenberg.`,
        bulletsTitle: "Qué sigue",
        bullets: [
          "Cuando alguien te escriba desde tu anuncio, te llega a este correo — responde directo.",
          `Tu anuncio se muestra hasta el ${until}.`,
          "Si ya lo vendiste, responde a este correo y lo marcamos como vendido.",
        ],
        ctaLabel: "Ver mi anuncio",
        ctaUrl: url,
        closing: "Gracias por vender con tus vecinos en vez de con un grupo de Facebook.",
        signoff: "— El equipo de Lompoc Locals",
      }),
    }
  }
  return {
    subject: `Your listing "${opts.title}" is live`,
    html: brandedEmailHtml({
      heading: "Your listing is live on Lompoc Sales.",
      intro: `We reviewed <strong>${title}</strong> and neighbors in Lompoc and Vandenberg can see it now.`,
      bulletsTitle: "What happens next",
      bullets: [
        "When someone messages you from your listing it lands in this inbox — just reply.",
        `Your listing shows until ${until}.`,
        "Sold it already? Reply to this email and we will mark it sold.",
      ],
      ctaLabel: "See my listing",
      ctaUrl: url,
      closing: "Thanks for selling to your neighbors instead of a Facebook group.",
      signoff: "— The Lompoc Locals team",
    }),
  }
}

export function buildSaleListingRejectedEmail(opts: { title: string; reason: string; locale?: string | null }): BuiltEmail {
  const l = loc(opts.locale)
  const url = emailSiteUrl(`${l === "es" ? "/es" : ""}/sales/post`)
  const title = escapeHtml(opts.title)
  const reason = escapeHtml(opts.reason)
  if (l === "es") {
    return {
      subject: `Tu anuncio "${opts.title}" no fue aprobado`,
      html: brandedEmailHtml({
        heading: "No pudimos publicar tu anuncio.",
        intro: `Revisamos <strong>${title}</strong> y no cumple con las reglas de Lompoc Sales.`,
        bulletsTitle: "Motivo",
        bullets: [reason],
        ctaLabel: "Publicar de nuevo",
        ctaUrl: url,
        closing: "Puedes corregirlo y volver a enviarlo. Si crees que es un error, responde a este correo.",
        signoff: "— El equipo de Lompoc Locals",
      }),
    }
  }
  return {
    subject: `Your listing "${opts.title}" wasn't approved`,
    html: brandedEmailHtml({
      heading: "We couldn't publish your listing.",
      intro: `We reviewed <strong>${title}</strong> and it doesn't fit the Lompoc Sales rules.`,
      bulletsTitle: "Reason",
      bullets: [reason],
      ctaLabel: "Post again",
      ctaUrl: url,
      closing: "You're welcome to fix it and submit again. If you think this is a mistake, reply to this email.",
      signoff: "— The Lompoc Locals team",
    }),
  }
}

export function buildSaleMessageRelayEmail(opts: {
  listing: { id: number; title: string }
  buyer: { name: string; email: string; phone?: string | null; message: string }
  locale?: string | null
}): BuiltEmail {
  const l = loc(opts.locale)
  const url = emailSiteUrl(`${l === "es" ? "/es" : ""}/sales/${opts.listing.id}`)
  const title = escapeHtml(opts.listing.title)
  const rows = [
    `<strong>${l === "es" ? "Nombre" : "Name"}:</strong> ${escapeHtml(opts.buyer.name)}`,
    `<strong>Email:</strong> <a href="mailto:${escapeHtml(opts.buyer.email)}">${escapeHtml(opts.buyer.email)}</a>`,
  ]
  if (opts.buyer.phone) rows.push(`<strong>${l === "es" ? "Teléfono" : "Phone"}:</strong> ${escapeHtml(opts.buyer.phone)}`)
  rows.push(`<strong>${l === "es" ? "Mensaje" : "Message"}:</strong> ${escapeHtml(opts.buyer.message).replace(/\n/g, "<br>")}`)
  if (l === "es") {
    return {
      subject: `Alguien pregunta por "${opts.listing.title}"`,
      html: brandedEmailHtml({
        heading: "Tienes un mensaje por tu anuncio.",
        intro: `Un vecino te escribió desde <strong>${title}</strong> en Lompoc Sales.`,
        bulletsTitle: "Sus datos",
        bullets: rows,
        ctaLabel: "Ver el anuncio",
        ctaUrl: url,
        closing: "Responde a este correo y tu respuesta le llega directo al comprador. Tu dirección de correo no se muestra en el sitio.",
        signoff: "— Lompoc Locals · Lompoc Sales",
      }),
    }
  }
  return {
    subject: `Someone is asking about "${opts.listing.title}"`,
    html: brandedEmailHtml({
      heading: "You have a message about your listing.",
      intro: `A neighbor wrote to you from <strong>${title}</strong> on Lompoc Sales.`,
      bulletsTitle: "Their details",
      bullets: rows,
      ctaLabel: "Open the listing",
      ctaUrl: url,
      closing: "Reply to this email and your answer goes straight to the buyer. Your email address is never shown on the site.",
      signoff: "— Lompoc Locals · Lompoc Sales",
    }),
  }
}

export function buildSalesVerifyEmail(opts: { token: string; locale?: string | null }): BuiltEmail {
  const l = loc(opts.locale)
  const url = emailSiteUrl(`/api/sales/verify-email?token=${encodeURIComponent(opts.token)}`)
  if (l === "es") {
    return {
      subject: "Confirma tu correo para publicar en Lompoc Sales",
      html: brandedEmailHtml({
        heading: "Un clic y puedes publicar.",
        intro: "Para publicar en Lompoc Sales necesitamos confirmar que este correo es tuyo — así los compradores te pueden responder.",
        bulletsTitle: "",
        bullets: [],
        ctaLabel: "Confirmar mi correo",
        ctaUrl: url,
        closing: "El enlace vale 24 horas. Si no pediste esto, ignora este correo.",
        signoff: "— El equipo de Lompoc Locals",
      }),
    }
  }
  return {
    subject: "Confirm your email to post on Lompoc Sales",
    html: brandedEmailHtml({
      heading: "One click and you can post.",
      intro: "To post on Lompoc Sales we need to confirm this email is yours — it's how buyers reach you.",
      bulletsTitle: "",
      bullets: [],
      ctaLabel: "Confirm my email",
      ctaUrl: url,
      closing: "The link works for 24 hours. If you didn't ask for this, ignore this email.",
      signoff: "— The Lompoc Locals team",
    }),
  }
}

// ── senders (never throw) ──────────────────────────────────────────────────

async function send(to: string, built: BuiltEmail, extra: { replyTo?: string } = {}): Promise<string | null> {
  const resend = getResend()
  if (!resend) {
    console.warn("[sales-email] RESEND_API_KEY not set; skipping send")
    return null
  }
  try {
    const res = await resend.emails.send({ from: FROM_ADDRESS, to, subject: built.subject, html: built.html, ...extra })
    return res.data?.id ?? null
  } catch (err) {
    console.error("[sales-email] send failed:", err)
    return null
  }
}

export async function sendSaleListingLiveEmail(to: string, opts: Parameters<typeof buildSaleListingLiveEmail>[0]) {
  return send(to, buildSaleListingLiveEmail(opts))
}

export async function sendSaleListingRejectedEmail(to: string, opts: Parameters<typeof buildSaleListingRejectedEmail>[0]) {
  return send(to, buildSaleListingRejectedEmail(opts))
}

/** Seller gets the buyer's message; reply-to is the buyer; hello@ is NOT copied. */
export async function sendSaleMessageRelayEmail(sellerEmail: string, opts: Parameters<typeof buildSaleMessageRelayEmail>[0]) {
  return send(sellerEmail, buildSaleMessageRelayEmail(opts), { replyTo: opts.buyer.email })
}

export async function sendSalesVerifyEmail(to: string, opts: Parameters<typeof buildSalesVerifyEmail>[0]) {
  return send(to, buildSalesVerifyEmail(opts))
}
