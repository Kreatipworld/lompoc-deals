// Render the exact master digest for a given send date without sending it.
// Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/preview-digest.ts
import { writeFileSync } from "node:fs"
import { getMasterDigestContent, hasMasterDigestContent } from "@/lib/digest"
import { renderMasterDigestHtml } from "@/lib/email"

async function main() {
  const c = await getMasterDigestContent()
  console.log("has content:", hasMasterDigestContent(c))
  for (const [k, v] of Object.entries(c as Record<string, unknown>)) {
    if (Array.isArray(v)) console.log(`${k}:`, v.length)
    else if (v && typeof v === "object" && "name" in (v as object)) console.log(`${k}:`, (v as { name: string }).name)
  }

  const html = renderMasterDigestHtml(c, "en", {
    unsubUrl: "https://www.lompoclocals.com/subscribe/unsubscribe?token=PREVIEW",
    now: new Date("2026-08-08T16:00:00Z"),
  })
  writeFileSync("docs/marketing/taco-route/digest-preview-aug8.html", html)
  console.log("PREVIEW_WRITTEN")

  const { Resend } = await import("resend")
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data, error } = await resend.emails.send({
    from: "Lompoc Locals <hello@lompoclocals.com>",
    to: "hello@lompoclocals.com",
    subject: "[PROOF] 📬 The Lompoc Locals — your weekly front page (Aug 8 edition)",
    html,
  })
  if (error) throw new Error(JSON.stringify(error))
  console.log("PROOF_SENT", data?.id)
}

main()
