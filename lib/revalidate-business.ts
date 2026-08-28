import { revalidatePath } from "next/cache"
import { routing } from "@/i18n/routing"

/**
 * Bust every cached page a business can appear on, in every locale.
 *
 * Routes live under app/[locale]/..., and with `localePrefix: "as-needed"`
 * the same page is cached at "/biz/x" (default locale) and "/es/biz/x". A
 * bare revalidatePath("/biz/x") only ever hit one of them — owners saved a
 * new photo and watched the old one stay put. This hits all of them, plus
 * the listing pages that render the business's card.
 */
export function revalidateBusinessSurfaces(opts: { slug: string; categorySlug?: string | null; previousSlug?: string | null }) {
  const prefixes = ["", ...routing.locales.map((l) => `/${l}`)]
  const pages = ["", "/businesses", "/map", "/locals", "/partners", "/deals", "/this-week"]
  for (const p of prefixes) {
    revalidatePath(`${p}/biz/${opts.slug}`)
    if (opts.previousSlug && opts.previousSlug !== opts.slug) revalidatePath(`${p}/biz/${opts.previousSlug}`)
    if (opts.categorySlug) revalidatePath(`${p}/category/${opts.categorySlug}`)
    for (const page of pages) revalidatePath(`${p}${page || "/"}`)
  }
  // Belt and braces: the dynamic-segment routes themselves.
  revalidatePath("/[locale]/biz/[slug]", "page")
  revalidatePath("/[locale]/category/[slug]", "page")
}
