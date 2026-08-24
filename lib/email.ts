import { Resend } from "resend"
import crypto from "node:crypto"
import type { DealCardData } from "@/lib/queries"
import type { DigestEvent, ThemedDigestContent, MasterDigestContent } from "@/lib/digest"
import { selectLead } from "@/lib/digest"

export type DealNotificationData = {
  id: number
  title: string
  description: string | null
  discountText: string | null
  businessName: string
  businessSlug: string
}

const FROM_ADDRESS = "Lompoc Locals <hello@lompoclocals.com>"

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function siteUrl(path = "") {
  const base = process.env.AUTH_URL ?? "http://localhost:3000"
  return `${base.replace(/\/$/, "")}${path}`
}

/**
 * RFC 8058 one-click unsubscribe headers for bulk mail (digest, broadcasts,
 * launch alerts). Gmail/Yahoo bulk-sender rules require these. Points at
 * /api/unsubscribe, which verifies the same HMAC (see expectedToken there —
 * keep the two implementations in sync) and writes to email_suppressions;
 * every subscriber send filters that table.
 */
function unsubSignature(email: string): string {
  return crypto
    .createHmac("sha256", process.env.AUTH_SECRET || "")
    .update(email.trim().toLowerCase())
    .digest("base64url")
    .slice(0, 24)
}

function oneClickUnsubHeaders(email: string): Record<string, string> {
  const addr = email.trim().toLowerCase()
  const url = siteUrl(`/api/unsubscribe?e=${encodeURIComponent(addr)}&t=${unsubSignature(addr)}`)
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  }
}

/**
 * Signed token for /api/notifications/unsubscribe. Format:
 * base64url(email) + "." + HMAC signature — the bare base64 form it replaced
 * let anyone disable any user's notifications by encoding their address.
 */
export function notificationUnsubToken(email: string): string {
  return `${Buffer.from(email).toString("base64url")}.${unsubSignature(email)}`
}

/**
 * Internal alert to the founder inbox for key platform events (new member,
 * new business signup, new claim). Sends to NOTIFY_EMAIL (default
 * hello@lompoclocals.com, which forwards to the founder). Fire-and-forget —
 * never throws into the caller, so a notification failure can't break signup,
 * checkout, or a webhook.
 */
export async function notifyPlatform(subject: string, lines: string[]): Promise<void> {
  const resend = getResend()
  if (!resend) return
  const to = process.env.NOTIFY_EMAIL ?? "hello@lompoclocals.com"
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">
    <h2 style="color:#650C75;margin:0 0 12px">${subject}</h2>
    ${lines.map((l) => `<p style="margin:0 0 6px">${l}</p>`).join("")}
    <p style="margin:16px 0 0;color:#888;font-size:13px">Lompoc Locals · automated notification</p>
  </div>`
  try {
    await resend.emails.send({ from: FROM_ADDRESS, to, subject, html })
  } catch (err) {
    console.error("[notifyPlatform] send failed:", err)
  }
}

// ── Welcome emails ──────────────────────────────────────────────────────────
const BRAND_PURPLE = "#650C75"

function welcomeHtml(opts: {
  heading: string
  intro: string
  bulletsTitle: string
  bullets: string[]
  ctaLabel: string
  ctaUrl: string
  closing: string
  signoff: string
}): string {
  return `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
    <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
      <img src="https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png" alt="Lompoc Locals — community &amp; communication for Lompoc" width="180" height="117" style="display:inline-block;">
    </div>
    <div style="height:6px; background:linear-gradient(90deg,#EFC618 0%,#0B992F 55%,#650C75 100%);"></div>
    <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
      <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">${opts.heading}</h1>
      <div style="height:3px; width:52px; background:#EFC618; border-radius:2px; margin:0 0 18px;"></div>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">${opts.intro}</p>
      ${opts.bullets.length ? `<p style="color:#1a1a1a; font-weight:600; margin:0 0 8px;">${opts.bulletsTitle}</p>
      <ul style="color:#444; line-height:1.7; margin:0 0 24px; padding-left:20px;">
        ${opts.bullets.map((b) => `<li>${b}</li>`).join("")}
      </ul>` : ""}
      ${opts.ctaLabel && opts.ctaUrl ? `<p style="margin:0 0 28px;">
        <a href="${opts.ctaUrl}" style="display:inline-block; background:${BRAND_PURPLE}; color:#ffffff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:600;">${opts.ctaLabel}</a>
      </p>` : ""}
      <p style="color:#444; line-height:1.6; margin:0 0 4px;">${opts.closing}</p>
      <p style="color:#888; margin:16px 0 0;">${opts.signoff}</p>
      <div style="margin-top:26px; padding-top:18px; border-top:1px solid #eee; text-align:center;">
        <div style="margin-bottom:8px;">
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#650C75; margin:0 3px;"></span>
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#EFC618; margin:0 3px;"></span>
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#0B992F; margin:0 3px;"></span>
        </div>
        <div style="font-size:14px; font-weight:700; color:#650C75;">lompoclocals.com</div>
        <div style="font-size:12px; color:#999; margin-top:2px;">community &amp; communication for Lompoc, California</div>
      </div>
    </div>
  </div>`
}

/** Welcome email for a new business account. Fire-and-forget — never throws. */
export async function sendBusinessWelcomeEmail(email: string, name: string, locale: "en" | "es"): Promise<void> {
  const resend = getResend()
  if (!resend) return
  const dashUrl = siteUrl(`/${locale}/dashboard`)
  const billingUrl = siteUrl(`/${locale}/dashboard/billing`)
  // Social proof with LIVE numbers — hardcoded counts go stale, and stale
  // numbers in an owner's first email cost trust. Falls back to prose if the
  // query hiccups; the email still sends.
  let bizCountLine = { en: "hundreds of Lompoc businesses", es: "cientos de negocios de Lompoc" }
  try {
    const { db } = await import("@/db/client")
    const { sql } = await import("drizzle-orm")
    const res = await db.execute(sql`select count(*)::int as c from businesses where status = 'approved'`)
    // tolerate both driver result shapes ({rows: [...]} or a bare array)
    const first = (res as unknown as { rows?: { c: number }[] }).rows?.[0]
      ?? (Array.isArray(res) ? (res as { c: number }[])[0] : undefined)
    const c = Number(first?.c ?? 0)
    if (c > 0) {
      const rounded = `${Math.floor(c / 10) * 10}+`
      bizCountLine = { en: `${rounded} Lompoc businesses`, es: `más de ${Math.floor(c / 10) * 10} negocios de Lompoc` }
    }
  } catch { /* keep the prose fallback */ }
  const proof = {
    en: `<br><br>You're in good company: ${bizCountLine.en} are already on the platform, and neighbors browse thousands of business pages here every month. Official Partners like Eddie's Grill, Eye on I, and Vargas Jewelers sit at the top of the most-viewed list — that's the spot Growth puts you in.`,
    es: `<br><br>Estás en buena compañía: ${bizCountLine.es} ya están en la plataforma, y los vecinos visitan miles de páginas de negocios cada mes. Socios oficiales como Eddie's Grill, Eye on I y Vargas Jewelers encabezan la lista de los más vistos — ese es el lugar que Growth te da.`,
  }
  const greet = name?.trim()
    ? locale === "es" ? `Hola ${name.trim()}, ` : `Hi ${name.trim()}, `
    : locale === "es" ? "Hola, " : "Hi there, "
  const content =
    locale === "es"
      ? {
          subject: "Bienvenido a Lompoc Locals — tu página está activa",
          html: welcomeHtml({
            heading: "Bienvenido al vecindario.",
            intro:
              greet + `gracias por sumar tu negocio a Lompoc Locals — el punto de encuentro donde los vecinos de Lompoc y Vandenberg descubren los lugares que hacen nuestro pueblo. Tu perfil ya está activo: los locales pueden encontrarte en el directorio, en el mapa y en la búsqueda local. Es tuyo para gestionar — agrega fotos, horarios y tu historia cuando quieras desde <a href="${dashUrl}" style="color:#650C75;font-weight:600;">tu panel</a>.` + proof.es,
            bulletsTitle: "¿Quieres hacer más? Con el plan Growth puedes:",
            bullets: [
              "Publica ofertas y cupones cuando quieras — aparecen en el feed y en nuestro resumen semanal de la comunidad",
              "Lugar destacado en ese resumen semanal para que más vecinos te vean",
              "Mira cuántos locales visitan tu página cada semana — números reales",
              "Aparece primero en tu categoría para que los vecinos te encuentren",
            ],
            ctaLabel: "Activa Growth",
            ctaUrl: billingUrl,
            closing:
              "$39.99/mes — cancela cuando quieras, y tu perfil sigue gratis de todos modos. Responde a este correo cuando quieras; lo lee una persona real aquí en Lompoc.",
            signoff: "— El equipo de Lompoc Locals",
          }),
        }
      : {
          subject: "Welcome to Lompoc Locals — your page is live",
          html: welcomeHtml({
            heading: "Welcome to the neighborhood.",
            intro:
              greet + `thanks for adding your business to Lompoc Locals — the community hub where Lompoc and Vandenberg neighbors discover the places that make our town ours. Your listing is live, so locals can already find you in the directory, on the map, and in local search. It's yours to run — add photos, hours, and your story anytime from <a href="${dashUrl}" style="color:#650C75;font-weight:600;">your dashboard</a>.` + proof.en,
            bulletsTitle: "Want to do more? With Growth you can:",
            bullets: [
              "Post specials &amp; coupons anytime — they hit the feed and our weekly community digest to locals' inboxes",
              "Featured placement in that weekly digest so more neighbors see you",
              "See how many locals view your page each week — real numbers",
              "Show up first in your category so neighbors find you first",
            ],
            ctaLabel: "Upgrade to Growth",
            ctaUrl: billingUrl,
            closing:
              "$39.99/month — cancel anytime, and your listing stays free either way. Reply to this email anytime; it reaches a real person here in Lompoc.",
            signoff: "— The Lompoc Locals team",
          }),
        }
  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject: content.subject, html: content.html })
  } catch (err) {
    console.error("[email] business welcome failed:", err)
  }
}

