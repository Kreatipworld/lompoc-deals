# Lompoc Locals — Brand Guide

A practical guide to keeping Lompoc Locals looking, sounding, and feeling
consistent. If you're writing copy, designing a screen, or building a component,
start here.

---

## 1. Brand at a glance

**Lompoc Locals** is a local deals and business directory for **Lompoc,
California and Vandenberg SFB** (ZIP codes 93436, 93437, 93438). Locals browse
deals; businesses list their shops and post deals; anyone can subscribe to an
optional weekly email digest.

**Brand essence:** community & communication — connecting neighbors with the
local businesses around them.

**One-line positioning:** The one place to find every deal, shop, and service in
the Lompoc valley.

**Taglines (use these exact ones — do not invent competing lines):**

- **Consumer:** "All of Lompoc, in one place."
- **Community:** "Live local. Love Lompoc."
- **For businesses:** "Get found by the whole valley."
- **Shop-local:** "We're stronger when we shop local."

> Scope note: Lompoc Locals is strictly Lompoc + Vandenberg. Never mention or
> imply coverage of other towns or counties.

---

## 2. Logo

The Lompoc Locals logo is a **purple standing "L" figure** with a **gold dot**
and a **green sprout**, set beside a two-line wordmark: **LOMPOC** in purple over
**LOCALS** in green.

The "L" figure reads as a person standing tall — a proud local — and the sprout
signals local growth and community. The gold dot adds a spark of warmth and
highlight.

**Where the asset lives:** the full-color logo is a React/SVG component at
`components/brand-logo.tsx`. Import it rather than pasting raster copies or
recreating the mark by hand.

### Clear space & minimum size

- **Clear space:** keep empty padding around the logo equal to at least the
  height of the "L" figure on all sides. Don't crowd it with text, buttons, or
  other graphics.
- **Minimum size:** don't render the full logo smaller than about **24px tall**
  for the mark (or where "LOMPOC / LOCALS" stops being clearly legible). Below
  that, use the standalone "L" figure mark instead of the full lockup.
- **Backgrounds:** prefer Cream (`#FAF7F2`) or white. On dark surfaces, use an
  approved light/knockout version — don't improvise.

### Do / Don't

**Do**
- Use the SVG from `components/brand-logo.tsx` so it stays crisp at any size.
- Give it room to breathe with generous clear space.
- Place it on clean, calm backgrounds (cream, white, or a solid brand color).

**Don't**
- Recolor the logo or swap the purple/green/gold for other colors.
- Stretch, squash, skew, or rotate it.
- Add drop shadows, glows, outlines, gradients, or other effects.
- Place it on busy photos, patterns, or low-contrast backgrounds.
- Rearrange the figure and wordmark or change their relationship.

---

## 3. Color palette

| Name     | Hex       | Usage |
|----------|-----------|-------|
| Purple   | `#650C75` | Primary brand color — logo, headers, structure, primary UI accents. |
| Green    | `#0B992F` | Savings, CTAs, success states, "LOCALS" wordmark. |
| Gold     | `#EFC618` | Highlight / featured only — sponsored, featured, or "spotlight" moments. |
| Cream    | `#FAF7F2` | Default page and section backgrounds. |
| Charcoal | `#1F1F1F` | Body text and most on-screen copy. |

### Do / Don't

**Do**
- Use **purple** for brand identity and structural UI (headers, nav, primary
  accents).
- Use **green** for savings, calls to action, and success — anything that says
  "act" or "you saved."
- Reserve **gold** for featured/highlighted items so it stays special.
- Use **cream** for backgrounds to keep the feel warm and neighborly.
- Use **charcoal** for text.

**Don't**
- Overuse gold — if everything is featured, nothing is.
- Use green for non-action decoration or purple for CTAs (keep the roles clear).
- Introduce off-brand colors for emphasis.

### Accessibility & contrast

- Body text should be **charcoal on cream/white** for strong, comfortable
  contrast.
- **Never** put gold text on cream/white — the contrast is too low. Use gold as
  a background chip/badge with charcoal or purple on top, or as an accent
  element, not as readable text.
- White text on **purple** or **green** works for buttons and badges; confirm it
  meets WCAG AA (4.5:1 for normal text) before shipping.
- Don't rely on color alone to convey meaning (e.g., pair "savings" green with a
  label or icon).

---

## 4. Typography

Keep type simple, friendly, and readable. Two roles: display and body.

- **Headings — bold geometric / display sans.** Confident, rounded-friendly,
  approachable. Used for page titles, section headers, deal names, and taglines.
- **Body — clean, readable humanist/neutral sans.** Comfortable at small sizes,
  great for deal details, business info, and the weekly digest.

*(No licensed font is mandated here — pick a well-supported geometric sans for
display and a clean sans for body, and use them consistently.)*

### Scale (guideline)

| Level        | Size (approx) | Weight        | Use |
|--------------|---------------|---------------|-----|
| Display / H1 | 32–40px       | Bold (700)    | Page hero, big taglines |
| H2           | 24–28px       | Bold (700)    | Section headers |
| H3           | 18–20px       | Semibold (600)| Card titles, deal names |
| Body         | 16px          | Regular (400) | Default copy |
| Small / meta | 13–14px       | Regular (400) | Labels, timestamps, fine print |

### Weight & style guidance

- Headings carry the personality — use **bold**; go semibold for smaller
  headers.
