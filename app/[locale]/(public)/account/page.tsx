import { redirect } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { getViewer } from "@/lib/viewer"
import { getUserClaimedCoupons, getUserRedemptions, getFavoritedDeals } from "@/lib/queries"
import { db } from "@/db/client"
import { subscribers, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { formatDistanceToNow, format } from "date-fns"
import { Tag, CheckCircle2, Clock, Heart, Mail, Bell, BellOff } from "lucide-react"
import { updateNotificationPrefsAction } from "@/lib/business-follow-actions"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "account" })
  return { title: t("metaTitle") }
}

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { notif?: string }
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "account" })
  const viewer = await getViewer()
  if (!viewer.isAuthed) {
    redirect("/login?from=/account")
  }

  // Business users have their own merchant dashboard
  if (viewer.isBusiness) {
    redirect("/dashboard/profile")
  }

  // Admin users go to admin panel
  if (viewer.isAdmin) {
    redirect("/admin")
  }

  const session = await auth()
  const userEmail = session?.user?.email ?? ""

  const [coupons, redemptions, favoritedDeals, subscriber, userRow] = await Promise.all([
    getUserClaimedCoupons(viewer.userId!),
    getUserRedemptions(viewer.userId!),
    getFavoritedDeals(viewer.userId!),
    db.query.subscribers.findFirst({
      where: eq(subscribers.email, userEmail),
      columns: { confirmedAt: true },
    }),
    db.query.users.findFirst({
      where: eq(users.id, viewer.userId!),
      columns: { notificationEmails: true },
    }),
  ])

  const activeCoupons = coupons.filter((c) => !c.isExpired)
  const expiredCoupons = coupons.filter((c) => c.isExpired)
  const isSubscribed = !!subscriber?.confirmedAt
  const notificationEmails = userRow?.notificationEmails ?? true
  const notifJustDisabled = searchParams.notif === "off"

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-bold tracking-tight">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </section>

      {notifJustDisabled && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {t("notifDisabledBanner")}
        </div>
      )}

      {/* Quick links */}
      <section className="flex flex-wrap gap-3">
        <Link
          href="/favorites"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <Heart className="h-4 w-4" />
          {t("myFavorites")}
          {favoritedDeals.length > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
              {favoritedDeals.length}
            </span>
          )}
        </Link>
        <Link
          href="/deals"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <Tag className="h-4 w-4" />
          {t("browseDeals")}
        </Link>
        <Link
          href="/subscribe"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <Mail className="h-4 w-4" />
          {isSubscribed ? t("manageDigest") : t("subscribeToDigest")}
        </Link>
      </section>

      {/* Digest status */}
      <section className="rounded-xl border p-5">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t("weeklyDigest")}</h2>
          {isSubscribed ? (
            <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {t("subscribed")}
            </span>
          ) : (
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {t("notSubscribed")}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSubscribed ? t("digestSubscribedBody") : t("digestNotSubscribedBody")}
        </p>
        {!isSubscribed && (
          <Link
            href="/subscribe"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("subscribeFree")}
          </Link>
        )}
      </section>

      {/* Deal notifications */}
      <section className="rounded-xl border p-5">
        <div className="flex items-center gap-2">
          {notificationEmails ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <h2 className="text-lg font-semibold">{t("dealNotifications")}</h2>
          <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${notificationEmails ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
            {notificationEmails ? t("notifOn") : t("notifOff")}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {notificationEmails ? t("notifOnBody") : t("notifOffBody")}
        </p>
        <form action={updateNotificationPrefsAction} className="mt-3">
          {notificationEmails && (
            <input type="hidden" name="notificationEmails" value="" />
          )}
          {notificationEmails ? (
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <BellOff className="h-3.5 w-3.5" />
              {t("turnOff")}
            </button>
          ) : (
            <>
              <input type="hidden" name="notificationEmails" value="on" />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Bell className="h-3.5 w-3.5" />
                {t("turnOn")}
              </button>
            </>
          )}
        </form>
      </section>

      {/* Favorited deals */}
      {favoritedDeals.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{t("favoritedDeals")}</h2>
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {favoritedDeals.length}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {favoritedDeals.slice(0, 4).map((deal) => (
              <Link
                key={deal.id}
                href={`/biz/${deal.business.slug}`}
                className="flex items-start gap-3 rounded-xl border p-4 hover:bg-accent"
              >
                {deal.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={deal.imageUrl}
                    alt=""
                    className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-snug truncate">{deal.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">{deal.business.name}</p>
                </div>
              </Link>
            ))}
          </div>
          {favoritedDeals.length > 4 && (
            <Link
              href="/favorites"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              {t("viewAllFavorites", { count: favoritedDeals.length })} →
            </Link>
          )}
        </section>
      )}

      {/* Active coupons */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{t("activeCoupons")}</h2>
          {activeCoupons.length > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {activeCoupons.length}
            </span>
          )}
        </div>

        {activeCoupons.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <Tag className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("noCoupons")}</p>
            <Link href="/deals" className="mt-2 inline-block text-sm text-primary underline">
              {t("browseToClaim")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCoupons.map((coupon) => (
              <CouponCard key={`${coupon.dealId}-${coupon.claimedAt.toISOString()}`} coupon={coupon} activeLabel={t("activeLabel")} expiredLabel={t("expiredLabel")} expiresLabel={t("expiresLabel")} />
            ))}
          </div>
        )}
      </section>

      {/* Redemption history */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">{t("redemptionHistory")}</h2>
        </div>

        {redemptions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t("noRedemptions")}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t("colDeal")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("colBusiness")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("colRedeemed")}</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-medium">{r.dealTitle}</span>
                      {r.discountText && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {r.discountText}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/biz/${r.businessSlug}`}
                        className="hover:underline"
                      >
                        {r.businessName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(r.redeemedAt, "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Expired coupons */}
      {expiredCoupons.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-muted-foreground">{t("expiredCoupons")}</h2>
          </div>
          <div className="space-y-3 opacity-60">
            {expiredCoupons.map((coupon) => (
              <CouponCard key={`${coupon.dealId}-${coupon.claimedAt.toISOString()}`} coupon={coupon} expired activeLabel={t("activeLabel")} expiredLabel={t("expiredLabel")} expiresLabel={t("expiresLabel")} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function CouponCard({
  coupon,
  expired = false,
  activeLabel,
  expiredLabel,
  expiresLabel,
}: {
  coupon: {
    dealId: number
    dealTitle: string
    discountText: string | null
    imageUrl: string | null
    expiresAt: Date
    claimedAt: Date
    businessName: string
    businessSlug: string
  }
  expired?: boolean
  activeLabel: string
  expiredLabel: string
  expiresLabel: string
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border p-4">
      {coupon.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coupon.imageUrl}
          alt=""
          className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
          <Tag className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium leading-snug">{coupon.dealTitle}</p>
        {coupon.discountText && (
          <p className="mt-0.5 text-sm font-semibold text-primary">
            {coupon.discountText}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          <Link href={`/biz/${coupon.businessSlug}`} className="hover:underline">
            {coupon.businessName}
          </Link>
          {" · "}
          {expired
            ? expiredLabel.replace("{distance}", formatDistanceToNow(coupon.expiresAt, { addSuffix: true }))
            : expiresLabel.replace("{distance}", formatDistanceToNow(coupon.expiresAt, { addSuffix: true }))}
        </p>
      </div>
      {!expired && (
        <span className="flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          {activeLabel}
        </span>
      )}
    </div>
  )
}