/** Auto-acknowledgement to a member who filed a support ticket. Fire-and-forget. */
export async function sendTicketAckEmail(
  email: string,
  ticketSubject: string,
  locale: "en" | "es"
): Promise<void> {
  const resend = getResend()
  if (!resend) return
  const dashUrl = siteUrl(`/${locale}/dashboard`)
  const content =
    locale === "es"
      ? {
          subject: "Recibimos tu mensaje — Lompoc Locals",
          html: welcomeHtml({
            heading: "Estamos en ello.",
            intro: `Gracias por escribirnos sobre &ldquo;${ticketSubject}&rdquo;. Lo registramos y nuestro equipo ya está trabajando en ello — te responderemos a este correo lo antes posible. Mientras tanto, todo en tu panel sigue funcionando.`,
            bulletsTitle: "",
            bullets: [],
            ctaLabel: "Volver a tu panel",
            ctaUrl: dashUrl,
            closing: "Responde a este correo cuando quieras — lo lee una persona real aquí en Lompoc.",
            signoff: "— El equipo de Lompoc Locals",
          }),
        }
      : {
          subject: "We got your message — Lompoc Locals",
          html: welcomeHtml({
            heading: "We're on it.",
            intro: `Thanks for reaching out about &ldquo;${ticketSubject}&rdquo;. We've logged it and our team is already on it — we'll follow up at this email as soon as we can. In the meantime, everything on your dashboard keeps working.`,
            bulletsTitle: "",
            bullets: [],
            ctaLabel: "Back to your dashboard",
            ctaUrl: dashUrl,
            closing: "Reply to this email any time — it reaches a real person here in Lompoc.",
            signoff: "— The Lompoc Locals team",
          }),
        }
  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject: content.subject, html: content.html })
  } catch (err) {
    console.error("[email] ticket ack failed:", err)
  }
}

/** Welcome email for a new local account. Fire-and-forget — never throws. */
export async function sendLocalWelcomeEmail(email: string, name: string, locale: "en" | "es"): Promise<void> {
  const resend = getResend()
  if (!resend) return
  const exploreUrl = siteUrl(`/${locale}`)
  const greet = name?.trim()
    ? locale === "es" ? `Hola ${name.trim()}, ` : `Hi ${name.trim()}, `
    : locale === "es" ? "Hola, " : "Hi there, "
  const content =
    locale === "es"
      ? {
          subject: "Bienvenido a Lompoc Locals — tu guía de lo que pasa en el pueblo",
          html: welcomeHtml({
            heading: "Bienvenido, vecino.",
            intro:
              greet + "¡ya eres parte! Lompoc Locals es tu guía de los negocios, ofertas y eventos que hacen que Lompoc y Vandenberg se sientan como en casa.",
            bulletsTitle: "Aquí puedes empezar:",
            bullets: [
              "Explora negocios locales y mira qué hay cerca en el mapa",
              "Aprovecha ofertas y cupones de lugares del pueblo",
              "❤️ Guarda tus ofertas favoritas con el corazón — tu propia lista en tu cuenta",
              "Descubre próximos eventos de la comunidad",
              `Recibe el <a href="${siteUrl("/es/subscribe")}" style="color:#650C75;font-weight:600;">resumen semanal</a> para no perderte nada nuevo`,
            ],
            ctaLabel: "Explorar Lompoc",
            ctaUrl: exploreUrl,
            closing:
              "Gracias por ser parte de la comunidad. Responde cuando quieras — lo lee un local de verdad.",
            signoff: "— El equipo de Lompoc Locals",
          }),
        }
      : {
          subject: "Welcome to Lompoc Locals — your guide to what's happening in town",
          html: welcomeHtml({
            heading: "Welcome, neighbor.",
            intro:
              greet + "you're in! Lompoc Locals is your guide to the businesses, deals, and events that make Lompoc and Vandenberg feel like home.",
            bulletsTitle: "Here's where to start:",
            bullets: [
              "Browse local businesses and see what's nearby on the map",
              "Grab deals and coupons from spots around town",
              "❤️ Tap the heart on any deal to save it to your own list",
              "Check out upcoming community events",
              `Get the <a href="${siteUrl("/subscribe")}" style="color:#650C75;font-weight:600;">weekly digest</a> so you never miss what's new`,
            ],
            ctaLabel: "Explore Lompoc",
            ctaUrl: exploreUrl,
            closing:
              "Thanks for being part of the community. Reply anytime — a real local reads it.",
            signoff: "— The Lompoc Locals team",
          }),
        }
  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject: content.subject, html: content.html })
  } catch (err) {
    console.error("[email] local welcome failed:", err)
  }
}

