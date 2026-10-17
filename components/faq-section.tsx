import { Link } from "@/i18n/navigation"

export type FaqItem = {
  q: string
  a: string
  /** Internal links that answer the question further (rendered under the answer). */
  links?: { href: string; label: string }[]
}

/**
 * Visible Q&A list + matching FAQPage JSON-LD. Server component, no data fetching —
 * copy comes from the caller (messages or a lib file), so it is safe on ISR pages.
 * The JSON-LD answers are exactly the visible answer text (Google requires a match).
 */
export function FaqSection({ heading, items, className = "" }: { heading: string; items: FaqItem[]; className?: string }) {
  if (items.length === 0) return null
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
  return (
    <section className={className}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <h2 className="font-display text-xl font-semibold tracking-tight">{heading}</h2>
      <dl className="mt-4 divide-y rounded-2xl border bg-card">
        {items.map((f) => (
          <div key={f.q} className="p-4 sm:p-5">
            <dt className="font-semibold">{f.q}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {f.a}
              {f.links && f.links.length > 0 && (
                <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {f.links.map((l) => (
                    <Link key={l.href} href={l.href} className="font-medium text-primary hover:underline">
                      {l.label} →
                    </Link>
                  ))}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
