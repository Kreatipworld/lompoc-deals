import { Resend } from "resend"
import type { DealCardData } from "@/lib/queries"

export type DealNotificationData = {
  id: number
  title: string
  description: string | null
  discountText: string | null
  businessName: string
  businessSlug: string
}

const FROM_ADDRESS = "Lompoc Deals <onboarding@resend.dev>"

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
      ? "Confirma tu suscripción a Lompoc Deals"
      : "Confirm your Lompoc Deals subscription"

  const html =
    locale === "es"
      ? `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <h1 style="font-size: 22px; margin-bottom: 8px;">Confirma tu suscripción</h1>
          <p style="color: #555; line-height: 1.5;">
            Haz clic en el botón de abajo para confirmar tu correo y empezar a recibir
            el resumen semanal de Lompoc Deals.
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
            weekly Lompoc Deals digest.
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
      ? "Restablece tu contraseña de Lompoc Deals"
      : "Reset your Lompoc Deals password"

  const html =
    locale === "es"
      ? `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <h1 style="font-size: 22px; margin-bottom: 8px;">Restablece tu contraseña</h1>
          <p style="color: #555; line-height: 1.5;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en Lompoc Deals.
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
            We received a request to reset the password for your Lompoc Deals account.
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
        ? "Bienvenido a Lompoc Deals — ¡tu negocio está casi en línea!"
        : "¡Bienvenido a Lompoc Deals!"
      : isBusinessRole
        ? "Welcome to Lompoc Deals — your business is almost live!"
        : "Welcome to Lompoc Deals!"

  const html =
    locale === "es"
      ? `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;">
          <h1 style="font-size:24px;margin-bottom:4px;">¡Bienvenido a Lompoc Deals, ${name}!</h1>
          <p style="color:#555;line-height:1.5;margin:0 0 12px;">
            ${
              isBusinessRole
                ? "Gracias por registrarte. Estamos emocionados de ayudarte a llegar a clientes locales en Lompoc."
                : "Gracias por unirte. Lompoc Deals es tu fuente de cupones, especiales y anuncios de negocios locales en Lompoc, California."
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
            <a href="${siteUrl()}" style="color:#888;">lompocdeals.com</a>
          </p>
        </div>
      `
      : `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;">
          <h1 style="font-size:24px;margin-bottom:4px;">Welcome to Lompoc Deals, ${name}!</h1>
          <p style="color:#555;line-height:1.5;margin:0 0 12px;">
            ${
              isBusinessRole
                ? "Thanks for signing up. We're excited to help your business reach local customers in Lompoc."
                : "Thanks for joining. Lompoc Deals is your go-to feed for local coupons, specials, and announcements from businesses in Lompoc, California."
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
            <a href="${siteUrl()}" style="color:#888;">lompocdeals.com</a>
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
      ? `Tu publicación "${postTitle}" está en vivo en Lompoc Deals`
      : `Your post "${postTitle}" is live on Lompoc Deals`

  const html =
    locale === "es"
      ? `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <p>¡Buenas noticias — un administrador aprobó tu publicación <strong>"${escapeHtml(postTitle)}"</strong> y ya está en vivo en Lompoc Deals!</p>
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
          <p>Good news — an admin approved your post <strong>"${escapeHtml(postTitle)}"</strong> and it's now live on the Lompoc Deals feed.</p>
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
  locale: "en" | "es"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    return { ok: false, error: "Email service not configured" }
  }

  const unsubUrl = siteUrl(`/subscribe/unsubscribe?token=${unsubscribeToken}`)

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
      ? `Lompoc Deals — ${deals.length} nuevas esta semana`
      : `Lompoc Deals — ${deals.length} new this week`

  const html =
    locale === "es"
      ? `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <h1 style="font-size: 22px; margin-bottom: 4px;">Esta semana en Lompoc</h1>
          <p style="color: #555; margin: 0 0 12px;">
            Las ${deals.length} mejores ofertas de negocios locales.
          </p>
          ${dealsHtml}
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
