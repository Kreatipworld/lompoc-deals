import { NextResponse } from "next/server"
import { Resend } from "resend"
import { list, put } from "@vercel/blob"
import {
  decideAction,
  formatDowntime,
  isQuotaError,
  type CheckFailure,
  type HealthState,
} from "@/lib/uptime"
import { logCronRun } from "@/lib/cron-log"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Every 10 minutes: is the site actually alive for a neighbor right now?
 * Checks the database and the two most important pages. On failure, emails
 * the founder inbox (throttled to once an hour); on recovery, says so once.
 * State lives in Vercel Blob so this works precisely when Postgres doesn't.
 */

const STATE_PATH = "health/state.json"
const SITE = "https://www.lompoclocals.com"
const NEON_BILLING = "https://console.neon.tech/app/orgs/org-proud-cell-62155403/billing"

async function checkDatabase(): Promise<CheckFailure | null> {
  try {
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: "no-store" } })
    await Promise.race([
      sql`select 1`,
      new Promise((_, rej) => setTimeout(() => rej(new Error("timed out after 10s")), 10_000)),
    ])
    return null
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { target: "database", error: msg.slice(0, 300), quota: isQuotaError(msg) }
  }
}

async function checkPage(path: string): Promise<CheckFailure | null> {
  const url = `${SITE}${path}`
  try {
    const res = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: { "user-agent": "LompocLocals-HealthCheck/1.0" },
    })
    if (!res.ok) return { target: path || "/", error: `HTTP ${res.status}`, quota: false }
    return null
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { target: path || "/", error: msg.slice(0, 300), quota: false }
  }
}

async function readState(): Promise<HealthState | null> {
  try {
    const { blobs } = await list({ prefix: STATE_PATH, limit: 1 })
    if (!blobs.length) return null
    const res = await fetch(blobs[0].url, { cache: "no-store" })
    if (!res.ok) return null
    return (await res.json()) as HealthState
  } catch {
    return null
  }
}

async function writeState(state: HealthState): Promise<void> {
  await put(STATE_PATH, JSON.stringify(state), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  })
}

function shell(inner: string): string {
  return `<div style="background:#f4f1f5;padding:24px 12px;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e0e8;">
    <div style="background:#650C75;padding:16px 24px;">
      <span style="color:#ffffff;font-size:16px;font-weight:700;">Lompoc Locals</span>
      <span style="color:#EFC618;font-size:13px;font-weight:600;float:right;margin-top:2px;">site monitor</span>
    </div>
    <div style="padding:24px;">${inner}</div>
    <div style="padding:12px 24px;border-top:1px solid #eee;color:#8a7f90;font-size:12px;">
      Automated check runs every 10 minutes from lompoclocals.com.
    </div>
  </div>
</div>`
}

function alertHtml(failures: CheckFailure[], since: string, test = false): string {
  const rows = failures
    .map(
      (f) => `<tr>
        <td style="padding:8px 12px;border:1px solid #eee;font-weight:600;white-space:nowrap;">${f.target}</td>
        <td style="padding:8px 12px;border:1px solid #eee;font-family:monospace;font-size:12px;color:#b91c1c;">${f.error}</td>
      </tr>`
    )
    .join("")
  const quotaHint = failures.some((f) => f.quota)
    ? `<div style="background:#fefce8;border:1px solid #EFC618;border-radius:8px;padding:12px 16px;margin:16px 0 0;font-size:14px;">
         <strong>Likely fix:</strong> this is a Neon <em>compute quota</em> error (like Aug 23).
         Check the <a href="${NEON_BILLING}" style="color:#650C75;">Kreatip org billing page</a> — make sure the org says <strong>Kreatip</strong>, not the Vercel one.
       </div>`
    : ""
  return shell(`
    ${test ? `<div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:13px;"><strong>TEST</strong> — this is a sample alert; the site is fine.</div>` : ""}
    <h1 style="margin:0 0 4px;font-size:20px;color:#b91c1c;">&#128308; lompoclocals.com is DOWN</h1>
    <p style="margin:0 0 16px;color:#555;font-size:14px;">Failing since ${since} (Pacific shown in your mail client's local time).</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px;">${rows}</table>
    ${quotaHint}
    <p style="margin:16px 0 0;font-size:14px;color:#555;">You'll get at most one of these per hour until it recovers, then a green all-clear.</p>`)
}

function recoveryHtml(downtimeMs: number): string {
  return shell(`
    <h1 style="margin:0 0 4px;font-size:20px;color:#0B992F;">&#128994; lompoclocals.com is back</h1>
    <p style="margin:0;color:#555;font-size:14px;">Everything checks out again — database and pages responding. Total downtime: <strong>${formatDowntime(downtimeMs)}</strong>.</p>`)
}

async function sendAlertEmail(subject: string, html: string): Promise<string | null> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data, error } = await resend.emails.send({
    from: "Lompoc Locals <hello@lompoclocals.com>",
    to: process.env.NOTIFY_EMAIL ?? "hello@lompoclocals.com",
    subject,
    html,
  })
  if (error) throw new Error(`resend: ${error.message}`)
  return data?.id ?? null
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Manual test path: sends a clearly-marked sample alert, touches nothing else.
  const url = new URL(request.url)
  if (url.searchParams.get("test") === "alert") {
    const id = await sendAlertEmail(
      "[TEST] Lompoc Locals monitor — sample DOWN alert",
      alertHtml(
        [{ target: "database", error: "HTTP 402: exceeded the compute time quota (sample)", quota: true }],
        new Date().toISOString(),
        true
      )
    )
    return NextResponse.json({ test: true, emailId: id })
  }

  const results = await Promise.all([checkDatabase(), checkPage("/"), checkPage("/deals")])
  const failures = results.filter((f): f is CheckFailure => f !== null)

  const prev = await readState()
  const action = decideAction(prev, failures, new Date())

  let emailId: string | null = null
  try {
    if (action.kind === "alert" || action.kind === "realert") {
      emailId = await sendAlertEmail(
        `\u{1F534} lompoclocals.com DOWN — ${failures[0].target}: ${failures[0].error.slice(0, 80)}`,
        alertHtml(failures, action.state.since)
      )
    } else if (action.kind === "recovery") {
      emailId = await sendAlertEmail(
        `\u{1F7E2} lompoclocals.com recovered (down ${formatDowntime(action.downtimeMs)})`,
        recoveryHtml(action.downtimeMs)
      )
    }
  } finally {
    // Persist state even if the email fails, except: keep "was up" state on a
    // failed first alert so the next run retries the alert email.
    if (action.state && (emailId !== null || action.kind === "realert" || action.kind === "recovery")) {
      await writeState(action.state)
    }
  }

  const summary = { ok: failures.length === 0, action: action.kind, failures, emailId }
  await logCronRun("health-check", summary, summary.ok)
  return NextResponse.json(summary)
}
