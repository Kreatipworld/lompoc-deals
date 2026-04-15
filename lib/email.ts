import { Resend } from "resend"
import type { DealCardData } from "@/lib/queries"

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
  token: string
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set; skipping send")
    return { ok: false, error: "Email service not configured" }
  }

  const confirmUrl = siteUrl(`/subscribe/confirm?token=${token}`)
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Confirm your Lompoc Deals subscription",
      html: `
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
      `,
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set; skipping send")
    return { ok: false, error: "Email service not configured" }
  }

  const resetUrl = siteUrl(`/reset-password?token=${token}`)
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Reset your Lompoc Deals password",
      html: `
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
      `,
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  role: "local" | "business"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set; skipping welcome email")
    return { ok: false, error: "Email service not configured" }
  }

  const siteLink = siteUrl()
  const dashboardLink = role === "business" ? siteUrl("/en/dashboard") : siteUrl("/en/account")

  const isBusinessRole = role === "business"
  const subjectEn = isBusinessRole
    ? "Welcome to Lompoc Deals — your business is almost live!"
    : "Welcome to Lompoc Deals!"
  const subjectEs = isBusinessRole
    ? "Bienvenido a Lompoc Deals — ¡tu negocio está casi en línea!"
    : "¡Bienvenido a Lompoc Deals!"

  const nextStepsEn = isBusinessRole
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

  const nextStepsEs = isBusinessRole
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

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: subjectEn,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;">
          <!-- English -->
          <h1 style="font-size:24px;margin-bottom:4px;">Welcome to Lompoc Deals, ${name}!</h1>
          <p style="color:#555;line-height:1.5;margin:0 0 12px;">
            ${isBusinessRole
              ? "Thanks for signing up. We're excited to help your business reach local customers in Lompoc."
              : "Thanks for joining. Lompoc Deals is your go-to feed for local coupons, specials, and announcements from businesses in Lompoc, California."}
          </p>
          <p style="font-weight:600;color:#111;margin:16px 0 4px;">Next steps:</p>
          ${nextStepsEn}
          <p style="margin:24px 0;">
            <a href="${dashboardLink}"
               style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">
              ${isBusinessRole ? "Go to dashboard" : "Browse deals"}
            </a>
          </p>

          <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">

          <!-- Spanish -->
          <h2 style="font-size:20px;margin-bottom:4px;color:#333;">${subjectEs}</h2>
          <p style="color:#555;line-height:1.5;margin:0 0 12px;">
            ${isBusinessRole
              ? "Gracias por registrarte. Estamos emocionados de ayudarte a llegar a clientes locales en Lompoc."
              : "Gracias por unirte. Lompoc Deals es tu fuente de cupones, especiales y anuncios de negocios locales en Lompoc, California."}
          </p>
          <p style="font-weight:600;color:#111;margin:16px 0 4px;">Próximos pasos:</p>
          ${nextStepsEs}
          <p style="margin:24px 0;">
            <a href="${dashboardLink}"
               style="display:inline-block;background:#333;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">
              ${isBusinessRole ? "Ir al panel" : "Ver ofertas"}
            </a>
          </p>

          <p style="color:#888;font-size:12px;margin-top:32px;">
            <a href="${siteLink}" style="color:#888;">lompocdeals.com</a>
          </p>
        </div>
      `,
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}

export async function sendDigestEmail(
  email: string,
  unsubscribeToken: string,
  deals: DealCardData[]
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

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: `Lompoc Deals — ${deals.length} new this week`,
      html: `
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
      `,
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" }
  }
}