export async function sendConfirmationEmail(
  email: string,
  token: string,
  locale: "en" | "es"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set; skipping send")
    return { ok: false, error: "Email service not configured" }
  }

  const confirmUrl = siteUrl(`/subscribe/confirm?token=${token}`)

  const subject =
    locale === "es"
      ? "Confirma tu suscripción a Lompoc Locals"
      : "Confirm your Lompoc Locals subscription"

  // Highest-stakes email in the funnel — it gets the full brand shell.
  const html =
    locale === "es"
      ? welcomeHtml({
          heading: "Confirma tu suscripción",
          intro:
            "Un clic más y listo: confirma tu correo para empezar a recibir The Lompoc Locals, el resumen semanal de negocios, ofertas y eventos del pueblo, cada sábado por la mañana.",
          bulletsTitle: "",
          bullets: [],
          ctaLabel: "Confirmar suscripción",
          ctaUrl: confirmUrl,
          closing: `Si el botón no funciona, pega este enlace en tu navegador:<br><span style="word-break:break-all;color:#888;font-size:13px;">${confirmUrl}</span><br><br>¿No pediste esto? Ignora este correo y no volveremos a escribirte.`,
          signoff: "— El equipo de Lompoc Locals",
        })
      : welcomeHtml({
          heading: "Confirm your subscription",
          intro:
            "One click and you're in: confirm your email to start getting The Lompoc Locals — the Monday-morning weekly on the businesses, deals, and events happening in town.",
          bulletsTitle: "",
          bullets: [],
          ctaLabel: "Confirm subscription",
          ctaUrl: confirmUrl,
          closing: `If the button doesn't work, paste this link in your browser:<br><span style="word-break:break-all;color:#888;font-size:13px;">${confirmUrl}</span><br><br>Didn't ask for this? Ignore this email and we won't write again.`,
          signoff: "— The Lompoc Locals team",
        })

  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject, html })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  locale: "en" | "es"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set; skipping send")
    return { ok: false, error: "Email service not configured" }
  }

  const resetUrl = siteUrl(`/reset-password?token=${token}`)

  const subject =
    locale === "es"
      ? "Restablece tu contraseña de Lompoc Locals"
      : "Reset your Lompoc Locals password"

  const html =
    locale === "es"
      ? `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <h1 style="font-size: 22px; margin-bottom: 8px;">Restablece tu contraseña</h1>
          <p style="color: #555; line-height: 1.5;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en Lompoc Locals.
            Haz clic en el botón de abajo para elegir una nueva contraseña. Este enlace vence en 1 hora.
          </p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}"
               style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
              Restablecer contraseña
            </a>
          </p>
          <p style="color: #888; font-size: 13px;">
            Si no solicitaste este cambio, puedes ignorar este correo con tranquilidad.<br><br>
            O pega este enlace en tu navegador:<br>
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
      `
      : `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <h1 style="font-size: 22px; margin-bottom: 8px;">Reset your password</h1>
          <p style="color: #555; line-height: 1.5;">
            We received a request to reset the password for your Lompoc Locals account.
            Click the button below to choose a new password. This link expires in 1 hour.
          </p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}"
               style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
              Reset password
            </a>
          </p>
          <p style="color: #888; font-size: 13px;">
            If you didn't request a password reset, you can safely ignore this email.<br><br>
            Or paste this link in your browser:<br>
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
      `

  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject, html })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  role: "local" | "business",
  locale: "en" | "es"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set; skipping welcome email")
    return { ok: false, error: "Email service not configured" }
  }

  // Delegates to the branded, community-first per-role welcome emails above.
  if (role === "business") await sendBusinessWelcomeEmail(email, name, locale)
  else await sendLocalWelcomeEmail(email, name, locale)
  return { ok: true }
}

// ── Retargeting / lifecycle emails ──────────────────────────────────────────
// Keep the "reminder of our interest" going through the whole member lifecycle.
// All fire-and-forget — never throw into the caller (webhook / cron).
const greetName = (name?: string) => (name?.trim() ? `Hi ${name.trim()}, ` : "Hi there, ")

const GROWTH_KEEPS = [
  "Post specials &amp; coupons anytime — they hit the feed and our weekly community digest",
  "Featured placement in that weekly digest so more neighbors see you",
  "See how many locals view your page each week — real numbers",
  "Show up first in your category so neighbors find you first",
]

/** ~3 days before a Growth trial ends (Stripe trial_will_end). */
export async function sendTrialEndingEmail(email: string, name: string): Promise<void> {
  const resend = getResend()
  if (!resend) return
  const billingUrl = siteUrl(`/en/dashboard/billing`)
  const html = welcomeHtml({
    heading: "Your Growth trial ends soon.",
    intro:
      greetName(name) +
      "just a heads up — your 14-day Growth trial wraps up in about 3 days. Add a card and you'll roll right into Growth at $39.99/month with nothing interrupted. Nothing changes today.",
    bulletsTitle: "With Growth you keep:",
    bullets: GROWTH_KEEPS,
    ctaLabel: "Keep Growth — add your card",
    ctaUrl: billingUrl,
    closing:
      "Prefer to stop here? No problem — do nothing and your page simply stays on the free plan, still listed and findable. Reply anytime; a real person here in Lompoc reads it.",
    signoff: "— The Lompoc Locals team",
  })
  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject: "Your Growth trial ends in 3 days", html })
  } catch (err) {
    console.error("[email] trial-ending failed:", err)
  }
}

/** After a trial lapses without converting — win-back. */
export async function sendTrialEndedEmail(email: string, name: string): Promise<void> {
  const resend = getResend()
  if (!resend) return
  const billingUrl = siteUrl(`/en/dashboard/billing`)
  const html = welcomeHtml({
    heading: "Your trial wrapped up.",
    intro:
      greetName(name) +
      "your 14-day Growth trial has ended, so your page is back on the free plan. You're still listed and findable — but the tools that turn lookups into repeat customers are paused for now.",
    bulletsTitle: "Turn Growth back on anytime to:",
    bullets: GROWTH_KEEPS,
    ctaLabel: "Restart Growth",
    ctaUrl: billingUrl,
    closing:
      "No pressure at all — your free listing stays put either way. Whenever you're ready, we're right here. Reply anytime; a real person in Lompoc reads it.",
    signoff: "— The Lompoc Locals team",
  })
  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject: "Your Growth trial ended — here's what you're missing", html })
  } catch (err) {
    console.error("[email] trial-ended win-back failed:", err)
  }
}

/** A renewal charge failed — recover the card before the plan drops to free. */
export async function sendPaymentFailedEmail(email: string, name: string): Promise<void> {
  const resend = getResend()
  if (!resend) return
  const billingUrl = siteUrl(`/en/dashboard/billing`)
  const html = welcomeHtml({
    heading: "We couldn't process your payment.",
    intro:
      greetName(name) +
      "your latest Growth payment didn't go through — no worries, it happens. Your page stays on Growth for a short grace period, but to avoid dropping to the free plan, please update your card.",
    bulletsTitle: "",
    bullets: [],
    ctaLabel: "Update your card",
    ctaUrl: billingUrl,
    closing:
      "Once it's updated, everything continues seamlessly — no gap in your deals, digest spot, or stats. Questions? Reply anytime; a real person here in Lompoc reads it.",
    signoff: "— The Lompoc Locals team",
  })
  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject: "Action needed: update your card to keep Growth", html })
  } catch (err) {
    console.error("[email] payment-failed recovery failed:", err)
  }
}

/** Nudge a claimed business that's gone quiet (no deals, no activity). */
export async function sendReengagementEmail(email: string, name: string, businessName: string): Promise<void> {
  const resend = getResend()
  if (!resend) return
  const dashUrl = siteUrl(`/en/dashboard`)
  const who = businessName?.trim() || "your"
  const html = welcomeHtml({
    heading: "Your page misses you.",
    intro:
      greetName(name) +
      `${who} is live on Lompoc Locals and neighbors are still finding it — but it's been quiet lately. The spots that get the most out of the platform post a little something regularly, and it only takes a minute.`,
    bulletsTitle: "Easy wins that work for local spots:",
    bullets: [
      "A first-visit offer for new neighbors",
      "A weekly special (Taco Tuesday, happy hour, you name it)",
      "Fresh photos or a quick bit of news",
    ],
    ctaLabel: "Update your page",
    ctaUrl: dashUrl,
    closing:
      "We're rooting for you — reply anytime, a real person here in Lompoc reads it.",
    signoff: "— The Lompoc Locals team",
  })
  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject: "Your Lompoc Locals page is quiet — here's an easy win", html })
  } catch (err) {
    console.error("[email] re-engagement failed:", err)
  }
}

