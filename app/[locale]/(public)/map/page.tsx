import { LompocInteractiveMapLoader } from "@/components/map/LompocInteractiveMapLoader"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { pageAlternates } from "@/lib/seo"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "map" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: pageAlternates("/map"),
  }
}

export default function MapPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      <LompocInteractiveMapLoader />
    </div>
  )
}
