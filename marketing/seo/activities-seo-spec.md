# Activities Page SEO Copy Specs
*Owner: CMO | Created: 2026-04-10 | Target: CTO — add to `generateMetadata` in `/activities/page.tsx` and `/activities/[slug]/page.tsx`*
*Related: REQ-013 (JSON-LD schema — TouristAttraction), M-019 (activities SEO strategy)*

---

## Why This Matters

`/activities` and `/activities/[slug]` are currently using Next.js default metadata (title = page component name or nothing). These pages target:

- `things to do in lompoc` — **500–1k/mo** (high intent, tourist + resident audience)
- `lompoc activities` — 100–500/mo
- `[activity name] lompoc` — long-tail per page (e.g., `jalama beach lompoc`, `la purisima mission`)

The `/activities` index page is the highest-leverage new SEO surface added since the directory pivot. Pair with TouristAttraction JSON-LD (REQ-013) for maximum impact.

**KPI target:** `/activities` page top-5 for `things to do in lompoc` within 90 days of going live with proper meta + schema.

---

## Implementation Notes for CTO

### `/activities/page.tsx` — Index page

Add or update `generateMetadata`:

```ts
export const metadata: Metadata = {
  title: "Things to Do in Lompoc, CA — Activities, Attractions & Adventures | Lompoc Deals",
  description: "Discover the best things to do in Lompoc, CA. La Purísima Mission, Jalama Beach, the Wine Ghetto, flower fields, rocket launches and more — free local guide.",
  keywords: [
    "things to do in lompoc",
    "lompoc activities",
    "lompoc attractions",
    "lompoc california things to do",
    "visit lompoc",
    "lompoc tourism",
    "qué hacer en lompoc",
  ],
  openGraph: {
    title: "Things to Do in Lompoc, CA",
    description: "La Purísima Mission, Jalama Beach, the Wine Ghetto, flower fields, rocket launches — and 10+ more. Lompoc's free local activity guide.",
    url: "https://lompoc-deals.vercel.app/activities",
    type: "website",
  },
  alternates: {
    canonical: "https://lompoc-deals.vercel.app/activities",
  },
};
```

### `/activities/[slug]/page.tsx` — Detail pages

Use the activity's own data to build dynamic metadata:

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const activity = await getActivityBySlug(params.slug);
  if (!activity) return {};

  return {
    title: `${activity.title} — Things to Do in Lompoc, CA | Lompoc Deals`,
    description: activity.shortDescription, // Already optimized in seed data
    keywords: [
      activity.title.toLowerCase(),
      `${activity.title.toLowerCase()} lompoc`,
      "things to do in lompoc",
      "lompoc activities",
      "visit lompoc",
    ],
    openGraph: {
      title: `${activity.title} | Lompoc Deals`,
      description: activity.shortDescription,
      url: `https://lompoc-deals.vercel.app/activities/${activity.slug}`,
      images: activity.imageUrl ? [{ url: activity.imageUrl }] : [],
      type: "article",
    },
    alternates: {
      canonical: `https://lompoc-deals.vercel.app/activities/${activity.slug}`,
    },
  };
}
```

**Note:** `activity.shortDescription` from the seed data is already written as a meta-quality summary (under 160 chars, keyword-included). Use it directly.

---

## Index Page (`/activities`) — Full Copy Spec

### Page Title (H1)
**EN:** `Things to Do in Lompoc, CA`
**ES:** `Qué Hacer en Lompoc, California`

### Page Subtitle / Intro (below H1)
**EN:** `Explore Lompoc's best activities, attractions, and adventures — from world-class wine tasting to rocket launch viewing, historic missions to rugged coastal beaches. Free local guide.`

**ES:** `Explora las mejores actividades, atracciones y aventuras de Lompoc — desde catas de vino de clase mundial hasta avistamiento de cohetes, misiones históricas y playas costeras. Guía local gratuita.`

### Category Filter Chip Labels (EN → ES)
| EN | ES |
|---|---|
| Outdoor & Nature | Al Aire Libre |
| Wine & Tasting Rooms | Vino y Catas |
| History & Culture | Historia y Cultura |
| Adventure & Sports | Aventura y Deportes |
| Family Friendly | Para Familias |
| Food & Dining | Gastronomía |
| Local Events | Eventos Locales |
| Arts & Murals | Arte y Murales |

### Empty State (no results for a filter)
**EN:** `No activities found for this category yet. Check back soon — we're adding more every week.`
**ES:** `Aún no hay actividades en esta categoría. Vuelve pronto — agregamos más cada semana.`