export async function sendDealUpdateEmail(
  email: string,
  deal: DealNotificationData,
  unsubscribeToken: string,
  locale: "en" | "es"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) return { ok: false, error: "Email service not configured" }

  const dealUrl = siteUrl(`/en/biz/${deal.businessSlug}`)
  const unsubUrl = siteUrl(`/api/notifications/unsubscribe?token=${unsubscribeToken}`)

  const subject =
    locale === "es"
      ? `Actualización: ${deal.title} — ${deal.businessName}`
      : `Updated: ${deal.title} — ${deal.businessName}`

  const html =
    locale === "es"
      ? `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 12px;">
            Una oferta que guardaste fue actualizada
          </p>
          <h1 style="font-size: 22px; margin: 0 0 4px;">${deal.title}</h1>
          <p style="font-size: 14px; color: #888; margin: 0 0 12px;">${deal.businessName}${deal.discountText ? " · " + deal.discountText : ""}</p>
          ${deal.description ? `<p style="color: #555; line-height: 1.5; font-size: 14px;">${deal.description}</p>` : ""}
          <p style="margin: 24px 0;">
            <a href="${dealUrl}"
               style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
              Ver oferta
            </a>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 32px;">
            Recibes esto porque guardaste esta oferta.
            <a href="${unsubUrl}" style="color: #888;">Desactivar notificaciones de ofertas</a>
            · <a href="${siteUrl("/es")}" style="color: #888;">Visitar el sitio</a>
          </p>
        </div>
      `
      : `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 12px;">
            A deal you saved was updated
          </p>
          <h1 style="font-size: 22px; margin: 0 0 4px;">${deal.title}</h1>
          <p style="font-size: 14px; color: #888; margin: 0 0 12px;">${deal.businessName}${deal.discountText ? " · " + deal.discountText : ""}</p>
          ${deal.description ? `<p style="color: #555; line-height: 1.5; font-size: 14px;">${deal.description}</p>` : ""}
          <p style="margin: 24px 0;">
            <a href="${dealUrl}"
               style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
              View deal
            </a>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 32px;">
            You're getting this because you saved this deal.
            <a href="${unsubUrl}" style="color: #888;">Turn off deal notifications</a>
            · <a href="${siteUrl("/en")}" style="color: #888;">Visit site</a>
          </p>
        </div>
      `

  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject, html })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

export async function sendNewDealFromFollowedBusinessEmail(
  email: string,
  deal: DealNotificationData,
  unsubscribeToken: string,
  locale: "en" | "es"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) return { ok: false, error: "Email service not configured" }

  const bizUrl = siteUrl(`/en/biz/${deal.businessSlug}`)
  const unsubUrl = siteUrl(`/api/notifications/unsubscribe?token=${unsubscribeToken}`)

  const subject =
    locale === "es"
      ? `Nueva oferta de ${deal.businessName}: ${deal.title}`
      : `New deal from ${deal.businessName}: ${deal.title}`

  const html =
    locale === "es"
      ? `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 12px;">
            Nueva oferta de un negocio que sigues
          </p>
          <h1 style="font-size: 22px; margin: 0 0 4px;">${deal.title}</h1>
          <p style="font-size: 14px; color: #888; margin: 0 0 12px;">${deal.businessName}${deal.discountText ? " · " + deal.discountText : ""}</p>
          ${deal.description ? `<p style="color: #555; line-height: 1.5; font-size: 14px;">${deal.description}</p>` : ""}
          <p style="margin: 24px 0;">
            <a href="${bizUrl}"
               style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
              Ver todas las ofertas de ${deal.businessName}
            </a>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 32px;">
            Recibes esto porque sigues a ${deal.businessName}.
            <a href="${unsubUrl}" style="color: #888;">Desactivar notificaciones de ofertas</a>
            · <a href="${siteUrl("/es")}" style="color: #888;">Visitar el sitio</a>
          </p>
        </div>
      `
      : `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 12px;">
            New deal from a business you follow
          </p>
          <h1 style="font-size: 22px; margin: 0 0 4px;">${deal.title}</h1>
          <p style="font-size: 14px; color: #888; margin: 0 0 12px;">${deal.businessName}${deal.discountText ? " · " + deal.discountText : ""}</p>
          ${deal.description ? `<p style="color: #555; line-height: 1.5; font-size: 14px;">${deal.description}</p>` : ""}
          <p style="margin: 24px 0;">
            <a href="${bizUrl}"
               style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
              See all deals from ${deal.businessName}
            </a>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 32px;">
            You're getting this because you follow ${deal.businessName}.
            <a href="${unsubUrl}" style="color: #888;">Turn off deal notifications</a>
            · <a href="${siteUrl("/en")}" style="color: #888;">Visit site</a>
          </p>
        </div>
      `

  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject, html })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function sendFeedApprovalEmail(
  toEmail: string,
  postTitle: string,
  locale: "en" | "es"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set; skipping send")
    return { ok: false, error: "Email service not configured" }
  }

  const feedUrl = siteUrl("/en/feed")

  const subject =
    locale === "es"
      ? `Tu publicación "${postTitle}" está en vivo en Lompoc Locals`
      : `Your post "${postTitle}" is live on Lompoc Locals`

  const html =
    locale === "es"
      ? `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <p>¡Buenas noticias — un administrador aprobó tu publicación <strong>"${escapeHtml(postTitle)}"</strong> y ya está en vivo en Lompoc Locals!</p>
          <p style="margin: 24px 0;">
            <a href="${feedUrl}"
               style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
              Ver el feed →
            </a>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 32px;">Si no publicaste esto, responde a este correo — lo eliminaremos.</p>
        </div>
      `
      : `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <p>Good news — an admin approved your post <strong>"${escapeHtml(postTitle)}"</strong> and it's now live on the Lompoc Locals feed.</p>
          <p style="margin: 24px 0;">
            <a href="${feedUrl}"
               style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
              View the feed →
            </a>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 32px;">If you didn't post this, please reply to this email — we'll remove it.</p>
        </div>
      `

  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: toEmail, subject, html })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

export async function sendFeedRejectionEmail(
  toEmail: string,
  postTitle: string,
  reason: string,
  locale: "en" | "es"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set; skipping send")
    return { ok: false, error: "Email service not configured" }
  }

  const postUrl = siteUrl("/en/feed/post")

  const subject =
    locale === "es"
      ? `Tu publicación "${postTitle}" no fue aprobada`
      : `Your post "${postTitle}" wasn't approved`

  const html =
    locale === "es"
      ? `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <p>Hola — tu publicación <strong>"${escapeHtml(postTitle)}"</strong> no fue aprobada por nuestro equipo.</p>
          <p><strong>Motivo:</strong> ${escapeHtml(reason)}</p>
          <p>Puedes revisarla y volver a enviarla en <a href="${postUrl}">${postUrl}</a>.</p>
        </div>
      `
      : `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <p>Hi — your post <strong>"${escapeHtml(postTitle)}"</strong> wasn't approved by our admin.</p>
          <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
          <p>You're welcome to revise it and submit again at <a href="${postUrl}">${postUrl}</a>.</p>
        </div>
      `

  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: toEmail, subject, html })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

