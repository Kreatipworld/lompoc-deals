/**
 * /dev/components — internal visual QA page for rebrand work.
 * Not linked from the public nav. Used to preview all key UI components
 * side-by-side during brand token changes.
 *
 * Remove or gate behind admin check before final launch.
 */
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
/** Inline separator since ui/separator is not yet installed */
function Separator() {
  return <hr className="border-border" />
}
import {
  Tag,
  MapPin,
  Heart,
  Sparkles,
  CalendarDays,
  Search,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react"

const SAMPLE_DEAL = {
  id: "dev-1",
  title: "20% off all entrées — Tuesday only",
  discount: "20% OFF",
  category: "Food & Drink",
  businessName: "The Hitching Post II",
  slug: "hitching-post-ii",
  imageUrl: null,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
}

export const metadata = {
  title: "[DEV] Component QA — Lompoc Deals",
  robots: "noindex",
}

export default function DevComponentsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Component Visual QA
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal page for rebrand QA. Not linked from public nav.
        </p>
      </div>

      <Separator />

      {/* ── Color Palette ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Brand Palette</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Primary", bg: "bg-primary", fg: "text-primary-foreground" },
            { label: "Brand Green", bg: "bg-brand-green", fg: "text-brand-green-foreground" },
            { label: "Amber", bg: "bg-amber", fg: "text-amber-foreground" },
            { label: "Accent", bg: "bg-accent", fg: "text-accent-foreground" },
            { label: "Secondary", bg: "bg-secondary", fg: "text-secondary-foreground" },
            { label: "Muted", bg: "bg-muted", fg: "text-muted-foreground" },
            { label: "Destructive", bg: "bg-destructive", fg: "text-destructive-foreground" },
            { label: "Background", bg: "bg-background border", fg: "text-foreground" },
          ].map(({ label, bg, fg }) => (
            <div
              key={label}
              className={`${bg} ${fg} flex h-16 items-center justify-center rounded-lg text-sm font-medium`}
            >
              {label}
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── Typography ─────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Typography</h2>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Heading 1 — Display</h1>
          <h2 className="text-3xl font-semibold">Heading 2 — Display</h2>
          <h3 className="text-2xl font-semibold">Heading 3</h3>
          <h4 className="text-xl font-medium">Heading 4</h4>
          <p className="text-base text-foreground">
            Body text — The latest deals from Lompoc, California businesses.
          </p>
          <p className="text-sm text-muted-foreground">
            Small / muted — Updated daily. Browse coupons, specials, and announcements.
          </p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Eyebrow label
          </p>
        </div>
      </section>

      <Separator />

      {/* ── Buttons ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button className="gap-2">
            <Search className="h-4 w-4" />
            With icon
          </Button>
          <Button variant="outline" className="gap-2">
            <Heart className="h-4 w-4" />
            Save deal
          </Button>
        </div>
      </section>

      <Separator />

      {/* ── Badges ─────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge className="bg-amber text-amber-foreground">20% OFF</Badge>
          <Badge className="bg-brand-green text-brand-green-foreground">Verified</Badge>
          <Badge className="bg-accent text-accent-foreground">
            <Sparkles className="mr-1 h-3 w-3" />
            Featured
          </Badge>
        </div>
      </section>

      <Separator />

      {/* ── Cards ──────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cards</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Deal card mockup */}
          <Card className="overflow-hidden">
            <div className="flex h-36 items-center justify-center bg-accent">
              <Tag className="h-12 w-12 text-primary/40" />
            </div>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center justify-between">
                <Badge className="bg-amber text-amber-foreground text-xs">
                  {SAMPLE_DEAL.discount}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  <CalendarDays className="mr-1 inline h-3 w-3" />
                  7 days left
                </span>
              </div>
              <p className="mt-2 font-semibold leading-snug">
                {SAMPLE_DEAL.title}
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                {SAMPLE_DEAL.businessName}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {SAMPLE_DEAL.category}
                </Badge>
                <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
                  View <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stat card mockup */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">47</div>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="text-brand-green font-medium">+12%</span> vs last month
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ── Form Controls ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Form Controls</h2>
        <div className="max-w-sm space-y-3">
          <Input placeholder="Search deals in Lompoc…" />
          <Input placeholder="Email address" type="email" />
          <Input placeholder="Disabled" disabled />
        </div>
      </section>

      <Separator />

      {/* ── Alerts / States ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Status States</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-brand-green/30 bg-success-muted p-4 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            Success — Your deal was submitted and is pending review.
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Error — Something went wrong. Please try again.
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-amber/30 bg-amber-muted p-4 text-sm text-amber-foreground">
            <Info className="h-4 w-4 flex-shrink-0" />
            Info — Your subscription is up for renewal in 7 days.
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Category Chips (mockup) ─────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Category Chips</h2>
        <div className="flex flex-wrap gap-2">
          {["All", "Food & Drink", "Shopping", "Services", "Events", "Wineries", "Health"].map(
            (cat, i) => (
              <button
                key={cat}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  i === 0
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </section>

      <Separator />

      {/* ── Category Icons ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Icon Sizes</h2>
        <div className="flex items-end gap-6">
          {[4, 5, 6, 8, 10, 12].map((size) => (
            <div key={size} className="flex flex-col items-center gap-1">
              <Tag className={`h-${size} w-${size} text-primary`} />
              <span className="text-xs text-muted-foreground">{size * 4}px</span>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-lg border border-amber/30 bg-amber-muted p-4 text-sm text-amber-foreground">
        <strong>Dev note:</strong> This page is for rebrand QA only. Gate behind{" "}
        <code className="rounded bg-amber/20 px-1 py-0.5 text-xs font-mono">
          admin
        </code>{" "}
        or remove before final launch.
      </div>
    </div>
  )
}
