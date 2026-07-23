import { Resend } from "resend"
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

  const html =
    locale === "es"
      ? `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <h1 style="font-size: 22px; margin-bottom: 8px;">Confirma tu suscripción</h1>
          <p style="color: #555; line-height: 1.5;">
            Haz clic en el botón de abajo para confirmar tu correo y empezar a recibir
            el resumen semanal de Lompoc Locals.
          </p>
          <p style="margin: 24px 0;">
            <a href="${confirmUrl}"
               style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
              Confirmar suscripción
            </a>
          </p>
          <p style="color: #888; font-size: 13px;">
            O pega este enlace en tu navegador:<br>
            <span style="word-break: break-all;">${confirmUrl}</span>
          </p>
        </div>
      `
      : `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <h1 style="font-size: 22px; margin-bottom: 8px;">Confirm your subscription</h1>
          <p style="color: #555; line-height: 1.5;">
            Click the button below to confirm your email and start receiving the
            weekly Lompoc Locals digest.
          </p>
          <p style="margin: 24px 0;">
            <a href="${confirmUrl}"
               style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
              Confirm subscription
            </a>
          </p>
          <p style="color: #888; font-size: 13px;">
            Or paste this link in your browser:<br>
            <span style="word-break: break-all;">${confirmUrl}</span>
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

  const dashboardLink = role === "business" ? siteUrl("/en/dashboard") : siteUrl("/en/account")
  const isBusinessRole = role === "business"

  const subject =
    locale === "es"
      ? isBusinessRole
        ? "Bienvenido a Lompoc Locals — ¡tu negocio está casi en línea!"
        : "¡Bienvenido a Lompoc Locals!"
      : isBusinessRole
        ? "Welcome to Lompoc Locals — your business is almost live!"
        : "Welcome to Lompoc Locals!"

  const html =
    locale === "es"
      ? `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;">
          <h1 style="font-size:24px;margin-bottom:4px;">¡Bienvenido a Lompoc Locals, ${name}!</h1>
          <p style="color:#555;line-height:1.5;margin:0 0 12px;">
            ${
              isBusinessRole
                ? "Gracias por registrarte. Estamos emocionados de ayudarte a llegar a clientes locales en Lompoc."
                : "Gracias por unirte. Lompoc Locals es tu fuente de cupones, especiales y anuncios de negocios locales en Lompoc, California."
            }
          </p>
          <p style="font-weight:600;color:#111;margin:16px 0 4px;">Próximos pasos:</p>
          ${
            isBusinessRole
              ? `<ul style="color:#555;line-height:1.8;padding-left:20px;">
                  <li>Completa tu perfil de negocio</li>
                  <li>Publica tu primera oferta o especial</li>
                  <li>Tu listado se publica una vez aprobado por nuestro equipo</li>
                </ul>`
              : `<ul style="color:#555;line-height:1.8;padding-left:20px;">
                  <li>Explora las últimas ofertas de negocios locales</li>
                  <li>Guarda tus favoritos</li>
                  <li>Suscríbete al resumen semanal para no perderte ninguna oferta</li>
                </ul>`
          }
          <p style="margin:24px 0;">
            <a href="${dashboardLink}"
               style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">
              ${isBusinessRole ? "Ir al panel" : "Ver ofertas"}
            </a>
          </p>
          <p style="color:#888;font-size:12px;margin-top:32px;">
            <a href="${siteUrl()}" style="color:#888;">lompoclocals.com</a>
          </p>
        </div>
      `
      : `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;">
          <h1 style="font-size:24px;margin-bottom:4px;">Welcome to Lompoc Locals, ${name}!</h1>
          <p style="color:#555;line-height:1.5;margin:0 0 12px;">
            ${
              isBusinessRole
                ? "Thanks for signing up. We're excited to help your business reach local customers in Lompoc."
                : "Thanks for joining. Lompoc Locals is your go-to feed for local coupons, specials, and announcements from businesses in Lompoc, California."
            }
          </p>
          <p style="font-weight:600;color:#111;margin:16px 0 4px;">Next steps:</p>
          ${
            isBusinessRole
              ? `<ul style="color:#555;line-height:1.8;padding-left:20px;">
                  <li>Complete your business profile</li>
                  <li>Post your first deal or special</li>
                  <li>Your listing goes live once approved by our team</li>
                </ul>`
              : `<ul style="color:#555;line-height:1.8;padding-left:20px;">
                  <li>Browse the latest deals from local businesses</li>
                  <li>Save your favorites</li>
                  <li>Subscribe to the weekly digest to never miss a deal</li>
                </ul>`
          }
          <p style="margin:24px 0;">
            <a href="${dashboardLink}"
               style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">
              ${isBusinessRole ? "Go to dashboard" : "Browse deals"}
            </a>
          </p>
          <p style="color:#888;font-size:12px;margin-top:32px;">
            <a href="${siteUrl()}" style="color:#888;">lompoclocals.com</a>
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
        ${leadHtml}${eventsHtml}${dealsHtml}${twoColHtml}
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
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject, html })
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
    await resend.emails.send({ from: FROM_ADDRESS, to: email, subject, html })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}