export async function sendDigestEmail(
  email: string,
  unsubscribeToken: string,
  deals: DealCardData[],
  locale: "en" | "es",
  upcomingEvents: DigestEvent[] = []
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    return { ok: false, error: "Email service not configured" }
  }

  const unsubUrl = siteUrl(`/subscribe/unsubscribe?token=${unsubscribeToken}`)

  const eventDate = (d: Date) =>
    d.toLocaleDateString(locale === "es" ? "es-US" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "America/Los_Angeles",
    })

  const eventsHtml = upcomingEvents.length
    ? `
      <h2 style="font-size: 17px; margin: 28px 0 4px;">
        ${locale === "es" ? "📅 Esta semana en Lompoc" : "📅 Happening this week"}
      </h2>
      ${upcomingEvents
        .map(
          (ev) => `
        <div style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <span style="color: #650C75; font-weight: 600; font-size: 13px;">
            ${eventDate(ev.startsAt)}
          </span>
          <a href="${siteUrl(`/events/${ev.id}`)}"
             style="color: #111; text-decoration: none; font-size: 15px; font-weight: 600; display: block;">
            ${ev.title}
          </a>
          ${ev.location ? `<span style="color: #888; font-size: 13px;">${ev.location}</span>` : ""}
        </div>
      `
        )
        .join("")}
    `
    : ""

  const dealsHtml = deals
    .map(
      (d) => `
      <div style="border-bottom: 1px solid #eee; padding: 16px 0;">
        <div style="font-size: 12px; color: #888; text-transform: uppercase;">
          ${d.business.name}${d.discountText ? " · " + d.discountText : ""}
        </div>
        <div style="font-size: 16px; font-weight: 600; margin: 4px 0;">
          <a href="${siteUrl(`/biz/${d.business.slug}`)}"
             style="color: #111; text-decoration: none;">
            ${d.title}
          </a>
        </div>
        <div style="color: #555; font-size: 14px; line-height: 1.4;">
          ${d.description ?? ""}
        </div>
      </div>
    `
    )
    .join("")

  const subject =
    locale === "es"
      ? `Lompoc Locals — ${deals.length} nuevas esta semana`
      : `Lompoc Locals — ${deals.length} new this week`

  const html =
    locale === "es"
      ? `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <h1 style="font-size: 22px; margin-bottom: 4px;">Esta semana en Lompoc</h1>
          <p style="color: #555; margin: 0 0 12px;">
            Las ${deals.length} mejores ofertas de negocios locales.
          </p>
          ${dealsHtml}
          ${eventsHtml}
          <p style="margin-top: 32px; color: #888; font-size: 12px;">
            <a href="${unsubUrl}" style="color: #888;">Cancelar suscripción</a>
            · <a href="${siteUrl()}" style="color: #888;">Visitar el sitio</a>
          </p>
        </div>
      `
      : `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <h1 style="font-size: 22px; margin-bottom: 4px;">This week in Lompoc</h1>
          <p style="color: #555; margin: 0 0 12px;">
            Top ${deals.length} deals from local businesses.
          </p>
          ${dealsHtml}
          ${eventsHtml}
          <p style="margin-top: 32px; color: #888; font-size: 12px;">
            <a href="${unsubUrl}" style="color: #888;">Unsubscribe</a>
            · <a href="${siteUrl()}" style="color: #888;">Visit site</a>
          </p>
        </div>
      `

  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject, html })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

// ─── Themed weekly digest (events / deals / things-to-do / partners) ──────

type ThemeCopy = { subject: string; title: string; intro: string; cta: string; ctaPath: string }
const THEME_COPY: Record<ThemedDigestContent["theme"], { en: ThemeCopy; es: ThemeCopy }> = {
  events: {
    en: { subject: "📅 What's happening in Lompoc", title: "📅 This month in Lompoc", intro: "Here's what's coming up around town — plan ahead.", cta: "See the full calendar", ctaPath: "/events" },
    es: { subject: "📅 Qué pasa en Lompoc", title: "📅 Este mes en Lompoc", intro: "Esto es lo que viene en la ciudad — planea con tiempo.", cta: "Ver el calendario completo", ctaPath: "/events" },
  },
  deals: {
    en: { subject: "🎟️ This week's best local deals", title: "🎟️ Deals of the week", intro: "Save a little this week, close to home.", cta: "Browse all deals", ctaPath: "/feed?type=deal" },
    es: { subject: "🎟️ Las mejores ofertas de la semana", title: "🎟️ Ofertas de la semana", intro: "Ahorra esta semana, cerquita de casa.", cta: "Ver todas las ofertas", ctaPath: "/feed?type=deal" },
  },
  thingsToDo: {
    en: { subject: "🌟 Things to do in Lompoc this week", title: "🌟 Things to do in Lompoc", intro: "Looking for something to do? Here's the good stuff.", cta: "Explore things to do", ctaPath: "/activities" },
    es: { subject: "🌟 Qué hacer en Lompoc esta semana", title: "🌟 Qué hacer en Lompoc", intro: "¿Buscas algo que hacer? Aquí está lo bueno.", cta: "Explorar qué hacer", ctaPath: "/activities" },
  },
  partners: {
    en: { subject: "🤝 Meet a few of your Lompoc neighbors", title: "🤝 Featured locals", intro: "A few local businesses worth knowing.", cta: "Meet all our featured members", ctaPath: "/" },
    es: { subject: "🤝 Conoce a tus vecinos de Lompoc", title: "🤝 Negocios destacados", intro: "Algunos negocios locales que vale la pena conocer.", cta: "Conoce a todos los destacados", ctaPath: "/" },
  },
}

function eventDateLabel(d: Date, locale: "en" | "es") {
  return d.toLocaleDateString(locale === "es" ? "es-US" : "en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "America/Los_Angeles",
  })
}

function themedSectionHtml(c: ThemedDigestContent, locale: "en" | "es"): string {
  const row = (inner: string) => `<div style="border-bottom:1px solid #eee;padding:14px 0;">${inner}</div>`
  const imgCard = (href: string, img: string | null, title: string, sub: string) => `
    <a href="${siteUrl(href)}" style="display:block;text-decoration:none;color:#111;border:1px solid #eee;border-radius:14px;overflow:hidden;margin-bottom:12px;">
      ${img ? `<img src="${img}" alt="" width="100%" style="display:block;width:100%;height:170px;object-fit:cover;" />` : ""}
      <div style="padding:12px 14px;">
        <div style="font-size:16px;font-weight:700;">${title}</div>
        ${sub ? `<div style="font-size:13px;color:#650C75;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-top:2px;">${sub}</div>` : ""}
      </div>
    </a>`

  if (c.theme === "events") {
    return c.events.map((e) => row(`
      <span style="color:#650C75;font-weight:700;font-size:13px;">${eventDateLabel(e.startsAt, locale)}</span>
      <a href="${siteUrl(`/events/${e.id}`)}" style="display:block;font-size:16px;font-weight:600;color:#111;text-decoration:none;">${e.title}</a>
      ${e.location ? `<span style="font-size:13px;color:#888;">${e.location}</span>` : ""}`)).join("")
  }
  if (c.theme === "deals") {
    return c.deals.map((d) => row(`
      <div style="font-size:12px;color:#888;text-transform:uppercase;">${d.business.name}${d.discountText ? " · " + d.discountText : ""}</div>
      <a href="${siteUrl(`/biz/${d.business.slug}`)}" style="font-size:16px;font-weight:600;color:#111;text-decoration:none;">${d.title}</a>
      ${d.description ? `<div style="font-size:14px;color:#555;line-height:1.4;">${d.description}</div>` : ""}`)).join("")
  }
  if (c.theme === "thingsToDo") {
    return c.things.map((t) => imgCard(t.href, t.imageUrl, t.title, t.subtitle ?? "")).join("")
  }
  // partners
  return c.partners.map((p) => imgCard(
    `/biz/${p.slug}`, p.coverUrl, p.name,
    `${locale === "es" ? "Socio Oficial" : "Official Partner"}${p.discountText ? " · " + p.discountText : p.categoryName ? " · " + p.categoryName : ""}`
  )).join("")
}

/**
 * Send one themed weekly digest (events / deals / things-to-do / partners).
 * Branded shell + the active theme's content; bilingual by subscriber locale.
 */
