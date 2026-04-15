import { Link } from "@/i18n/navigation"
import {
  ArrowRight,
  Heart,
  MapPin,
  Mail,
  Bell,
  Tag,
  Users,
  Compass,
  Zap,
  Check,
} from "lucide-react"
import { getSiteStats } from "@/lib/queries"

export const metadata = {
  title: "For Locals — Discover Deals & Support Lompoc Businesses | Lompoc Deals",
  description:
    "Sign up free and get exclusive deals from 470+ Lompoc businesses. Save favorites, get the weekly digest, and discover what's happening in your hometown.",
  keywords: [
    "lompoc locals",
    "lompoc deals for residents",
    "lompoc local discounts",
    "things to do lompoc",
    "lompoc community",
    "lompoc ca businesses",
    "support local lompoc",
  ],
}

export default async function LocalsPage() {
  const stats = await getSiteStats()

  return (
    <>
      {/* ─────────────────────────────────────────────────
          HERO
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
                For Lompoc residents
              </div>

              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Your hometown&apos;s best deals,{" "}
                <br />
                <span className="italic text-primary">all in one place.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Lompoc Deals connects locals to exclusive discounts, specials,
                and announcements from the businesses that make this city great.
                Free forever — no spam, no ads.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup/user"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/90 active:scale-[0.97]"
                >
                  Join free — it takes 30 seconds
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/deals"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border bg-background px-7 text-base font-semibold transition-colors hover:bg-accent"
                >
                  Browse deals first
                </Link>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                ✓ Always free &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓
                Unsubscribe anytime
              </p>
            </div>

            {/* Right: live stat card */}
            <div className="relative">
              <div className="relative rounded-3xl border bg-card p-8 shadow-xl shadow-primary/5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Lompoc Deals · Right now
                </div>
                <div className="mt-6 space-y-6">
                  <BigStat
                    value={stats.businesses}
                    label="local businesses with active listings"
                  />
                  <div className="border-t" />
                  <BigStat
                    value={stats.activeDeals}
                    label="deals & specials live right now"
                  />
                  <div className="border-t" />
                  <BigStat
                    value={stats.categories}
                    label="categories — wineries to wellness"
                  />
                </div>
                <div className="mt-8 rounded-2xl bg-accent p-4 text-xs text-accent-foreground">
                  <Heart className="mb-1 h-3.5 w-3.5" />
                  <strong>Free to join.</strong> Save favorites, get deal
                  alerts, and never miss a Lompoc special again.
                </div>
              </div>
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
              Three steps.{" "}
              <span className="italic text-primary">Start saving.</span>
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              No app download. No credit card. No catch.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Step
              num="01"
              title="Create your free account"
              body="Sign up in 30 seconds — just your name, zip code, and a password. Tell us your interests so we only show you what matters."
              delay={0}
            />
            <Step
              num="02"
              title="Discover local businesses"
              body="Browse 470+ Lompoc businesses by category, search by name, or explore the deals feed. No algorithm burying what you care about."
              delay={80}
            />
            <Step
              num="03"
              title="Save, follow, and save money"
              body="Heart your favorites, get the weekly digest with the top deals, and redeem offers directly with local businesses."
              delay={160}
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
            Why join
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for Lompoc people,{" "}
            <br />
            <span className="italic text-primary">not algorithms.</span>
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Benefit
            icon={<Tag className="h-5 w-5" />}
            title="Real deals from real locals"
            body="Every coupon, special, and announcement comes directly from a Lompoc business owner — not a national chain, not a bot."
            delay={0}
          />
          <Benefit
            icon={<Heart className="h-5 w-5" />}
            title="Save your favorites"
            body="Heart the businesses and deals you love. Come back anytime and find them waiting. Build your personal Lompoc guide."
            delay={60}
          />
          <Benefit
            icon={<Mail className="h-5 w-5" />}
            title="Saturday deal digest"
            body="One email every Saturday morning — the top 10 deals from Lompoc businesses that week. Unsubscribe with one click, anytime."
            delay={120}
          />
          <Benefit
            icon={<Compass className="h-5 w-5" />}
            title="Discover hidden gems"
            body="470+ businesses are listed. Many you've probably never heard of. The Wine Ghetto, local repair shops, wellness studios — all here."
            delay={0}
          />
          <Benefit
            icon={<Users className="h-5 w-5" />}
            title="Support your community"
            body="Every deal you redeem goes straight to a Lompoc business owner. Not Amazon. Not a franchise. Your neighbor."
            delay={60}
          />
          <Benefit
            icon={<Bell className="h-5 w-5" />}
            title="Always free, no ads"
            body="Your account is free forever. We never sell your data, show ads, or flood your inbox. Just local deals when you want them."
            delay={120}
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          WHAT YOU GET — feature checklist
         ───────────────────────────────────────────────── */}
      <section className="border-y bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              What you get
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything included. <span className="italic text-primary">Free.</span>
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              No tiers, no upgrades, no hidden costs for locals. Full access, always.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-2xl rounded-3xl border bg-card p-8 shadow-sm sm:p-10">
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                "Browse all 470+ Lompoc businesses",
                "See every active deal & special",
                "Save favorites with one tap",
                "Weekly Saturday deal digest email",
                "Search by category, name, or keyword",
                "Interactive map of local businesses",
                "Business hours and contact info",
                "Bilingual — English & Spanish",
                "Works on any phone or computer",
                "No app download required",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-display text-2xl font-bold">$0</div>
                <div className="text-sm text-muted-foreground">forever, for locals</div>
              </div>
              <Link
                href="/signup/user"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-sm [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/90 active:scale-[0.97]"
              >
                Create your free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          CATEGORIES TEASER — what's on the platform
         ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            What&apos;s on Lompoc Deals
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            From wine to wellness.{" "}
            <span className="italic text-primary">It&apos;s all here.</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Restaurants, wineries, retail, services, health, auto — if it&apos;s
            in Lompoc, it&apos;s in the directory.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { label: "Restaurants & Bars", emoji: "🍽️" },
            { label: "Wineries & Tasting Rooms", emoji: "🍷" },
            { label: "Retail & Shopping", emoji: "🛍️" },
            { label: "Health & Beauty", emoji: "💆" },
            { label: "Home Services", emoji: "🔧" },
            { label: "Auto & Transportation", emoji: "🚗" },
            { label: "Real Estate", emoji: "🏡" },
            { label: "Entertainment", emoji: "🎭" },
          ].map(({ label, emoji }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-5 text-center shadow-sm"
            >
              <span className="text-3xl" role="img" aria-hidden>
                {emoji}
              </span>
              <span className="text-sm font-medium leading-tight">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/businesses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Browse all businesses
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
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
              Lompoc is your town.{" "}
              <span className="italic text-primary">Own it.</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Join your neighbors. Discover deals. Support the businesses that
              make this city worth living in.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup/user"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/90 active:scale-[0.97]"
              >
                Join free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/deals"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                or browse deals without signing up →
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Own a business?{" "}
              <Link
                href="/for-businesses"
                className="font-medium text-primary hover:underline"
              >
                List it free →
              </Link>
            </p>
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
  delay = 0,
}: {
  num: string
  title: string
  body: string
  delay?: number
}) {
  return (
    <div
      className="relative rounded-3xl border bg-card p-7 shadow-sm card-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
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
  delay = 0,
}: {
  icon: React.ReactNode
  title: string
  body: string
  delay?: number
}) {
  return (
    <div
      className="rounded-2xl border bg-card p-6 shadow-sm card-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
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
