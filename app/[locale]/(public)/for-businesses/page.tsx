import { Link } from "@/i18n/navigation"
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Tag,
  Eye,
  Mail,
  Heart,
  ShieldCheck,
  Zap,
  Check,
} from "lucide-react"
import { getSiteStats } from "@/lib/queries"

export const metadata = {
  title: "List Your Lompoc Business Free — Reach Local Customers | Lompoc Deals",
  description:
    "Post coupons and deals to Lompoc locals for free — no commission, no credit card. 155+ businesses already listed. Start in 2 minutes.",
  keywords: [
    "list business lompoc",
    "lompoc business directory",
    "post deals lompoc",
    "lompoc small business marketing",
    "free business listing lompoc ca",
  ],
}

export default async function ForBusinessesPage() {
  const stats = await getSiteStats()

  return (
    <>
      {/* ─────────────────────────────────────────────────
          HERO — bold conversion-focused
         ───────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-gradient-to-b from-accent via-background to-background"
        />
        <div
          aria-hidden
          className="absolute -left-32 top-0 -z-10 h-[480px] w-[480px] rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -right-20 top-32 -z-10 h-[360px] w-[360px] rounded-full bg-primary/10 blur-3xl"
        />

        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-32">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
            {/* Left: copy + CTA */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <MapPin className="h-3 w-3" />
                For Lompoc business owners
              </div>

              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                The locals are already looking. <br />
                <span className="italic text-primary">Be where they look.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Lompoc Deals is the free, hometown-first directory for the
                Flower Capital. Post your coupons, specials, and announcements
                in 30 seconds — and reach the people already searching for the
                shops they love.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  Get started — it&apos;s free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/businesses"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border bg-background px-7 text-base font-semibold hover:bg-accent"
                >
                  See who&apos;s on it
                </Link>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                ✓ Free forever for the basics &nbsp;·&nbsp; ✓ No credit card
                &nbsp;·&nbsp; ✓ 30-second setup
              </p>
            </div>

            {/* Right: visual stat card */}
            <div className="relative">
              <div className="relative rounded-3xl border bg-card p-8 shadow-xl shadow-primary/5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Lompoc Deals · Right now
                </div>
                <div className="mt-6 space-y-6">
                  <BigStat
                    value={stats.businesses}
                    label="local businesses listed"
                  />
                  <div className="border-t" />
                  <BigStat
                    value={stats.activeDeals}
                    label="active deals & specials"
                  />
                  <div className="border-t" />
                  <BigStat
                    value={stats.categories}
                    label="categories — Real Estate to Coffee"
                  />
                </div>
                <div className="mt-8 rounded-2xl bg-accent p-4 text-xs text-accent-foreground">
                  <Sparkles className="mb-1 h-3.5 w-3.5" />
                  <strong>New this week:</strong> Dashboards for hours, photos,
                  social links, and listing claims.
                </div>
              </div>
              {/* Decorative blob */}
              <div
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-[40px] bg-primary/5 blur-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          HOW IT WORKS — 3 steps
         ───────────────────────────────────────────────── */}
      <section className="border-b bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              How it works
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Three steps. <span className="italic text-primary">Done.</span>
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              No demos. No sales calls. No 47-page contracts. Just sign up and
              post.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Step
              num="01"
              title="Claim or list your business"
              body="Find your business in our directory and click 'Claim it,' or list a brand-new one in 30 seconds. Free forever."
            />
            <Step
              num="02"
              title="Add your details"
              body="Logo, hours, social links, and a description. Your profile goes live the moment our admin approves it (usually same-day)."
            />
            <Step
              num="03"
              title="Post deals when you want"
              body="Coupons, specials, announcements — post as many as you want, edit anytime, expire whenever. Locals see them on the feed."
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          BENEFITS GRID — 6 reasons
         ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Why list with us
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for hometown businesses, <br />
            <span className="italic text-primary">not chains.</span>
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Benefit
            icon={<MapPin className="h-5 w-5" />}
            title="Lompoc-only audience"
            body="Every visitor is searching for businesses right here. No tourists, no out-of-towners — just locals."
          />
          <Benefit
            icon={<Tag className="h-5 w-5" />}
            title="Deals that get noticed"
            body="Post coupons, specials, and announcements. One flat monthly fee — no per-deal charges, no pay-to-win tricks."
          />
          <Benefit
            icon={<Eye className="h-5 w-5" />}
            title="View & click stats"
            body="See exactly how many people viewed your profile and clicked through to your site. No mystery."
          />
          <Benefit
            icon={<Mail className="h-5 w-5" />}
            title="Weekly digest"
            body="Your best deal goes out in our Saturday email to confirmed Lompoc locals. Free distribution."
          />
          <Benefit
            icon={<Heart className="h-5 w-5" />}
            title="Locals can favorite"
            body="Repeat customers save your deals to their favorites. Build a following without spending on ads."
          />
          <Benefit
            icon={<ShieldCheck className="h-5 w-5" />}
            title="You stay in control"
            body="It's your listing. Edit, expire, or remove anything. We never run ads on your profile or sell your data."
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          PRICING — three subscription tiers
         ───────────────────────────────────────────────── */}
      <section className="border-y bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Pricing
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple, local-first pricing.
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Pay one flat monthly fee. No per-deal fees, no hidden charges, no ads on your profile.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Free */}
            <div className="flex flex-col rounded-3xl border bg-card p-7 shadow-sm">
              <div className="font-display text-xl font-semibold">Free</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">$0</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {[
                  "Up to 3 active deals",
                  "Business profile page",
                  "Logo + cover image",
                  "Map pin + directory listing",
                  "Weekly digest inclusion",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-xl border text-sm font-semibold transition hover:bg-accent"
              >
                Get started free
              </Link>
            </div>

            {/* Standard — highlighted */}
            <div className="relative flex flex-col rounded-3xl border-2 border-primary bg-card p-7 shadow-lg ring-1 ring-primary/20">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                Most popular
              </div>
              <div className="font-display text-xl font-semibold">Standard</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">$19.99</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {[
                  "Up to 15 active deals",
                  "Everything in Free",
                  "View & click analytics",
                  "Social media links on profile",
                  "Hours + Google reviews link",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* Premium */}
            <div className="flex flex-col rounded-3xl border bg-card p-7 shadow-sm">
              <div className="font-display text-xl font-semibold">Premium</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">$39.99</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {[
                  "Unlimited deals",
                  "Everything in Standard",
                  "Priority listing in search results",
                  "Featured placement on homepage",
                  "Real estate listings module",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-xl border text-sm font-semibold transition hover:bg-accent"
              >
                Get started
              </Link>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            No credit card required for the Free plan. Cancel paid plans anytime.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          FINAL CTA
         ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="relative overflow-hidden rounded-[2.5rem] border bg-gradient-to-br from-primary/15 via-accent to-background p-10 sm:p-16">
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Ready in <span className="italic text-primary">30 seconds.</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              You can be live on Lompoc Deals before your coffee gets cold.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                List your business
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                or browse the deals first →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function BigStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="font-display text-5xl font-semibold leading-none tracking-tight">
        {value}
      </div>
      <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  )
}

function Step({
  num,
  title,
  body,
}: {
  num: string
  title: string
  body: string
}) {
  return (
    <div className="relative rounded-3xl border bg-card p-7 shadow-sm">
      <div className="font-display text-5xl font-semibold leading-none tracking-tight text-primary/30">
        {num}
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  )
}

function Benefit({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  )
}