export async function sendThemedDigestEmail(
  email: string,
  unsubscribeToken: string,
  content: ThemedDigestContent,
  locale: "en" | "es"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) return { ok: false, error: "Email service not configured" }

  const copy = THEME_COPY[content.theme][locale]
  const unsubUrl = siteUrl(`/subscribe/unsubscribe?token=${unsubscribeToken}`)
  const section = themedSectionHtml(content, locale)

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <div style="background:#650C75;padding:22px 24px;border-radius:0 0 4px 4px;">
        <div style="color:#EFC618;font-weight:800;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">Lompoc Locals</div>
        <div style="color:#ffffff;font-size:22px;font-weight:800;margin-top:2px;">${copy.title}</div>
      </div>
      <div style="padding:20px 24px;">
        <p style="color:#555;margin:0 0 16px;font-size:15px;">${copy.intro}</p>
        ${section}
        <p style="margin:22px 0 0;text-align:center;">
          <a href="${siteUrl(copy.ctaPath)}" style="display:inline-block;background:#650C75;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">${copy.cta} →</a>
        </p>
        <p style="margin-top:28px;color:#aaa;font-size:12px;text-align:center;">
          ${locale === "es" ? "Recibes esto porque te suscribiste a Lompoc Locals." : "You're getting this because you subscribe to Lompoc Locals."}<br>
          <a href="${unsubUrl}" style="color:#aaa;">${locale === "es" ? "Cancelar suscripción" : "Unsubscribe"}</a> ·
          <a href="${siteUrl()}" style="color:#aaa;">${locale === "es" ? "Visitar el sitio" : "Visit site"}</a>
        </p>
      </div>
    </div>`

  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject: copy.subject, html })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

// ─── Master magazine digest (all four sections, image-rich) ──────────────

/** Make a relative image path absolute so email clients can load it. */
function absImg(u: string | null | undefined): string | null {
  if (!u) return null
  return u.startsWith("/") ? siteUrl(u) : u
}

/** Newspaper section kicker: rule — LABEL — rule. */
function npKicker(label: string): string {
  return `<div style="border-bottom:1px solid #650C75;margin:20px 0 8px;padding-bottom:4px;">
    <span style="color:#650C75;font-size:12px;font-weight:bold;letter-spacing:0.22em;text-transform:uppercase;">${label}</span>
  </div>`
}

/** Render the weekly digest as a dense newspaper front page. Pure — no network. */
export function renderMasterDigestHtml(
  c: MasterDigestContent,
  locale: "en" | "es",
  opts: { unsubUrl: string; now: Date }
): string {
  const es = locale === "es"
  const dateLabel = (d: Date) =>
    d.toLocaleDateString(es ? "es-US" : "en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Los_Angeles" })
  const shortDate = (d: Date) =>
    d.toLocaleDateString(es ? "es-US" : "en-US", { weekday: "short", day: "numeric", timeZone: "America/Los_Angeles" })
  // week-of-year -> cosmetic edition number
  const start = Date.UTC(opts.now.getUTCFullYear(), 0, 1)
  const weekNo = Math.ceil(((opts.now.getTime() - start) / 86400000 + 1) / 7)
  const fullDate = opts.now.toLocaleDateString(es ? "es-US" : "en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" })

  const lead = selectLead(c)
  // section lists with the lead item removed to avoid duplication
  const events = lead?.kind === "event" ? c.events.slice(1) : c.events
  const deals = lead?.kind === "deal" ? c.deals.slice(1) : c.deals

  // ── Lead story ──
  let leadHtml = ""
  if (lead?.kind === "event") {
    const e = lead.event
    const img = absImg(e.imageUrl)
    leadHtml = `
    <table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;border-bottom:2px solid #1a1712;"><tr>
      <td width="58%" style="vertical-align:top;padding:0 12px 14px 0;">
        <div style="color:#650C75;font-size:10px;font-weight:bold;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:3px;">${es ? "Nota principal" : "Lead Story"}</div>
        <a href="${siteUrl(`/events/${e.id}`)}" style="display:block;font-size:25px;line-height:1.1;color:#1a1712;font-weight:bold;text-decoration:none;font-family:Georgia,serif;margin-bottom:5px;">${escapeHtml(e.title)}</a>
        <div style="font-size:12px;color:#7a6f60;font-style:italic;">${dateLabel(e.startsAt)}${e.location ? " · " + escapeHtml(e.location) : ""}</div>
      </td>
      ${img ? `<td width="42%" style="vertical-align:top;padding-bottom:14px;"><img src="${img}" alt="" width="100%" style="display:block;width:100%;height:150px;object-fit:cover;border:1px solid #d8cfc0;" /></td>` : ""}
    </tr></table>`
  } else if (lead?.kind === "deal") {
    const d = lead.deal
    const img = absImg(d.imageUrl ?? d.business.coverUrl)
    leadHtml = `
    <table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;border-bottom:2px solid #1a1712;"><tr>
      <td width="58%" style="vertical-align:top;padding:0 12px 14px 0;">
        <div style="color:#650C75;font-size:10px;font-weight:bold;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:3px;">${es ? "Oferta principal" : "Lead Story"}</div>
        ${d.discountText ? `<span style="display:inline-block;background:#EFC618;color:#3a2600;font-weight:bold;font-size:11px;padding:2px 8px;letter-spacing:0.03em;text-transform:uppercase;margin-bottom:5px;">${escapeHtml(d.discountText)}</span>` : ""}
        <a href="${siteUrl(`/biz/${d.business.slug}`)}" style="display:block;font-size:23px;line-height:1.12;color:#1a1712;font-weight:bold;text-decoration:none;font-family:Georgia,serif;margin-bottom:5px;">${escapeHtml(d.title)}</a>
        <div style="font-size:12px;color:#7a6f60;font-style:italic;">${escapeHtml(d.business.name)}</div>
      </td>
      ${img ? `<td width="42%" style="vertical-align:top;padding-bottom:14px;"><img src="${img}" alt="" width="100%" style="display:block;width:100%;height:150px;object-fit:cover;border:1px solid #d8cfc0;" /></td>` : ""}
    </tr></table>`
  }

  // ── The week's news ──
  // The section that makes this the town's front page: real local stories from
  // /news, top story with art, the rest as headline rows.
  let newsHtml = ""
  if (c.news.length) {
    const [top, ...rest] = c.news
    const topImg = absImg(top.imageUrl)
    newsHtml =
      npKicker(es ? "📰 Noticias locales" : "📰 The Local News") +
      `<table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;"><tr>
        ${topImg ? `<td width="42%" style="vertical-align:top;padding:6px 12px 10px 0;"><img src="${topImg}" alt="" width="100%" style="display:block;width:100%;height:130px;object-fit:cover;border:1px solid #d8cfc0;" /></td>` : ""}
        <td style="vertical-align:top;padding:6px 0 10px;">
          <a href="${siteUrl(`/blog/${top.slug}`)}" style="display:block;font-size:19px;line-height:1.15;color:#1a1712;font-weight:bold;text-decoration:none;font-family:Georgia,serif;margin-bottom:4px;">${escapeHtml(top.title)}</a>
          ${top.excerpt ? `<div style="font-size:13px;color:#4a4238;line-height:1.5;">${escapeHtml(top.excerpt)}</div>` : ""}
        </td>
      </tr></table>` +
      (rest.length
        ? `<table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;">` +
          rest
            .slice(0, 3)
            .map(
              (n, i, arr) => `
      <tr><td style="vertical-align:top;padding:7px 0;${i < arr.length - 1 ? "border-bottom:1px solid #e3dbcd;" : ""}">
        <a href="${siteUrl(`/blog/${n.slug}`)}" style="font-size:15px;font-weight:bold;color:#1a1712;text-decoration:none;">${escapeHtml(n.title)}</a>
        ${n.excerpt ? `<div style="font-size:12px;color:#7a6f60;line-height:1.45;margin-top:1px;">${escapeHtml(n.excerpt)}</div>` : ""}
      </td></tr>`
            )
            .join("") +
          `</table>`
        : "") +
      `<div style="text-align:right;margin:4px 0 2px;"><a href="${siteUrl("/news")}" style="font-size:12px;color:#650C75;font-weight:bold;text-decoration:none;">${es ? "Todas las noticias" : "All the local news"} →</a></div>`
  }

  // ── Events ──
  const eventsHtml = events.length ? npKicker(es ? "📅 El calendario de la semana" : "📅 This Week's Calendar") +
    `<table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;">` +
    events.slice(0, 5).map((e, i, arr) => `
      <tr>
        <td width="16%" style="vertical-align:top;padding:7px 8px 7px 0;color:#650C75;font-size:11px;font-weight:bold;text-transform:uppercase;white-space:nowrap;${i < arr.length - 1 ? "border-bottom:1px solid #e3dbcd;" : ""}">${shortDate(e.startsAt)}</td>
        <td style="vertical-align:top;padding:7px 0;${i < arr.length - 1 ? "border-bottom:1px solid #e3dbcd;" : ""}">
          <a href="${siteUrl(`/events/${e.id}`)}" style="font-size:15px;font-weight:bold;color:#1a1712;text-decoration:none;">${escapeHtml(e.title)}</a>${e.location ? `<span style="font-size:12px;color:#7a6f60;font-style:italic;"> — ${escapeHtml(e.location)}</span>` : ""}
        </td>
      </tr>`).join("") + `</table>` : ""

  // ── Deals ──
  const dealsHtml = deals.length ? npKicker(es ? "🎟️ Ofertas de la semana" : "🎟️ Deals of the Week") +
    `<table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;">` +
    deals.slice(0, 4).map((d, i, arr) => `
      <tr><td style="vertical-align:top;padding:8px 0;${i < arr.length - 1 ? "border-bottom:1px solid #e3dbcd;" : ""}">
        ${d.discountText ? `<span style="display:inline-block;background:#EFC618;color:#3a2600;font-weight:bold;font-size:10px;padding:2px 7px;letter-spacing:0.03em;text-transform:uppercase;">${escapeHtml(d.discountText)}</span> ` : ""}<a href="${siteUrl(`/biz/${d.business.slug}`)}" style="font-size:15px;font-weight:bold;color:#1a1712;text-decoration:none;">${escapeHtml(d.title)}</a>
        <div style="font-size:12px;color:#7a6f60;">${escapeHtml(d.business.name)}</div>
      </td></tr>`).join("") + `</table>` : ""

  // ── Where to eat ──
  // The most-asked question in any town, and the category with the deepest content: 103 approved
  // restaurants, every one of them with a photo. Rotates weekly (see digestWeekIndex).
  const restaurantsHtml = c.restaurants.length ? npKicker(es ? "🍽️ Dónde comer" : "🍽️ Where to Eat") +
    `<table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;">` +
    c.restaurants.slice(0, 3).map((r, i, arr) => `
      <tr><td style="vertical-align:top;padding:8px 0;${i < arr.length - 1 ? "border-bottom:1px solid #e3dbcd;" : ""}">
        <a href="${siteUrl(`/biz/${r.slug}`)}" style="font-size:15px;font-weight:bold;color:#1a1712;text-decoration:none;">${escapeHtml(r.name)}</a>${r.address ? `<span style="font-size:12px;color:#7a6f60;font-style:italic;"> — ${escapeHtml(String(r.address).split(",")[0])}</span>` : ""}
        ${r.blurb ? `<div style="font-size:13px;color:#4a4238;line-height:1.5;margin-top:2px;">${escapeHtml(r.blurb)}</div>` : ""}
      </td></tr>`).join("") + `</table>` : ""

  // ── One business, told properly ──
  // The email's equivalent of the "On the record" post: a single listing whose about text we
  // actually wrote, so the feature has something true to say rather than a restated category.
  const featureHtml = c.feature ? npKicker(es ? "📍 En el registro" : "📍 On the Record") + `
    <table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;"><tr>
      ${c.feature.coverUrl ? `<td width="88" style="vertical-align:top;padding:6px 12px 6px 0;"><img src="${c.feature.coverUrl}" width="88" height="88" alt="" style="display:block;width:88px;height:88px;object-fit:cover;border:1px solid #d8cfc0;"></td>` : ""}
      <td style="vertical-align:top;padding:6px 0;">
        <a href="${siteUrl(`/biz/${c.feature.slug}`)}" style="font-size:16px;font-weight:bold;color:#1a1712;text-decoration:none;">${escapeHtml(c.feature.name)}</a>${c.feature.categoryName ? `<span style="font-size:11px;color:#7a6f60;"> · ${escapeHtml(c.feature.categoryName)}</span>` : ""}
        ${c.feature.blurb ? `<div style="font-size:13px;color:#4a4238;line-height:1.55;margin-top:3px;">${escapeHtml(c.feature.blurb)}</div>` : ""}
      </td>
    </tr></table>` : ""

  // ── Somewhere to go ──
  // Parks, beaches and trails, read from `activities` — every row there carries an image, tips and
  // seasonality, and reading only from that table avoids the handful that also exist as thin
  // business rows (Beattie Park, La Purisima Golf Course) showing up twice.
  const outdoorsHtml = c.outdoors.length ? npKicker(es ? "🌲 Vale la pena ir" : "🌲 Worth the Trip") +
    `<table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;">` +
    c.outdoors.map((o, i, arr) => `
      <tr><td style="vertical-align:top;padding:8px 0;${i < arr.length - 1 ? "border-bottom:1px solid #e3dbcd;" : ""}">
        <a href="${siteUrl(o.href)}" style="font-size:15px;font-weight:bold;color:#1a1712;text-decoration:none;">${escapeHtml(o.title)}</a>
        ${o.subtitle ? `<div style="font-size:13px;color:#4a4238;line-height:1.5;margin-top:2px;">${escapeHtml(o.subtitle)}</div>` : ""}
      </td></tr>`).join("") + `</table>` : ""

  // ── Around Town + Neighbors (two columns) ──
  const thingsCol = c.things.length ? `
    <div style="border-bottom:1px solid #650C75;margin-bottom:8px;padding-bottom:4px;"><span style="color:#650C75;font-size:11px;font-weight:bold;letter-spacing:0.16em;text-transform:uppercase;">🌟 ${es ? "Qué hacer" : "Around Town"}</span></div>
    ${c.things.slice(0, 4).map((t, i, arr) => `<a href="${siteUrl(t.href)}" style="display:block;font-size:14px;font-weight:bold;color:#1a1712;text-decoration:none;padding:5px 0;${i < arr.length - 1 ? "border-bottom:1px solid #e3dbcd;" : ""}">${escapeHtml(t.title)}</a>`).join("")}` : ""
  const partnersCol = c.partners.length ? `
    <div style="border-bottom:1px solid #650C75;margin-bottom:8px;padding-bottom:4px;"><span style="color:#650C75;font-size:11px;font-weight:bold;letter-spacing:0.16em;text-transform:uppercase;">🤝 ${es ? "Vecinos" : "Neighbors"}</span></div>
    ${c.partners.slice(0, 4).map((p, i, arr) => `<a href="${siteUrl(`/biz/${p.slug}`)}" style="display:block;padding:5px 0;text-decoration:none;${i < arr.length - 1 ? "border-bottom:1px solid #e3dbcd;" : ""}"><span style="font-size:14px;font-weight:bold;color:#1a1712;">${escapeHtml(p.name)}</span>${p.categoryName ? `<span style="font-size:11px;color:#7a6f60;"> · ${escapeHtml(p.categoryName)}</span>` : ""}</a>`).join("")}` : ""
  const twoColHtml =
    thingsCol && partnersCol
      ? `
    <table role="presentation" width="100%" style="border-collapse:separate;border-spacing:0;margin-top:20px;"><tr>
      <td width="50%" style="vertical-align:top;padding-right:12px;border-right:1px solid #d8cfc0;">${thingsCol}</td>
      <td width="50%" style="vertical-align:top;padding-left:12px;">${partnersCol}</td>
    </tr></table>`
      : thingsCol || partnersCol
        ? `<div style="margin-top:20px;">${thingsCol || partnersCol}</div>`
        : ""

  return `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:620px;margin:0 auto;background:#f7f3ec;">
      <div style="background:#650C75;padding:16px 22px 12px;text-align:center;">
        <div style="color:#ffffff;font-size:32px;font-weight:bold;margin:0;font-family:Georgia,'Times New Roman',serif;line-height:1;">The Lompoc Locals</div>
        <div style="height:2px;background:#EFC618;width:92%;margin:9px auto 7px;"></div>
        <div style="color:rgba(255,255,255,0.82);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;">${fullDate} &nbsp;·&nbsp; Vol. I, No. ${weekNo} &nbsp;·&nbsp; lompoclocals.com</div>
      </div>
      <div style="padding:18px 24px 22px;">
        ${leadHtml}${newsHtml}${eventsHtml}${restaurantsHtml}${featureHtml}${outdoorsHtml}${dealsHtml}${twoColHtml}
        <div style="text-align:center;margin:24px 0 2px;">
          <a href="${siteUrl("/this-week")}" style="display:inline-block;background:#650C75;color:#ffffff;padding:11px 26px;text-decoration:none;font-weight:bold;font-size:14px;font-family:Georgia,serif;">${es ? "Leer la edición completa" : "Read the full edition online"} →</a>
        </div>
      </div>
      <div style="background:#efe9df;border-top:2px solid #650C75;padding:14px 22px;text-align:center;">
        <p style="color:#8a8175;font-size:11px;line-height:1.6;margin:0;">
          ${es ? "Estás suscrito a Lompoc Locals" : "You subscribe to Lompoc Locals"} · <a href="${opts.unsubUrl}" style="color:#8a8175;">${es ? "Cancelar" : "Unsubscribe"}</a> · <a href="${siteUrl()}" style="color:#8a8175;">lompoclocals.com</a>
        </p>
      </div>
    </div>`
}

