// One-off: send the current business-welcome email (the only email that touches
// "becoming Growth" today) to hello@ as a proof. Delete-safe.
import { sendBusinessWelcomeEmail } from "../lib/email"

async function main() {
  await sendBusinessWelcomeEmail("hello@lompoclocals.com", "Andres", "en")
  console.log("SENT-OK")
}
main().catch((e) => { console.error(e); process.exit(1) })
