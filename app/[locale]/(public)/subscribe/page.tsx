import { Mail, Sparkles, Clock, ShieldCheck, Star, Users } from "lucide-react"
import { SubscribeForm } from "./subscribe-form"

export const metadata = {
  title: "Weekly Digest — Lompoc Deals",
  description:
    "Get the top 10 local deals delivered free every Saturday morning. Join thousands of Lompoc locals saving every week.",
}

const benefits = [
  {
    icon: Sparkles,
    title: "Top 10 curated deals",
    desc: "We hand-pick the best offers from local businesses every week — no filler, just savings.",
  },
  {
    icon: Clock,
    title: "Delivered Saturday at 9am",
    desc: "Start your weekend knowing exactly where to find the best deals in Lompoc.",
  },
  {
    icon: ShieldCheck,
    title: "Free. No spam. Ever.",
    desc: "One email per week, unsubscribe in one click. We respect your inbox.",
  },
]

const testimonials = [
  {
    quote: "I saved over $200 last month just from deals in the digest. It's become a Saturday morning ritual.",
    author: "Maria T.",
    subtitle: "Lompoc local",
  },
  {
    quote: "Found my favorite new restaurant through the digest. Now I go every week.",
    author: "James R.",
    subtitle: "Downtown resident",
  },
  {
    quote: "As a small business owner, the digest brings in real customers. As a shopper, it saves me money.",
    author: "Sandra K.",
    subtitle: "Business owner & subscriber",
  },
]

const sampleDeals = [
  {
    business: "Lompoc Brewing Co.",
    category: "Food & Drink",
    deal: "Happy Hour — 20% off all pints",
    badge: "Today only",
    color: "bg-brand-terracotta/10 text-brand-terracotta",
  },
  {
    business: "Valley Flowers",
    category: "Shopping",
    deal: "Spring bouquets from $18 — this weekend only",
    badge: "Weekend deal",
    color: "bg-success/10 text-success",
  },
  {
    business: "Central Coast Yoga",
    category: "Wellness",
    deal: "First class free for new students",
    badge: "New offer",
    color: "bg-accent text-accent-foreground",
  },
]

function InlineSubscribeForm() {
  return (
    <div className="w-full max-w-sm">
      <SubscribeForm />
    </div>
  )
}

export default function SubscribePage() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-accent via-background to-background px-4 py-16 sm:py-24">
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-brand-terracotta/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-1.5 text-sm font-medium text-primary">
            <Mail className="h-3.5 w-3.5" />
            Free weekly deals digest
          </div>

          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Your weekly shortcut
            <br />
            <span className="text-primary">to Lompoc savings</span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
            Every Saturday at 9am, get the top 10 deals from local Lompoc
            businesses — hand-picked and delivered free to your inbox.
          </p>

          <div className="mt-8 flex justify-center">
            <InlineSubscribeForm />
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Join 1,400+ Lompoc locals already saving every week
          </p>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="bg-background px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            Why locals love the digest
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample digest preview ── */}
      <section className="bg-muted/40 px-4 py-14">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            Here&apos;s what a typical digest looks like
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Real deals. Real savings. Real Lompoc businesses.
          </p>

          {/* Mock email preview */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-md">
            {/* Email header bar */}
            <div className="border-b border-border bg-accent/60 px-5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
                  <div className="h-2.5 w-2.5 rounded-full bg-gold/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-success/50" />
                </div>
                <span className="text-xs text-muted-foreground">
                  📬 Lompoc Deals — This week&apos;s top deals
                </span>
              </div>
            </div>

            {/* Email body */}
            <div className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  LD
                </div>
                <div>
                  <p className="text-xs font-semibold">Lompoc Deals</p>
                  <p className="text-xs text-muted-foreground">deals@lompocdeals.com</p>
                </div>
              </div>

              <h3 className="font-bold text-foreground">
                🛍️ This week&apos;s top 3 deals in Lompoc
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">Saturday, April 19 · 9:00 AM</p>

              <div className="mt-4 space-y-3">
                {sampleDeals.map(({ business, category, deal, badge, color }, i) => (
                  <div
                    key={business}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">{business}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}>
                          {badge}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{category}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{deal}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                + 7 more deals in the full digest &rarr;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="bg-background px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <div className="mb-2 text-4xl font-extrabold text-primary">1,400+</div>
            <p className="text-sm text-muted-foreground">Lompoc locals saving every week</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {testimonials.map(({ quote, author, subtitle }) => (
              <div
                key={author}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-gold text-gold"
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="mt-3">
                  <p className="text-xs font-semibold">{author}</p>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-primary px-4 py-14 text-primary-foreground">
        <div className="mx-auto max-w-xl text-center">
          <Mail className="mx-auto mb-4 h-10 w-10 opacity-80" />
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            Ready to start saving?
          </h2>
          <p className="mt-3 text-sm text-primary-foreground/80 sm:text-base">
            Join Lompoc locals who never miss a great deal. Free, every Saturday.
            Unsubscribe anytime.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-sm">
              <SubscribeForm variant="inverted" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