/**
 * Send the magazine-style master digest — all four sections (events, deals,
 * things to do, featured partners) in one image-rich email. Bilingual.
 */
export async function sendMasterDigestEmail(
  email: string,
  unsubscribeToken: string,
  c: MasterDigestContent,
  locale: "en" | "es"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) return { ok: false, error: "Email service not configured" }

  const es = locale === "es"
  const unsubUrl = siteUrl(`/subscribe/unsubscribe?token=${unsubscribeToken}`)
  const html = renderMasterDigestHtml(c, locale, { unsubUrl, now: new Date() })
  const subject = es
    ? "📬 The Lompoc Locals — tu edición semanal"
    : "📬 The Lompoc Locals — your weekly front page"

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject,
      html,
      headers: oneClickUnsubHeaders(email),
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

/**
 * The launch alert.
 *
 * Deliberately plain and short. Somebody opening this wants three facts — what, when, where to
 * stand — and nothing else. No deals, no cross-sell, no "while you're here": the moment this
 * email starts selling, it stops being worth subscribing to, and the whole value of the list is
 * that people trust it enough to keep it.
 *
 * The caution about times slipping is not filler. Vandenberg launches move constantly, and
 * telling somebody to check before standing outside in the cold is the difference between a
 * useful alert and one that wastes their evening.
 */
