import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { eq } from "drizzle-orm"
import { ShoppingBag, ShieldAlert } from "lucide-react"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { users } from "@/db/schema"
import { Link } from "@/i18n/navigation"
import { countPendingForUser } from "@/lib/sales-queries"
import { canPostAnother } from "@/lib/sales"
import { SalePostForm } from "./post-form"
import { VerifyEmailPanel } from "./verify-panel"

// Signed-in only: this page reads the session, so it is dynamic (never ISR).
export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: "sales.post" })
  return { title: t("metaTitle"), description: t("metaDescription"), robots: { index: false, follow: true } }
}

export default async function SalesPostPage({ params, searchParams }: { params: { locale: string }; searchParams?: { verify?: string } }) {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: "sales.post" })
  const session = await auth()
  if (!session?.user) redirect(`${params.locale === "es" ? "/es" : ""}/login?from=/sales/post`)
  const userId = parseInt(session.user.id, 10)
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, email: true, emailVerified: true, salesBlockedAt: true, role: true },
  })
  if (!user) redirect(`${params.locale === "es" ? "/es" : ""}/login?from=/sales/post`)

  const pending = await countPendingForUser(userId)
  const verified = !!user.emailVerified || user.role === "admin"

  let gate: React.ReactNode = null
  if (user.salesBlockedAt) {
    gate = <Gate icon={<ShieldAlert className="h-6 w-6 text-destructive" />} heading={t("blockedHeading")} body={t("blockedBody")} />
  } else if (!verified) {
    gate = <VerifyEmailPanel email={user.email} status={searchParams?.verify === "invalid" ? "invalid" : null} />
  } else if (!canPostAnother(pending)) {
    gate = <Gate icon={<ShoppingBag className="h-6 w-6 text-primary" />} heading={t("pendingCapHeading")} body={t("pendingCapBody")} />
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <ShoppingBag className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("heading")}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {searchParams?.verify === "done" && (
        <p className="mb-6 rounded-2xl border border-success/30 bg-success-muted px-4 py-3 text-center text-sm font-medium text-success">{t("verify.done")}</p>
      )}

      {gate ?? (
        <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-8">
          <SalePostForm userId={userId} />
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link href="/sales" className="underline underline-offset-4 hover:text-foreground">
          {t("successBrowse")}
        </Link>
      </p>
    </div>
  )
}

function Gate({ icon, heading, body }: { icon: React.ReactNode; heading: string; body: string }) {
  return (
    <div className="rounded-3xl border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">{icon}</div>
      <h2 className="mt-4 font-display text-xl font-semibold">{heading}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  )
}