- Keep body text regular weight; use semibold sparingly for emphasis.
- Avoid all-caps for long text (fine for short labels/badges).
- Generous line height on body (≈1.5) keeps it easy to read for busy folks.
- Left-align most text. Reserve centered text for short hero lines.

---

## 5. Voice & tone

We sound like a **helpful neighbor**, not a corporate software vendor.

### Principles

- **Neighborly & warm.** Talk to people like you'd greet them on Ocean Ave.
- **Plain-spoken.** Everyday words. No jargon, no buzzwords.
- **Proud-local.** We love Lompoc and it shows.
- **Encouraging.** Make it easy and low-pressure to take the next step.
- **Short sentences.** Say it simply, then stop.
- **Second person.** "You," "your shop," "your neighbors."
- **Confident but humble.** We're helpful, not boastful or pushy.
- **Bilingual.** Everything works in English and Spanish; write so it translates
  cleanly and stays just as warm in both.

### We sound like / We don't sound like

| We sound like… | We don't sound like… |
|----------------|----------------------|
| "List your shop and get found by the whole valley." | "Leverage our platform to maximize local market penetration." |
| "You'll reach neighbors looking for exactly what you offer." | "Drive omnichannel customer acquisition at scale." |
| "It's free to get started." | "Unlock premium enterprise-grade onboarding today!" |
| "See this week's best deals." | "Explore our curated deal ecosystem." |
| "We're stronger when we shop local." | "Synergize community commerce verticals." |

### Before → after rewrites

**1. Corporate → neighborly**
- Before: "Lompoc Locals is a comprehensive digital platform that enables local
  enterprises to optimize their promotional strategy."
- After: "Lompoc Locals helps your shop get found and share deals with neighbors
  nearby."

**2. Pushy → encouraging**
- Before: "Sign up NOW and don't miss out — limited spots available!!!"
- After: "Ready when you are. It's free to list your business and post your first
  deal."

**3. Jargon → plain-spoken**
- Before: "Boost engagement and conversions with our data-driven audience
  targeting solution."
- After: "Reach the people already looking for what you offer, right here in
  town."

**4. Cold → warm & local**
- Before: "Subscribe to receive our weekly automated deal notification email."
- After: "Get the week's best local deals in your inbox — every week, one email."

---

## 6. Messaging pillars

Four ideas we come back to. Every piece of copy should ladder up to at least one.

**1. Community first**
We connect neighbors with the businesses around them; the point is a stronger
Lompoc.
> *Example:* "Live local. Love Lompoc — every deal here comes from a neighbor."

**2. Local & trusted**
Strictly Lompoc + Vandenberg. Real shops, real people, right in the valley.
> *Example:* "Every business here is one of your neighbors in the Lompoc valley."

**3. Real results — get found & sell deals**
Businesses get discovered by locals and move real deals — not vanity metrics.
> *Example:* "Get found by the whole valley and fill your slow days with deals."

**4. Simple & fair pricing**
Easy to start, honest pricing, nothing tricky — built for busy owners.
> *Example:* "Simple, fair pricing. Start free and post your first deal in
> minutes."

---

## 7. Boilerplate & taglines

### About Lompoc Locals

**Short (1 sentence):**
Lompoc Locals is the one place to find every deal, shop, and service in Lompoc
and Vandenberg.

**Medium (2–3 sentences):**
Lompoc Locals is a local deals and business directory for Lompoc, California and
Vandenberg SFB. Locals browse deals from neighborhood shops, and businesses list
their storefront and post deals to get found by the whole valley. Subscribe to
the optional weekly digest and never miss a good deal.

**Long (short paragraph):**
Lompoc Locals connects neighbors with the local businesses around them. It's a
simple deals-and-directory app for Lompoc, California and Vandenberg SFB, where
locals browse and save deals from restaurants, shops, salons, auto services,
wineries, and more — all right here in the valley. Businesses list their shop and
post deals to get found by nearby customers, with simple, fair pricing that works
for busy owners. Want the highlights delivered? Sign up for the optional weekly
email digest. Live local. Love Lompoc.

### Tagline usage

| Tagline | When to use |
|---------|-------------|
| "All of Lompoc, in one place." | Consumer-facing — the app, homepage, shopper marketing. |
| "Live local. Love Lompoc." | Community moments — social, brand, feel-good messaging. |
| "Get found by the whole valley." | Business-facing — signup, pitch, "list your shop" pages. |
| "We're stronger when we shop local." | Shop-local campaigns, seasonal pushes, community rallying. |

*Use the taglines exactly as written. Don't reword, remix, or create new ones.*

---

## 8. Quick writing checklist

Before you ship any copy, run it past this:

- [ ] Does it sound like a **helpful neighbor**, not a SaaS vendor?
- [ ] Short sentences? Everyday words? **No jargon or buzzwords?**
- [ ] Written in **second person** ("you," "your shop")?
- [ ] **Encouraging, not pushy** — no hype, no fake urgency, no all-caps yelling?
- [ ] **Confident but humble?**
- [ ] Only references **Lompoc + Vandenberg** (never other towns or counties)?
- [ ] Uses a **canonical tagline** where a tagline is needed (not an invented one)?
- [ ] Ladders up to at least one **messaging pillar**?
- [ ] Will it stay warm and clear in **both English and Spanish**?
- [ ] Colors on-brand: **green** for savings/CTAs, **gold** for featured only,
      **purple** for structure?
```