export async function sendLaunchAlertEmail(
  email: string,
  unsubscribeToken: string,
  launch: { title: string; startsAt: Date; location: string | null },
  phrases: { when: string; timeLabel: string },
  locale: "en" | "es"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) return { ok: false, error: "Email service not configured" }

  const es = locale === "es"
  const unsubUrl = siteUrl(`/subscribe/unsubscribe?token=${unsubscribeToken}`)
  const name = escapeHtml(launch.title.replace(/^Rocket Launch:\s*/i, "").trim())

  const subject = es
    ? `🚀 Algo despega ${phrases.when} sobre el valle`
    : `🚀 Something goes up over the valley ${phrases.when}`

  const html = `<!doctype html><html><body style="margin:0;background:#f6f4f0;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#241629;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:4px;overflow:hidden;">
  <tr><td style="background:#241629;padding:26px 28px 22px;">
    <div style="color:#EFC618;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">
      ${es ? "Aviso de lanzamiento" : "Launch alert"}
    </div>
    <div style="color:#ffffff;font-size:24px;font-weight:800;line-height:1.2;margin-top:8px;">
      ${es ? "Algo despega" : "Something goes up"} ${escapeHtml(phrases.when)}.
    </div>
  </td></tr>
  <tr><td style="padding:26px 28px 8px;">
    <p style="margin:0 0 4px;font-size:17px;font-weight:700;">${name}</p>
    <p style="margin:0 0 18px;font-size:15px;color:#6C6070;">${escapeHtml(phrases.timeLabel)} · Vandenberg Space Force Base</p>

    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      ${es
        ? "No hace falta ir a ningún lado — mirando al suroeste desde tu propia entrada suele bastar. Si quieres la vista amplia, Harris Grade Rd o Ocean Ave hacia el oeste."
        : "You don't need to drive anywhere — southwest from your own driveway usually does it. If you want the wide view, Harris Grade Rd or Ocean Ave heading west."}
    </p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
      ${es
        ? "Los horarios cambian a menudo. Comprueba antes de salir:"
        : "Times move often. Check before you stand outside:"}
      <a href="${siteUrl("/events")}" style="color:#650C75;font-weight:700;">lompoclocals.com/events</a>
    </p>
  </td></tr>
  <tr><td style="padding:16px 28px 24px;border-top:1px solid #efe7dc;text-align:center;">
    <div style="font-size:13px;color:#650C75;font-weight:700;">lompoclocals.com</div>
    <div style="font-size:11px;color:#8b8091;margin-top:6px;line-height:1.5;">
      ${es ? "Recibes esto porque te apuntaste a los avisos de lanzamiento." : "You're getting this because you asked for launch alerts."}
      <a href="${unsubUrl}" style="color:#8b8091;">${es ? "Cancelar" : "Unsubscribe"}</a><br>
      Lompoc Locals · PO Box 880, Lompoc, CA 93438
    </div>
  </td></tr>
</table></body></html>`

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject,
      html,
      headers: oneClickUnsubHeaders(email),
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

export async function sendBroadcastEmail(
  email: string,
  unsubscribeToken: string,
  subject: string,
  bodyText: string,
  locale: "en" | "es"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    return { ok: false, error: "Email service not configured" }
  }

  const unsubUrl = siteUrl(`/subscribe/unsubscribe?token=${unsubscribeToken}`)
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map((p) => `<p style="color: #333; line-height: 1.6; margin: 0 0 14px;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("")

  const footer =
    locale === "es"
      ? `Recibes esto porque estás suscrito al resumen de Lompoc Locals.
         <a href="${unsubUrl}" style="color: #888;">Cancelar suscripción</a>
         · <a href="${siteUrl("/es")}" style="color: #888;">Visitar el sitio</a>`
      : `You're getting this because you subscribe to the Lompoc Locals digest.
         <a href="${unsubUrl}" style="color: #888;">Unsubscribe</a>
         · <a href="${siteUrl("/en")}" style="color: #888;">Visit site</a>`

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
      <p style="font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #650C75; margin: 0 0 12px;">
        Lompoc Locals
      </p>
      <h1 style="font-size: 22px; margin: 0 0 16px;">${escapeHtml(subject)}</h1>
      ${paragraphs}
      <p style="color: #888; font-size: 12px; margin-top: 32px;">${footer}</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject,
      html,
      headers: oneClickUnsubHeaders(email),
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}
