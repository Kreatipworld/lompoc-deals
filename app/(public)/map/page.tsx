import { getMapBusinesses } from "@/lib/queries"
import { LompocMapLoader } from "@/components/lompoc-map-loader"

export const metadata = {
  title: "Map — Lompoc Deals",
  description: "Find Lompoc businesses and their deals on the map.",
}

export default async function MapPage() {
  const businesses = await getMapBusinesses()

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="border-b px-4 py-3">
        <h1 className="text-xl font-semibold">Lompoc map</h1>
        <p className="text-sm text-muted-foreground">
          {businesses.length}{" "}
          {businesses.length === 1 ? "business" : "businesses"} pinned. Click a
          marker to see their deals.
        </p>
      </div>
      <div className="flex-1">
        <LompocMapLoader businesses={businesses} />
      </div>
    </div>
  )
}