### SEO Footer Text (below the activity grid, helps long-tail ranking)
**EN:**
> Lompoc, CA is home to some of California's most distinctive experiences. The Lompoc Wine Ghetto — an industrial park with 20+ world-class Pinot Noir producers — sits minutes from the Santa Rita Hills AVA, one of America's premier cool-climate wine regions. La Purísima Mission State Historic Park offers 25 miles of trails through California history. Jalama Beach delivers remote, rugged Pacific coastline. And Vandenberg Space Force Base launches rockets overhead throughout the year. Browse all activities above and discover what makes the Flower Capital of the World worth visiting.

**ES:**
> Lompoc, California alberga algunas de las experiencias más distintivas del estado. El Wine Ghetto de Lompoc — un parque industrial con más de 20 productores de Pinot Noir de clase mundial — se encuentra a minutos de la AVA Sta. Rita Hills. El Parque Estatal Histórico de la Misión La Purísima ofrece 40 kilómetros de senderos a través de la historia de California. Jalama Beach brinda una costa del Pacífico remota y agreste. Y la Base de la Fuerza Espacial Vandenberg lanza cohetes durante todo el año. Explora todas las actividades arriba y descubre por qué vale la pena visitar la Capital Mundial de las Semillas Florales.

---

## Detail Page (`/activities/[slug]`) — Copy Spec

### Breadcrumb (already specced in schema-markup-spec.md)
`Lompoc Deals > Things to Do in Lompoc > [Activity Title]`
`Lompoc Deals > Qué Hacer en Lompoc > [Título de Actividad]` (ES)

### Back Link
**EN:** `← Back to Things to Do`
**ES:** `← Volver a Qué Hacer en Lompoc`

### Map Pin Label
**EN:** `[Activity Title]`
**ES:** `[Spanish title if available, else same]`

### Admission Section Label
**EN:** `Admission`
**ES:** `Entrada`

### Hours Section Label
**EN:** `Hours`
**ES:** `Horario`

### Tips Section Label
**EN:** `Local Tips`
**ES:** `Consejos Locales`

### "Best Season" Label
**EN:** `Best time to visit:`
**ES:** `Mejor época para visitar:`

### Season Display Values (EN → ES)
| EN | ES |
|---|---|
| Year-round | Todo el año |
| Spring | Primavera |
| Summer | Verano |
| Fall | Otoño |
| Winter | Invierno |

### Category Badge Labels (same as filter chips above)

### CTA Section (below activity details)
**EN heading:** `While you're in Lompoc`
**EN body:** `Browse local businesses, restaurants, and deals near [activity name].`
**EN CTA button:** `Explore Lompoc Deals →`

**ES heading:** `Mientras estás en Lompoc`
**ES body:** `Explora negocios locales, restaurantes y ofertas cerca de [nombre de actividad].`
**ES CTA button:** `Explorar Lompoc Deals →`

### Share Button Labels
**EN:** `Share this activity`
**ES:** `Compartir esta actividad`

---

## SEO Priority Order for CTO

| Priority | Page | Action |
|----------|------|--------|
| P0 | `/activities` index | Add `metadata` export with title/description/OG above |
| P0 | `/activities/[slug]` | Add dynamic `generateMetadata` using activity fields |
| P1 | Both | Add TouristAttraction + BreadcrumbList JSON-LD (spec in `schema-markup-spec.md`) |
| P1 | Both | Wire i18n for all UI labels above |
| P2 | `/activities` index | Add SEO footer text section (below grid) |

---

## Target Keywords Summary

| Keyword | Volume | Page |
|---------|--------|------|
| `things to do in lompoc` | 500–1k/mo | `/activities` index |
| `lompoc activities` | 100–500/mo | `/activities` index |
| `things to do in lompoc california` | 100–500/mo | `/activities` index |
| `visit lompoc` | 100–500/mo | `/activities` index |
| `qué hacer en lompoc` | 50–100/mo | `/activities` index (ES) |
| `jalama beach lompoc` | 100–500/mo | `/activities/jalama-beach-county-park` |
| `la purisima mission` | 500–1k/mo | `/activities/la-purisima-mission-state-historic-park` |
| `lompoc wine ghetto` | 100–500/mo | `/activities/lompoc-wine-ghetto` |
| `lompoc flower fields` | 100–500/mo | `/activities/lompoc-flower-fields` |
| `vandenberg rocket launch viewing` | 100–500/mo | `/activities/vandenberg-rocket-launch-viewing` |
